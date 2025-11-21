const STEPS = [
  { value: 'input', label: '1. Input' },
  { value: 'summary', label: '2. Summary' },
  { value: 'slides', label: '3. Slides' },
  { value: 'export', label: '4. Export' },
]

interface ProcessStepsProps {
  current: 'input' | 'summary' | 'slides' | 'export'
}

export const ProcessSteps = ({ current }: ProcessStepsProps) => (
  <div className="flex items-center justify-between bg-[var(--panel-bg)] rounded-3xl px-4 py-3 border border-[var(--panel-border)] text-[var(--text-primary)]">
    {STEPS.map((step) => (
      <div
        key={step.value}
        className={`flex-1 text-center text-xs uppercase tracking-[0.3em] py-2 ${
          current === step.value ? 'text-[var(--button-accent)] font-semibold' : 'text-[var(--text-muted)]'
        }`}
      >
        {step.label}
      </div>
    ))}
  </div>
)
