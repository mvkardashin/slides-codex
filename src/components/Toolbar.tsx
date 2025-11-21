import type { AspectRatioKey, TextBlock } from '../types/editor'
import { ASPECT_RATIOS } from '../utils/constants'
import { FONT_OPTIONS } from '../utils/slides'

export interface ToolbarProps {
  selectedBlock: TextBlock | null
  onBlockChange: (changes: Partial<TextBlock>) => void
  onAddBlock: () => void
  onRegenerateBackground: () => void
  aspectRatio: AspectRatioKey
  onAspectChange: (ratio: AspectRatioKey) => void
  onBalanceSlides: () => void
  onSmartReflow: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onDownloadSlide: () => void
  onDownloadAll: () => void
  quality: number
  onQualityChange: (value: number) => void
  format: 'png' | 'jpeg'
  onFormatChange: (format: 'png' | 'jpeg') => void
}

export const Toolbar = ({
  selectedBlock,
  onBlockChange,
  onAddBlock,
  onRegenerateBackground,
  aspectRatio,
  onAspectChange,
  onBalanceSlides,
  onSmartReflow,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onDownloadSlide,
  onDownloadAll,
  quality,
  onQualityChange,
  format,
  onFormatChange,
}: ToolbarProps) => {
  const handleChange = (changes: Partial<TextBlock>) => {
    if (!selectedBlock) return
    onBlockChange(changes)
  }

  return (
    <aside className="w-72 bg-[var(--panel-bg)] rounded-3xl p-4 flex flex-col gap-6 text-[var(--text-primary)] backdrop-blur border border-[var(--panel-border)]">
      <section className="space-y-2">
        <h3 className="text-sm uppercase tracking-widest text-[var(--text-muted)]">Текст</h3>
        <select
          className="w-full bg-[var(--panel-strong)] rounded-2xl px-3 py-2 text-sm focus:outline-none text-[var(--text-primary)] border border-[var(--panel-border)]"
          value={selectedBlock?.fontFamily}
          onChange={(event) => handleChange({ fontFamily: event.target.value })}
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-[var(--text-muted)]">
          Размер {selectedBlock?.fontSize ?? 0}px
          <input
            type="range"
            min={16}
            max={96}
            value={selectedBlock?.fontSize ?? 32}
            onChange={(event) => handleChange({ fontSize: Number(event.target.value) })}
          />
        </label>
        <div className="flex items-center justify-between gap-3">
          <label className="flex flex-col text-xs uppercase tracking-wide text-[var(--text-muted)]">
            Цвет
            <input
              type="color"
              value={selectedBlock?.color ?? '#ffffff'}
              onChange={(event) => handleChange({ color: event.target.value })}
              className="h-10 w-10 rounded-full border border-[var(--panel-border)] bg-transparent cursor-pointer"
            />
          </label>
          <label className="flex flex-col text-xs uppercase tracking-wide text-[var(--text-muted)] flex-1">
            Прозрачность блока
            <input
              type="range"
              min={0}
              max={0.8}
              step={0.05}
              value={selectedBlock?.backgroundOpacity ?? 0}
              onChange={(event) => handleChange({ backgroundOpacity: Number(event.target.value) })}
            />
          </label>
        </div>
        <div className="flex items-center justify-between text-sm text-[var(--text-primary)] opacity-80">
          <button
            className={`px-3 py-2 rounded-2xl border ${selectedBlock?.fontWeight === 'bold' ? 'border-[var(--button-accent)] bg-[var(--panel-strong)]' : 'border-[var(--panel-border)]'}`}
            onClick={() => handleChange({ fontWeight: selectedBlock?.fontWeight === 'bold' ? 'normal' : 'bold' })}
          >
            Bold
          </button>
          <button
            className={`px-3 py-2 rounded-2xl border ${selectedBlock?.fontStyle === 'italic' ? 'border-[var(--button-accent)] bg-[var(--panel-strong)]' : 'border-[var(--panel-border)]'}`}
            onClick={() => handleChange({ fontStyle: selectedBlock?.fontStyle === 'italic' ? 'normal' : 'italic' })}
          >
            Italic
          </button>
          <div className="flex gap-2">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                className={`px-3 py-2 rounded-2xl border capitalize ${selectedBlock?.align === align ? 'border-[var(--button-accent)] bg-[var(--panel-strong)]' : 'border-[var(--panel-border)]'}`}
                onClick={() => handleChange({ align })}
              >
                {align}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-[var(--text-muted)]">
            <span>Тень</span>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedBlock?.shadow.enabled ?? false}
                onChange={(event) =>
                  handleChange({
                    shadow: {
                      ...(selectedBlock?.shadow ?? { blur: 20, x: 0, y: 10, color: '#000000', opacity: 0.4 }),
                      enabled: event.target.checked,
                    },
                  })
                }
              />
              <span>on/off</span>
            </label>
          </div>
          <label className="flex flex-col text-xs text-[var(--text-muted)] gap-1">
            Blur {selectedBlock?.shadow.blur ?? 0}px
            <input
              type="range"
              min={0}
              max={60}
              value={selectedBlock?.shadow.blur ?? 20}
              onChange={(event) =>
                handleChange({
                  shadow: {
                    ...(selectedBlock?.shadow ?? { enabled: true, blur: 20, x: 0, y: 10, color: '#000000', opacity: 0.4 }),
                    blur: Number(event.target.value),
                  },
                })
              }
            />
          </label>
          <label className="flex flex-col text-xs text-[var(--text-muted)] gap-1">
            Intensity {(selectedBlock?.shadow.opacity ?? 0) * 100}%
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={selectedBlock?.shadow.opacity ?? 0.4}
              onChange={(event) =>
                handleChange({
                  shadow: {
                    ...(selectedBlock?.shadow ?? { enabled: true, blur: 20, x: 0, y: 10, color: '#000000', opacity: 0.4 }),
                    opacity: Number(event.target.value),
                  },
                })
              }
            />
          </label>
        </div>
        <button
          className="w-full bg-[var(--panel-strong)] rounded-2xl py-3 text-sm"
          onClick={onAddBlock}
        >
          + Второй текстовый блок
        </button>
      </section>
      <section className="space-y-2">
        <h3 className="text-sm uppercase tracking-widest text-[var(--text-muted)]">Слайд</h3>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(ASPECT_RATIOS) as AspectRatioKey[]).map((ratio) => (
            <button
              key={ratio}
              className={`rounded-2xl border px-3 py-2 text-xs ${aspectRatio === ratio ? 'border-[var(--button-accent)] bg-[var(--panel-strong)]' : 'border-[var(--panel-border)] text-[var(--text-muted)]'}`}
              onClick={() => onAspectChange(ratio)}
            >
              {ratio}
              <span className="block text-[10px] text-[var(--text-muted)]">{ASPECT_RATIOS[ratio].label}</span>
            </button>
          ))}
        </div>
        <button
          className="w-full rounded-2xl py-3 text-sm font-semibold bg-[var(--button-accent)] text-[var(--button-accent-text)]"
          onClick={onRegenerateBackground}
        >
          Regenerate background
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button className="bg-[var(--panel-strong)] rounded-2xl py-2 text-[var(--text-primary)]" onClick={onBalanceSlides}>
            Balance text across slides
          </button>
          <button className="bg-[var(--panel-strong)] rounded-2xl py-2 text-[var(--text-primary)]" onClick={onSmartReflow}>
            Smart reflow limit
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`flex-1 rounded-2xl py-2 border ${canUndo ? 'border-[var(--button-accent)]' : 'border-[var(--panel-border)] text-[var(--text-muted)]'}`}
            disabled={!canUndo}
            onClick={onUndo}
          >
            Undo
          </button>
          <button
            className={`flex-1 rounded-2xl py-2 border ${canRedo ? 'border-[var(--button-accent)]' : 'border-[var(--panel-border)] text-[var(--text-muted)]'}`}
            disabled={!canRedo}
            onClick={onRedo}
          >
            Redo
          </button>
        </div>
      </section>
      <section className="space-y-2">
        <h3 className="text-sm uppercase tracking-widest text-[var(--text-muted)]">Экспорт</h3>
        <label className="text-xs uppercase text-[var(--text-muted)] flex flex-col gap-1">
          Качество {quality}%
          <input type="range" min={50} max={100} value={quality} onChange={(event) => onQualityChange(Number(event.target.value))} />
        </label>
        <div className="flex gap-2 text-sm text-[var(--text-primary)]">
          {(['png', 'jpeg'] as const).map((fmt) => (
            <button
              key={fmt}
              className={`flex-1 rounded-2xl py-2 border capitalize ${format === fmt ? 'border-[var(--button-accent)] bg-[var(--panel-strong)]' : 'border-[var(--panel-border)] text-[var(--text-muted)]'}`}
              onClick={() => onFormatChange(fmt)}
            >
              {fmt}
            </button>
          ))}
        </div>
        <button className="w-full bg-[var(--panel-strong)] rounded-2xl py-3" onClick={onDownloadSlide}>
          Скачать слайд
        </button>
        <button
          className="w-full rounded-2xl py-3 font-semibold bg-[var(--button-accent)] text-[var(--button-accent-text)]"
          onClick={onDownloadAll}
        >
          ZIP всех слайдов
        </button>
      </section>
    </aside>
  )
}
