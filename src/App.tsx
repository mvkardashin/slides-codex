import { useMemo, useRef, useState } from 'react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { toJpeg, toPng } from 'html-to-image'
import { SlideCanvas } from './components/SlideCanvas'
import { Toolbar } from './components/Toolbar'
import { ThumbnailRail } from './components/ThumbnailRail'
import { TemplatesGallery } from './components/TemplatesGallery'
import { ProcessSteps } from './components/ProcessSteps'
import { useAutoSave } from './hooks/useAutoSave'
import { TEMPLATE_LIBRARY, generateBackground } from './utils/backgrounds'
import {
  TEXT_LIMIT,
  balanceSlides,
  createSlide,
  createTextBlock,
  readabilityScore,
  smartReflow,
  splitToSlides,
} from './utils/slides'
import { summarizeText } from './utils/summarizer'
import type { ProjectState, Slide, TemplatePreset, TextBlock } from './types/editor'
import { ASPECT_RATIOS } from './utils/constants'
import { uid } from './utils/id'

const createInitialProject = (): ProjectState => {
  const slides = [createSlide('Вставь длинный текст, нажми Summarize и получи красивые слайды.')]
  return {
    inputText: '',
    slideCount: 6,
    slides,
    activeSlideId: slides[0].id,
    aspectRatio: '4:5',
    summaryBundle: null,
    theme: 'dark',
    quality: 90,
    format: 'png',
  }
}

const cloneState = (state: ProjectState): ProjectState =>
  typeof structuredClone === 'function' ? structuredClone(state) : (JSON.parse(JSON.stringify(state)) as ProjectState)

const dataUrlToBlob = async (dataUrl: string) => {
  const response = await fetch(dataUrl)
  return response.blob()
}

function App() {
  const [project, setProject] = useState<ProjectState>(() => createInitialProject())
  const [stage, setStage] = useState<'input' | 'summary' | 'slides' | 'export'>('input')
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(project.slides[0]?.textBlocks[0]?.id ?? null)
  const [provider, setProvider] = useState<'local' | 'openai'>('local')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gpt-4o-mini')
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [historyVersion, setHistoryVersion] = useState(0)
  const historyRef = useRef<ProjectState[]>([])
  const futureRef = useRef<ProjectState[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const replaceProject = (next: ProjectState) => {
    setProject(next)
    setSelectedBlockId(next.slides.find((slide) => slide.id === next.activeSlideId)?.textBlocks[0]?.id ?? next.slides[0]?.textBlocks[0]?.id ?? null)
    historyRef.current = []
    futureRef.current = []
    setHistoryVersion((value) => value + 1)
    setStage('slides')
  }

  useAutoSave<ProjectState>('slide-summarizer-project', project, (payload) => {
    if (payload?.slides?.length) {
      replaceProject(payload)
    }
  })

  const activeSlide = (project.slides.find((slide) => slide.id === project.activeSlideId) ?? project.slides[0])!
  const selectedBlock =
    activeSlide?.textBlocks.find((block) => block.id === selectedBlockId) ?? activeSlide?.textBlocks[0] ?? null

  const handleCommit = (recipe: (draft: ProjectState) => void, after?: (draft: ProjectState) => void) => {
    setProject((prev) => {
      const draft = cloneState(prev)
      recipe(draft)
      after?.(draft)
      historyRef.current.push(cloneState(prev))
      if (historyRef.current.length > 40) {
        historyRef.current.shift()
      }
      futureRef.current = []
      setHistoryVersion((value) => value + 1)
      return draft
    })
  }

  const canUndo = historyRef.current.length > 0
  const canRedo = futureRef.current.length > 0

  const handleUndo = () => {
    if (!historyRef.current.length) return
    setProject((current) => {
      const previous = historyRef.current.pop()!
      futureRef.current.push(cloneState(current))
      setHistoryVersion((value) => value + 1)
      return previous
    })
  }

  const handleRedo = () => {
    if (!futureRef.current.length) return
    setProject((current) => {
      const next = futureRef.current.pop()!
      historyRef.current.push(cloneState(current))
      setHistoryVersion((value) => value + 1)
      return next
    })
  }

  const handleBlockChange = (blockId: string, changes: Partial<TextBlock>) => {
    if (!activeSlide) return
    handleCommit((draft) => {
      const slide = draft.slides.find((item) => item.id === activeSlide.id)
      if (!slide) return
      slide.textBlocks = slide.textBlocks.map((block) => {
        if (block.id !== blockId) return block
        return {
          ...block,
          ...changes,
          position: changes.position ? { ...block.position, ...changes.position } : block.position,
          size: changes.size ? { ...block.size, ...changes.size } : block.size,
          shadow: changes.shadow ? { ...block.shadow, ...changes.shadow } : block.shadow,
        }
      })
    })
  }

  const handleAddBlock = () => {
    if (!activeSlide) return
    handleCommit((draft) => {
      const slide = draft.slides.find((item) => item.id === activeSlide.id)
      if (!slide) return
      const block = createTextBlock('Новый текстовый блок')
      block.position = { x: 60, y: 60 + slide.textBlocks.length * 40 }
      block.size = { width: 360, height: 220 }
      slide.textBlocks.push(block)
      setSelectedBlockId(block.id)
    })
  }

  const handleSummarize = async () => {
    if (!project.inputText.trim()) return
    setIsSummarizing(true)
    setStage('summary')
    try {
      const bundle = await summarizeText(project.inputText, project.slideCount, {
        provider,
        apiKey: apiKey.trim(),
        model: model.trim(),
      })
      handleCommit(
        (draft) => {
          draft.summaryBundle = bundle
          draft.slides = splitToSlides(bundle, draft.slideCount)
          draft.activeSlideId = draft.slides[0]?.id ?? null
        },
        (draft) => {
          setSelectedBlockId(draft.slides[0]?.textBlocks[0]?.id ?? null)
          setStage('slides')
        }
      )
    } catch (error) {
      console.error(error)
      setStage('input')
    } finally {
      setIsSummarizing(false)
    }
  }

  const handleSelectSlide = (id: string) => {
    setProject((prev) => ({ ...prev, activeSlideId: id }))
    const slide = project.slides.find((item) => item.id === id)
    setSelectedBlockId(slide?.textBlocks[0]?.id ?? null)
  }

  const handleDuplicateSlide = (id: string) => {
    handleCommit((draft) => {
      const index = draft.slides.findIndex((slide) => slide.id === id)
      if (index === -1) return
      const duplicated: Slide = {
        ...draft.slides[index],
        id: uid(),
        textBlocks: draft.slides[index].textBlocks.map((block) => ({
          ...block,
          id: uid(),
        })),
      }
      draft.slides.splice(index + 1, 0, duplicated)
    })
  }

  const handleDeleteSlide = (id: string) => {
    if (project.slides.length === 1) return
    handleCommit((draft) => {
      draft.slides = draft.slides.filter((slide) => slide.id !== id)
      draft.activeSlideId = draft.slides[0]?.id ?? null
    })
  }

  const handleRegenerateBackground = () => {
    if (!activeSlide) return
    handleCommit((draft) => {
      const slide = draft.slides.find((item) => item.id === activeSlide.id)
      if (!slide) return
      slide.background = generateBackground()
    })
  }

  const handleAspectChange = (ratio: ProjectState['aspectRatio']) => {
    handleCommit((draft) => {
      draft.aspectRatio = ratio
    })
  }

  const handleBalanceSlides = () => {
    handleCommit((draft) => {
      draft.slides = balanceSlides(draft.slides)
    })
  }

  const handleSmartReflow = () => {
    handleCommit((draft) => {
      draft.slides = smartReflow(draft.slides)
    })
  }

  const handleTemplateApply = (template: TemplatePreset) => {
    handleCommit(
      (draft) => {
        draft.slides = template.slides.map((slide) => ({
          ...slide,
          id: uid(),
          textBlocks: slide.textBlocks.map((block) => ({ ...block, id: uid() })),
        }))
        draft.activeSlideId = draft.slides[0]?.id ?? null
      },
      (draft) => setSelectedBlockId(draft.slides[0]?.textBlocks[0]?.id ?? null)
    )
  }

  const handleSlideCountChange = (count: number) => {
    setProject((prev) => ({ ...prev, slideCount: count }))
  }

  const handleProjectReset = () => {
    replaceProject(createInitialProject())
  }

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
    saveAs(blob, 'slide-summarizer-project.json')
  }

  const handleImportJSON = async (file?: File | null) => {
    const targetFile = file ?? fileInputRef.current?.files?.[0]
    if (!targetFile) return
    try {
      const text = await targetFile.text()
      const parsed = JSON.parse(text) as ProjectState
      if (!parsed.slides?.length) throw new Error('Нет слайдов в проекте')
      replaceProject(parsed)
      setImportError(null)
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Не удалось загрузить проект')
    }
  }

  const handleThemeToggle = () => {
    handleCommit((draft) => {
      draft.theme = draft.theme === 'dark' ? 'light' : 'dark'
    })
  }

  const readability = useMemo(() => {
    if (!activeSlide || !selectedBlock) return null
    return readabilityScore(selectedBlock.color, activeSlide.background.accent)
  }, [activeSlide, selectedBlock, historyVersion])

  const readabilityWarning =
    readability && readability < 4.5
      ? `Контраст ${readability}:1 — улучшите цвет или тень`
      : undefined

  const textLimitWarning =
    selectedBlock && selectedBlock.text.length > TEXT_LIMIT
      ? `Лимит ${TEXT_LIMIT} символов превышен — Smart reflow перенесёт лишний текст`
      : null

  const renderSlideToImage = async (slide: Slide, forcedFormat?: 'png' | 'jpeg') => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return ''
    const { targetResolution } = ASPECT_RATIOS[project.aspectRatio]
    const node = document.createElement('div')
    node.style.width = `${targetResolution.width}px`
    node.style.height = `${targetResolution.height}px`
    node.style.position = 'relative'
    node.style.display = 'block'
    node.style.backgroundImage = slide.background.css
    node.style.backgroundSize = 'cover'
    node.style.backgroundPosition = 'center'
    node.style.padding = '0px'
    node.style.boxSizing = 'border-box'
    node.style.fontFamily = 'Space Grotesk, Inter, sans-serif'
    node.style.color = '#ffffff'

    const scale = targetResolution.width / 520
    slide.textBlocks.forEach((block) => {
      const textEl = document.createElement('div')
      textEl.textContent = block.text
      textEl.style.position = 'absolute'
      textEl.style.left = `${block.position.x * scale}px`
      textEl.style.top = `${block.position.y * scale}px`
      textEl.style.width = `${block.size.width * scale}px`
      textEl.style.height = `${block.size.height * scale}px`
      textEl.style.fontFamily = block.fontFamily
      textEl.style.fontSize = `${block.fontSize * scale}px`
      textEl.style.fontWeight = block.fontWeight
      textEl.style.fontStyle = block.fontStyle
      textEl.style.textAlign = block.align
      textEl.style.color = block.color
      textEl.style.padding = '16px'
      textEl.style.boxSizing = 'border-box'
      textEl.style.borderRadius = '24px'
      textEl.style.backgroundColor = `rgba(0,0,0,${block.backgroundOpacity})`
      if (block.shadow.enabled) {
        textEl.style.textShadow = `${block.shadow.x * scale}px ${block.shadow.y * scale}px ${block.shadow.blur * scale}px rgba(0,0,0,${block.shadow.opacity})`
      }
      node.appendChild(textEl)
    })

    document.body.appendChild(node)
    try {
      const format = forcedFormat ?? project.format
      const pixelRatio = Math.min(window.devicePixelRatio ?? 2, 3)
      const dataUrl =
        format === 'png'
          ? await toPng(node, { cacheBust: true, pixelRatio })
          : await toJpeg(node, { cacheBust: true, pixelRatio, quality: project.quality / 100 })
      return dataUrl
    } finally {
      document.body.removeChild(node)
    }
  }

  const handleDownloadSlide = async () => {
    if (!activeSlide) return
    const image = await renderSlideToImage(activeSlide)
    if (!image) return
    const blob = await dataUrlToBlob(image)
    saveAs(blob, `slide-${project.slides.indexOf(activeSlide) + 1}.${project.format}`)
    setStage('export')
  }

  const handleDownloadAll = async () => {
    const zip = new JSZip()
    for (let i = 0; i < project.slides.length; i += 1) {
      const dataUrl = await renderSlideToImage(project.slides[i])
      if (!dataUrl) continue
      const base64 = dataUrl.split(',')[1]
      zip.file(`slide-${i + 1}.${project.format}`, base64, { base64: true })
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    saveAs(blob, `slides-bundle.zip`)
    setStage('export')
  }

  const handlePreview = async () => {
    if (!activeSlide) return
    const dataUrl = await renderSlideToImage(activeSlide, 'png')
    setPreviewUrl(dataUrl)
    setStage('export')
  }

  return (
    <div data-theme={project.theme} className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="uppercase tracking-[0.4em] text-xs text-[var(--text-muted)]">SlideSummarizer</p>
            <h1 className="text-4xl font-semibold text-[var(--text-primary)]">Минималистичный редактор для Instagram</h1>
            <p className="text-[var(--text-muted)]">Автосуммаризация, стилизованные слайды и экспорт в пару кликов.</p>
          </div>
          <button
            className="px-4 py-2 rounded-full border border-[var(--panel-border)] text-sm text-[var(--text-primary)] bg-[var(--panel-bg)]"
            onClick={handleThemeToggle}
          >
            Сменить тему ({project.theme === 'dark' ? 'Dark' : 'Light'})
          </button>
        </header>

        <ProcessSteps current={stage} />

        <section className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-6 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-6">
          <div className="flex flex-col gap-3">
            <label className="text-sm uppercase tracking-[0.3em] text-[var(--text-muted)]">Исходный текст</label>
            <textarea
              className="w-full min-h-[220px] rounded-3xl p-5 bg-[var(--panel-strong)] border border-[var(--panel-border)] text-[var(--text-primary)] text-lg leading-relaxed"
              placeholder="Вставьте текстовую запись, статью или сценарий..."
              value={project.inputText}
              onChange={(event) => setProject((prev) => ({ ...prev, inputText: event.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-4">
            <label className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Кол-во слайдов</label>
            <input
              type="range"
              min={4}
              max={12}
              value={project.slideCount}
              onChange={(event) => handleSlideCountChange(Number(event.target.value))}
            />
            <div className="text-sm text-[var(--text-muted)]">Выбор: {project.slideCount} слайдов</div>
            <label className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">LLM Provider</label>
            <select
              className="bg-[var(--panel-strong)] border border-[var(--panel-border)] rounded-2xl px-3 py-2 text-[var(--text-primary)]"
              value={provider}
              onChange={(event) => setProvider(event.target.value as 'local' | 'openai')}
            >
              <option value="local">Offline heuristic</option>
              <option value="openai">OpenAI Chat Completions</option>
            </select>
            {provider === 'openai' && (
              <>
                <input
                  className="bg-[var(--panel-strong)] border border-[var(--panel-border)] rounded-2xl px-3 py-2 text-[var(--text-primary)]"
                  type="password"
                  placeholder="API Key"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                />
                <input
                  className="bg-[var(--panel-strong)] border border-[var(--panel-border)] rounded-2xl px-3 py-2 text-[var(--text-primary)]"
                  placeholder="Model (например, gpt-4o-mini)"
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                />
              </>
            )}
            <button
              className="rounded-2xl py-3 font-semibold bg-[var(--button-accent)] text-[var(--button-accent-text)]"
              onClick={handleSummarize}
              disabled={isSummarizing}
            >
              {isSummarizing ? 'Summarizing...' : 'Summarize'}
            </button>
            <p className="text-xs text-[var(--text-muted)]">
              Никакие данные не покидают браузер, если не указан API ключ. Автосохранение в LocalStorage активно.
            </p>
          </div>
        </section>

        {project.summaryBundle && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)] mb-2">Резюме</p>
              <p className="text-[var(--text-primary)]">{project.summaryBundle.summary}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)] mb-2">Ключевые мысли</p>
              <ul className="space-y-1 text-[var(--text-primary)]">
                {project.summaryBundle.keyIdeas.map((idea, index) => (
                  <li key={idea + index}>• {idea}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)] mb-2">Пункты</p>
              <ul className="space-y-1 text-[var(--text-primary)]">
                {project.summaryBundle.bullets.map((bullet, index) => (
                  <li key={bullet + index}>– {bullet}</li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-3 flex gap-3 flex-wrap">
              <button
                className="px-4 py-2 rounded-full bg-[var(--panel-strong)] text-[var(--text-primary)]"
                onClick={handleBalanceSlides}
              >
                Balance text across slides
              </button>
              <button className="px-4 py-2 rounded-full bg-[var(--panel-strong)] text-[var(--text-primary)]" onClick={handleSmartReflow}>
                Smart reflow limit
              </button>
            </div>
          </section>
        )}

        <TemplatesGallery templates={TEMPLATE_LIBRARY} onApply={handleTemplateApply} />

        <section className="flex flex-col xl:flex-row gap-6">
          <Toolbar
            selectedBlock={selectedBlock}
            onBlockChange={(changes) => selectedBlock && handleBlockChange(selectedBlock.id, changes)}
            onAddBlock={handleAddBlock}
            onRegenerateBackground={handleRegenerateBackground}
            aspectRatio={project.aspectRatio}
            onAspectChange={handleAspectChange}
            onBalanceSlides={handleBalanceSlides}
            onSmartReflow={handleSmartReflow}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            onDownloadSlide={handleDownloadSlide}
            onDownloadAll={handleDownloadAll}
            quality={project.quality}
            onQualityChange={(value) => setProject((prev) => ({ ...prev, quality: value }))}
            format={project.format}
            onFormatChange={(fmt) => setProject((prev) => ({ ...prev, format: fmt }))}
          />
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Активный слайд</p>
                <h3 className="text-2xl font-semibold text-[var(--text-primary)]">{activeSlide?.background.label}</h3>
              </div>
              <div className="text-sm text-[var(--text-muted)]">
                {selectedBlock?.text.length ?? 0}/{TEXT_LIMIT} символов
              </div>
            </div>
            <SlideCanvas
              slide={activeSlide}
              aspectRatio={project.aspectRatio}
              selectedBlockId={selectedBlockId}
              onSelectBlock={setSelectedBlockId}
              onBlockChange={handleBlockChange}
              readibilityWarning={readabilityWarning}
            />
            {textLimitWarning && (
              <p className="text-sm text-amber-300 bg-amber-500/10 rounded-2xl px-4 py-3">{textLimitWarning}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 rounded-full bg-[var(--panel-strong)] text-[var(--text-primary)]" onClick={handlePreview}>
                Preview current slide
              </button>
              <button className="px-4 py-2 rounded-full bg-[var(--panel-strong)] text-[var(--text-primary)]" onClick={() => setStage('export')}>
                Перейти к экспорту
              </button>
            </div>
            {previewUrl && (
              <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)] mb-2">Preview</p>
                <img src={previewUrl} alt="Slide preview" className="rounded-2xl w-full" />
              </div>
            )}
          </div>
          <ThumbnailRail
            slides={project.slides}
            activeSlideId={project.activeSlideId}
            onSelectSlide={handleSelectSlide}
            onDuplicateSlide={handleDuplicateSlide}
            onDeleteSlide={handleDeleteSlide}
          />
        </section>

        <section className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-6 flex flex-wrap gap-4 items-center">
          <button className="px-4 py-2 rounded-full bg-[var(--panel-strong)] text-[var(--text-primary)]" onClick={handleExportJSON}>
            Export JSON
          </button>
          <label className="px-4 py-2 rounded-full bg-[var(--panel-strong)] text-[var(--text-primary)] cursor-pointer">
            Import JSON
            <input
              type="file"
              accept="application/json"
              className="hidden"
              ref={fileInputRef}
              onChange={(event) => handleImportJSON(event.target.files?.[0])}
            />
          </label>
          <button className="px-4 py-2 rounded-full bg-[var(--panel-strong)] text-[var(--text-primary)]" onClick={handleProjectReset}>
            Новый проект
          </button>
          {importError && <p className="text-sm text-red-400">{importError}</p>}
        </section>
      </div>
    </div>
  )
}

export default App
