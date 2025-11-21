import type { SummaryBundle } from '../types/editor'
import { TEXT_LIMIT } from './slides'

export type SummarizerProvider = 'local' | 'openai'

export interface SummarizeParams {
  provider: SummarizerProvider
  apiKey?: string
  model?: string
}

const defaultBundle = (): SummaryBundle => ({
  summary: '',
  keyIdeas: [],
  bullets: [],
})

const cleanSentences = (text: string) =>
  text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)

const condense = (input: string, limit = TEXT_LIMIT) => {
  const cleaned = input.replace(/^[•\-–]/, '').replace(/\s+/g, ' ').trim()
  if (!cleaned) return ''
  if (cleaned.length <= limit) return cleaned
  const slice = cleaned.slice(0, limit)
  const breakpoints = ['. ', '! ', '? ', '; ', ', ', ' ']
  let cutIndex = -1
  breakpoints.forEach((token) => {
    const index = slice.lastIndexOf(token)
    if (index > cutIndex && index > limit * 0.4) {
      cutIndex = index
    }
  })
  const result = slice.slice(0, cutIndex > 0 ? cutIndex : limit).trim()
  return result
}

const clampSlideText = (value: string) => {
  const trimmed = value.replace(/\s+/g, ' ').trim()
  if (!trimmed) return ''
  if (trimmed.length <= TEXT_LIMIT) return trimmed
  return trimmed.slice(0, TEXT_LIMIT).trim()
}

const parseSlideStructure = (content: string): string[] => {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length)

  const slides: string[] = []
  let collecting = false
  let buffer: string[] = []

  const pushBuffer = () => {
    if (buffer.length) {
      slides.push(clampSlideText(buffer.join(' ')))
      buffer = []
    }
  }

  lines.forEach((line) => {
    const match = /^Slide\s*\d+\s*:?\s*(.*)$/i.exec(line)
    if (match) {
      pushBuffer()
      collecting = true
      const initial = match[1]?.trim()
      if (initial) {
        buffer.push(initial)
      }
    } else if (collecting) {
      buffer.push(line)
    }
  })

  pushBuffer()

  return slides.filter(Boolean)
}

const heuristicSummarize = (text: string, target = 4): SummaryBundle => {
  const sentences = cleanSentences(text)
  const paragraphs = text
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean)

  const summary = condense(sentences.slice(0, 2).join(' '), TEXT_LIMIT)
  const keyIdeas = sentences
    .slice(2, 2 + target * 2)
    .map((sentence) => condense(sentence, TEXT_LIMIT))
    .filter(Boolean)
    .slice(0, target)

  return {
    summary: summary || condense(paragraphs[0] || sentences[0] || 'Текст слишком короткий для суммаризации.', TEXT_LIMIT),
    keyIdeas: keyIdeas.length ? keyIdeas : paragraphs.slice(0, target).map((item) => condense(item, TEXT_LIMIT)),
    bullets: [],
  }
}

const callOpenAI = async (text: string, slideCount: number, apiKey: string, model = 'gpt-4o-mini'): Promise<SummaryBundle> => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content: `Ты стратег по Instagram-каруселям. Отвечай только конкретной выжимкой без воды. Итоговый JSON: {summary: string, keyIdeas: string[], bullets: []}.`,
        },
        {
          role: 'user',
          content: `Переработай текст в ${slideCount} слайдов, каждый из которых звучит как сильная мысль для Instagram-карусели.
- Не пересказывай дословно, переформулируй и ужимай.
- Убери всё второстепенное и вводные.
- 1 слайд = 1 тезис, максимум 1–3 строки.
- Никаких многоточий, кавычек, буллетов, вводных вроде "разберёмся".
- Тон: коротко, уверенно, инфостильно. Только факты из оригинала.
- Выводи строго в структуре:
Slide 1:
Slide 2:
...
Slide ${slideCount}:

Исходный текст:
"""${text}"""`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'LLM request failed')
  }

  const data = await response.json()
  const content: string = data?.choices?.[0]?.message?.content ?? ''
  try {
    const json = JSON.parse(content)
    const summary = typeof json.summary === 'string' ? json.summary : ''
    const keyIdeas = Array.isArray(json.keyIdeas) ? (json.keyIdeas as string[]) : []
    if (keyIdeas.length) {
      return {
        summary,
        keyIdeas: keyIdeas.slice(0, slideCount),
        bullets: [],
      }
    }
  } catch {
    // ignore parse error and try slide structure fallback
  }

  const structuredSlides = parseSlideStructure(content).slice(0, slideCount)
  if (structuredSlides.length) {
    return {
      summary: structuredSlides[0] ?? '',
      keyIdeas: structuredSlides,
      bullets: [],
    }
  }

  return heuristicSummarize(text, slideCount)
}

export const summarizeText = async (
  text: string,
  slideCount: number,
  params: SummarizeParams
): Promise<SummaryBundle> => {
  if (!text.trim()) {
    return defaultBundle()
  }

  if (params.provider === 'openai' && params.apiKey) {
    try {
      return await callOpenAI(text, slideCount, params.apiKey, params.model)
    } catch (error) {
      console.error(error)
      return heuristicSummarize(text, slideCount)
    }
  }

  return heuristicSummarize(text, slideCount)
}
