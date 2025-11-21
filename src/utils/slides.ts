import type { Slide, SummaryBundle, TextBlock } from '../types/editor'
import { generateBackground } from './backgrounds'
import { uid } from './id'

export const FONT_OPTIONS = [
  'Manrope',
  'Inter',
  'Montserrat',
  'PT Sans',
  'PT Serif',
  'Noto Sans',
  'Noto Serif',
  'IBM Plex Sans',
  'IBM Plex Serif',
  'Ubuntu',
  'Rubik',
  'Raleway',
  'Fira Sans',
  'Fira Sans Condensed',
  'Open Sans',
  'Playfair Display',
  'Merriweather',
  'Source Sans Pro',
  'Space Grotesk',
  'Bitter',
]

export const TEXT_LIMIT = 100

export const createTextBlock = (text = 'Новый текст'): TextBlock => ({
  id: uid(),
  text,
  fontSize: 40,
  fontFamily: 'Manrope',
  color: '#ffffff',
  fontWeight: 'bold',
  fontStyle: 'normal',
  align: 'left',
  shadow: {
    enabled: true,
    blur: 24,
    x: 0,
    y: 18,
    color: '#000000',
    opacity: 0.35,
  },
  position: { x: 80, y: 120 },
  size: { width: 420, height: 360 },
  backgroundOpacity: 0,
})

export const createSlide = (text = 'Добавь текст'): Slide => ({
  id: uid(),
  background: generateBackground(),
  textBlocks: [createTextBlock(text)],
})

const removeEmpty = (value?: string | null) => value?.trim().length

export const splitToSlides = (bundle: SummaryBundle, count: number): Slide[] => {
  const keyIdeas = bundle.keyIdeas.filter(removeEmpty).map((idea) => idea.trim())
  const summaryEntry = removeEmpty(bundle.summary) ? [bundle.summary.trim()] : []

  let prioritized: string[] = []
  if (keyIdeas.length) {
    prioritized = keyIdeas
  } else if (summaryEntry.length) {
    prioritized = summaryEntry
  }

  if (!prioritized.length && summaryEntry.length) {
    prioritized = summaryEntry
  }

  const sanitized = prioritized.map((entry) => clampToLimit(entry.trim(), TEXT_LIMIT)).filter(Boolean)

  if (!sanitized.length) {
    return Array.from({ length: count }, () => createSlide('Текст появится после суммаризации'))
  }

  const effectiveCount = Math.min(count, sanitized.length)
  const slides: Slide[] = sanitized.slice(0, effectiveCount).map((text) => createSlide(text))

  return slides
}

const distributeOverflow = (text: string, limit: number) => {
  const trimmed = text.trim()
  if (trimmed.length <= limit) return { keep: trimmed, overflow: '' }
  const slice = trimmed.slice(0, limit)
  const punctuationRegex = /[.!?]/g
  let punctuationIndex = -1
  let match: RegExpExecArray | null
  while ((match = punctuationRegex.exec(slice)) !== null) {
    punctuationIndex = match.index
  }
  const minSentenceLength = Math.max(20, Math.floor(limit * 0.4))
  if (punctuationIndex >= minSentenceLength) {
    const boundary = punctuationIndex + 1
    const keepSentence = slice.slice(0, boundary).trim()
    const overflowSentence = trimmed.slice(boundary).trim()
    if (keepSentence) {
      return { keep: keepSentence, overflow: overflowSentence }
    }
  }
  const lastSpace = slice.lastIndexOf(' ')
  const boundary = lastSpace >= minSentenceLength ? lastSpace : limit
  const keep = slice.slice(0, boundary).trim()
  const overflow = trimmed.slice(boundary).trim()
  return { keep, overflow }
}

const clampToLimit = (text: string, limit: number) => {
  const value = text.trim()
  if (value.length <= limit) return value
  if (limit <= 1) return value.slice(0, 1)
  const { keep } = distributeOverflow(value, limit)
  return keep
}

export const smartReflow = (slides: Slide[], limit = TEXT_LIMIT): Slide[] => {
  const clone = slides.map((slide) => ({
    ...slide,
    textBlocks: slide.textBlocks.length
      ? slide.textBlocks.map((block) => ({ ...block }))
      : [createTextBlock('')],
  }))

  for (let i = 0; i < clone.length; i += 1) {
    let pointer = i
    let block = clone[pointer].textBlocks[0]
    if (!block) continue

    while (block.text.length > limit) {
      const { keep, overflow } = distributeOverflow(block.text, limit)
      block.text = keep
      if (!overflow) break

      if (pointer + 1 >= clone.length) {
        block.text = clampToLimit(keep, limit)
        break
      }
      if (!clone[pointer + 1].textBlocks[0]) {
        clone[pointer + 1].textBlocks.unshift(createTextBlock(''))
      }

      pointer += 1
      block = clone[pointer].textBlocks[0]
      block.text = `${overflow}\n${block.text}`.trim()
    }
  }

  return clone
}

export const balanceSlides = (slides: Slide[]): Slide[] => {
  const combined = slides
    .map((slide) => slide.textBlocks[0]?.text ?? '')
    .filter(Boolean)
    .join(' ')
    .trim()

  if (!combined) return slides
  const target = Math.ceil(combined.length / slides.length)
  const words = combined.split(' ')
  const nextSlides = slides.map((slide) => ({
    ...slide,
    textBlocks: slide.textBlocks.map((block, index) =>
      index === 0
        ? {
            ...block,
            text: '',
          }
        : block
    ),
  }))

  let pointer = 0
  nextSlides.forEach((slide) => {
    const block = slide.textBlocks[0]
    if (!block) return
    let text = ''
    while (pointer < words.length && text.length + words[pointer].length + 1 < target) {
      text = `${text} ${words[pointer]}`.trim()
      pointer += 1
    }
    block.text = text || words[pointer++] || ''
  })

  if (pointer < words.length) {
    const remainder = words.slice(pointer).join(' ')
    const last = nextSlides[nextSlides.length - 1]?.textBlocks[0]
    if (last) {
      const merged = `${last.text} ${remainder}`.trim()
      last.text = clampToLimit(merged, TEXT_LIMIT)
    }
  }

  return nextSlides
}

export const readabilityScore = (colorA: string, colorB: string) => {
  const hexToRgb = (hex: string) => {
    const normalized = hex.replace('#', '')
    const bigint = parseInt(normalized.length === 3 ? normalized.repeat(2) : normalized, 16)
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    }
  }
  const luminance = (hex: string) => {
    const { r, g, b } = hexToRgb(hex)
    const [R, G, B] = [r, g, b].map((value) => {
      const channel = value / 255
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * R + 0.7152 * G + 0.0722 * B
  }

  const l1 = luminance(colorA) + 0.05
  const l2 = luminance(colorB) + 0.05
  const ratio = l1 > l2 ? l1 / l2 : l2 / l1
  return Number(ratio.toFixed(2))
}
