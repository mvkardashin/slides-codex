import { memo, type FormEvent } from 'react'
import { Rnd } from 'react-rnd'
import type { AspectRatioKey, Slide, TextBlock } from '../types/editor'
import { ASPECT_RATIOS } from '../utils/constants'

export interface SlideCanvasProps {
  slide: Slide
  aspectRatio: AspectRatioKey
  selectedBlockId: string | null
  onSelectBlock: (id: string) => void
  onBlockChange: (id: string, changes: Partial<TextBlock>) => void
  readibilityWarning?: string
}

const MIN_FONT_PX = 12

const computeFittedFontSize = (block: TextBlock) => {
  const baseSize = block.fontSize
  const availableHeight = Math.max(40, block.size.height - 24)
  const availableWidth = Math.max(40, block.size.width - 24)
  if (!block.text.trim()) return baseSize

  let size = baseSize
  for (let i = 0; i < 6; i += 1) {
    const charWidth = size * 0.58
    const charsPerLine = Math.max(1, Math.floor(availableWidth / Math.max(1, charWidth)))
    const lines = block.text.split('\n').reduce((acc, line) => acc + Math.max(1, Math.ceil(line.length / charsPerLine)), 0)
    const estimatedHeight = lines * size * 1.25
    if (estimatedHeight <= availableHeight || size <= MIN_FONT_PX) {
      return Math.max(MIN_FONT_PX, Math.min(baseSize, size))
    }
    size = Math.max(MIN_FONT_PX, Math.floor(size * 0.9))
  }
  return Math.max(MIN_FONT_PX, Math.min(baseSize, size))
}

const SlideCanvasComponent = ({
  slide,
  aspectRatio,
  selectedBlockId,
  onSelectBlock,
  onBlockChange,
  readibilityWarning,
}: SlideCanvasProps) => {
  const baseWidth = 520
  const ratio = ASPECT_RATIOS[aspectRatio]
  const height = (baseWidth / ratio.width) * ratio.height

  const handleTextChange = (block: TextBlock, event: FormEvent<HTMLDivElement>) => {
    const text = event.currentTarget.textContent || ''
    const padding = 32
    const scrollHeight = event.currentTarget.scrollHeight + padding
    const maxHeight = Math.max(120, height - block.position.y - 24)
    const nextHeight = Math.min(Math.max(scrollHeight, block.size.height), maxHeight)
    onBlockChange(block.id, {
      text,
      size: {
        ...block.size,
        height: nextHeight,
      },
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative rounded-3xl shadow-card border border-[var(--panel-border)] overflow-hidden transition-all duration-200 bg-black/20"
        style={{
          width: baseWidth,
          height,
          backgroundImage: slide.background.css,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {slide.textBlocks.map((block) => (
          <Rnd
            key={block.id}
            default={{
              x: block.position.x,
              y: block.position.y,
              width: block.size.width,
              height: block.size.height,
            }}
            position={{ x: block.position.x, y: block.position.y }}
            size={{ width: block.size.width, height: block.size.height }}
            bounds="parent"
            enableResizing={{
              bottom: true,
              bottomLeft: true,
              bottomRight: true,
              left: true,
              right: true,
              top: true,
              topLeft: true,
              topRight: true,
            }}
            onDragStop={(_, data) => onBlockChange(block.id, { position: { x: data.x, y: data.y } })}
            onResizeStop={(_, __, ref, ___, position) =>
              onBlockChange(block.id, {
                size: { width: ref.offsetWidth, height: ref.offsetHeight },
                position,
              })
            }
            onClick={() => onSelectBlock(block.id)}
            className={`rounded-2xl p-4 cursor-move ${
              selectedBlockId === block.id ? 'ring-2 ring-[var(--button-accent)]' : 'ring-1 ring-[var(--panel-border)]'
            }`}
          >
            <div
              className="h-full w-full focus:outline-none"
              contentEditable
              suppressContentEditableWarning
              onInput={(event) => handleTextChange(block, event)}
              style={{
                fontFamily: block.fontFamily,
                fontSize: `${computeFittedFontSize(block)}px`,
                color: block.color,
                fontWeight: block.fontWeight,
                fontStyle: block.fontStyle,
                textAlign: block.align as CanvasTextAlign,
                textShadow: block.shadow.enabled
                  ? `${block.shadow.x}px ${block.shadow.y}px ${block.shadow.blur}px rgba(0,0,0,${block.shadow.opacity})`
                  : 'none',
                backgroundColor: `rgba(0,0,0,${block.backgroundOpacity})`,
                borderRadius: '16px',
                padding: '12px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflow: 'hidden',
              }}
            >
              {block.text}
            </div>
          </Rnd>
        ))}
      </div>
      {readibilityWarning && (
        <p className="text-xs text-red-200 bg-red-500/10 rounded-full px-4 py-2 inline-flex items-center gap-2 w-fit">
          <span className="h-2 w-2 rounded-full bg-red-400" /> {readibilityWarning}
        </p>
      )}
    </div>
  )
}

export const SlideCanvas = memo(SlideCanvasComponent)
