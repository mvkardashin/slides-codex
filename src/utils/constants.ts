import type { AspectRatioKey } from '../types/editor'

export const ASPECT_RATIOS: Record<
  AspectRatioKey,
  {
    width: number
    height: number
    label: string
    targetResolution: { width: number; height: number }
  }
> = {
  '1:1': { width: 1080, height: 1080, label: 'Instagram post', targetResolution: { width: 1080, height: 1080 } },
  '4:5': { width: 1080, height: 1350, label: 'Instagram portrait', targetResolution: { width: 1080, height: 1350 } },
  '9:16': { width: 1080, height: 1920, label: 'Stories/Reels', targetResolution: { width: 1080, height: 1920 } },
  '16:9': { width: 1920, height: 1080, label: 'Presentation', targetResolution: { width: 1920, height: 1080 } },
  '3:2': { width: 1350, height: 900, label: 'Classic photo', targetResolution: { width: 1350, height: 900 } },
}
