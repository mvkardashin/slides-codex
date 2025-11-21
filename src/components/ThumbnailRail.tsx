import type { Slide } from '../types/editor'

interface ThumbnailRailProps {
  slides: Slide[]
  activeSlideId: string | null
  onSelectSlide: (id: string) => void
  onDuplicateSlide: (id: string) => void
  onDeleteSlide: (id: string) => void
}

export const ThumbnailRail = ({
  slides,
  activeSlideId,
  onSelectSlide,
  onDuplicateSlide,
  onDeleteSlide,
}: ThumbnailRailProps) => (
  <aside className="w-60 bg-[var(--panel-bg)] rounded-3xl p-4 flex flex-col gap-3 text-[var(--text-primary)] border border-[var(--panel-border)] backdrop-blur max-h-[82vh] overflow-y-auto">
    <div className="flex items-center justify-between">
      <h3 className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">Слайды</h3>
      <span className="text-[var(--text-muted)] text-sm">{slides.length}</span>
    </div>
    {slides.map((slide, index) => (
      <button
        key={slide.id}
        className={`relative rounded-2xl overflow-hidden border text-left transition-all duration-200 ${
          slide.id === activeSlideId
            ? 'border-[var(--button-accent)] shadow-card scale-[1.01]'
            : 'border-[var(--panel-border)] hover:border-[var(--button-accent)]/50'
        }`}
        onClick={() => onSelectSlide(slide.id)}
      >
        <div
          className="h-28 w-full"
          style={{
            backgroundImage: slide.background.css,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="p-3 text-xs font-medium text-white line-clamp-3 bg-gradient-to-b from-black/40 to-black/0 h-full">
            {slide.textBlocks[0]?.text || 'Текст'}
          </div>
        </div>
        <div className="flex items-center justify-between px-3 py-2 text-xs text-[var(--text-muted)] bg-black/20">
          <span>#{index + 1}</span>
          <div className="flex gap-3">
            <span
              onClick={(event) => {
                event.stopPropagation()
                onDuplicateSlide(slide.id)
              }}
              className="cursor-pointer hover:text-[var(--text-primary)]"
            >
              Clone
            </span>
            <span
              onClick={(event) => {
                event.stopPropagation()
                onDeleteSlide(slide.id)
              }}
              className="cursor-pointer hover:text-red-300"
            >
              Del
            </span>
          </div>
        </div>
      </button>
    ))}
  </aside>
)
