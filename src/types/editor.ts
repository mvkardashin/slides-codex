export type AspectRatioKey = '1:1' | '4:5' | '9:16' | '16:9' | '3:2'

export interface BackgroundConfig {
  id: string
  css: string
  accent: string
  label: string
}

export interface TextShadow {
  enabled: boolean
  blur: number
  x: number
  y: number
  color: string
  opacity: number
}

export interface TextBlock {
  id: string
  text: string
  fontSize: number
  fontFamily: string
  color: string
  fontWeight: 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
  align: 'left' | 'center' | 'right'
  shadow: TextShadow
  position: { x: number; y: number }
  size: { width: number; height: number }
  backgroundOpacity: number
}

export interface Slide {
  id: string
  background: BackgroundConfig
  textBlocks: TextBlock[]
}

export interface SummaryBundle {
  summary: string
  keyIdeas: string[]
  bullets: string[]
}

export interface TemplatePreset {
  id: string
  name: string
  description: string
  paletteHint: string
  slides: Slide[]
}

export interface ProjectState {
  inputText: string
  slideCount: number
  slides: Slide[]
  activeSlideId: string | null
  aspectRatio: AspectRatioKey
  summaryBundle: SummaryBundle | null
  theme: 'light' | 'dark'
  quality: number
  format: 'png' | 'jpeg'
}
