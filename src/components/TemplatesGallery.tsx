import type { TemplatePreset } from '../types/editor'

interface TemplatesGalleryProps {
  templates: TemplatePreset[]
  onApply: (template: TemplatePreset) => void
}

export const TemplatesGallery = ({ templates, onApply }: TemplatesGalleryProps) => (
  <section className="bg-[var(--panel-bg)] rounded-3xl p-4 border border-[var(--panel-border)] text-[var(--text-primary)] backdrop-blur">
    <header className="flex items-center justify-between mb-4">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-[var(--text-muted)]">Templates feed</p>
        <h3 className="text-xl font-semibold">Лента готовых стилей</h3>
      </div>
    </header>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {templates.map((template) => (
        <button
          key={template.id}
          onClick={() => onApply(template)}
          className="p-4 rounded-2xl bg-[var(--panel-strong)] border border-[var(--panel-border)] hover:border-[var(--button-accent)] text-left transition-all duration-200"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)] mb-1">{template.paletteHint}</p>
          <h4 className="text-lg font-semibold mb-2">{template.name}</h4>
          <p className="text-[var(--text-muted)] text-sm">{template.description}</p>
          <p className="text-[var(--text-muted)] text-xs mt-2">{template.slides.length} слайда</p>
        </button>
      ))}
    </div>
  </section>
)
