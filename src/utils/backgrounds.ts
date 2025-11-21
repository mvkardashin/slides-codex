import type { BackgroundConfig, Slide, TemplatePreset } from '../types/editor'
import { uid } from './id'

const NOISE = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
<filter id="n" x="0" y="0">
  <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
  <feColorMatrix type="saturate" values="0"/>
  <feComponentTransfer><feFuncA type="linear" slope="0.18"/></feComponentTransfer>
</filter>
<rect width="100%" height="100%" filter="url(#n)" opacity="0.6"/>
</svg>`)

const gradients = [
  {
    css: `linear-gradient(120deg, #f6d365 0%, #fda085 100%), url("data:image/svg+xml,${NOISE}")`,
    accent: '#c7512c',
    label: 'Sunset bloom',
  },
  {
    css: `radial-gradient(circle at 20% 20%, #d9afd9 0%, #97d9e1 100%), url("data:image/svg+xml,${NOISE}")`,
    accent: '#764ba2',
    label: 'Pastel cloud',
  },
  {
    css: `linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%), url("data:image/svg+xml,${NOISE}")`,
    accent: '#88e1ff',
    label: 'Neon night',
  },
  {
    css: `linear-gradient(135deg, #f1ece4 0%, #d8c4a0 43%, #c0a080 100%), url("data:image/svg+xml,${NOISE}")`,
    accent: '#5f4b32',
    label: 'Kraft texture',
  },
]

const minimalist = {
  css: `linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%), url("data:image/svg+xml,${NOISE}")`,
  accent: '#111322',
  label: 'Minimal mist',
}

const pastel = {
  css: `linear-gradient(120deg, #fad0c4 0%, #ffd1ff 100%), url("data:image/svg+xml,${NOISE}")`,
  accent: '#861657',
  label: 'Pastel breeze',
}

const neon = {
  css: `radial-gradient(circle at 30% 30%, #003973 0%, #e5e5be 100%), url("data:image/svg+xml,${NOISE}")`,
  accent: '#f3ffbd',
  label: 'Dark neon',
}

const kraft = {
  css: gradients[3].css,
  accent: gradients[3].accent,
  label: gradients[3].label,
}

export const generateBackground = (): BackgroundConfig => {
  const pool = [minimalist, pastel, neon, kraft, ...gradients]
  const choice = pool[Math.floor(Math.random() * pool.length)]
  return {
    id: uid(),
    css: choice.css,
    accent: choice.accent,
    label: choice.label,
  }
}

const baseBlock = (text: string) => ({
  id: uid(),
  text,
  fontSize: 36,
  fontFamily: 'Space Grotesk',
  color: '#ffffff',
  fontWeight: 'bold' as const,
  fontStyle: 'normal' as const,
  align: 'left' as const,
  shadow: {
    enabled: true,
    blur: 24,
    x: 0,
    y: 10,
    color: '#000000',
    opacity: 0.35,
  },
  position: { x: 80, y: 120 },
  size: { width: 400, height: 320 },
  backgroundOpacity: 0,
})

const templateSlides = (texts: string[], background: BackgroundConfig): Slide[] =>
  texts.map((text) => ({
    id: uid(),
    background,
    textBlocks: [baseBlock(text)],
  }))

export const TEMPLATE_LIBRARY: TemplatePreset[] = [
  {
    id: 'minimalism',
    name: 'Минимализм',
    description: 'Чистый серый фон и строгая типографика.',
    paletteHint: minimalist.label,
    slides: templateSlides(
      ['Сфокусируйся на главном', 'Оставь много воздуха', 'Используй короткие мысли', 'Добавь акцентный вывод'],
      { ...minimalist, id: uid() }
    ),
  },
  {
    id: 'pastel',
    name: 'Пастельный градиент',
    description: 'Мягкие переливы и спокойные цвета.',
    paletteHint: pastel.label,
    slides: templateSlides(
      ['Мягкое вступление', 'Основная идея', 'Практический совет', 'Финальный инсайт'],
      { ...pastel, id: uid() }
    ),
  },
  {
    id: 'neon',
    name: 'Тёмный неон',
    description: 'Глубокий фон и яркие акценты.',
    paletteHint: neon.label,
    slides: templateSlides(
      ['Смелый заголовок', 'Чёткое утверждение', 'Короткий список', 'Призыв к действию'],
      { ...neon, id: uid() }
    ),
  },
  {
    id: 'kraft',
    name: 'Kraft texture',
    description: 'Тёплый бумажный фон и рукописные нотки.',
    paletteHint: kraft.label,
    slides: templateSlides(
      ['Добавь тепло', 'Расскажи историю', 'Выдели эмоции', 'Заверши атмосферно'],
      { ...kraft, id: uid() }
    ),
  },
]
