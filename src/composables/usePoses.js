// usePoses.js — 拍照姿势引导数据
// 每个姿势用线性 SVG 简笔画描述（stroke 线条、无填充），
// shapes 支持 circle / path 两种图元，由 PoseFigure.vue 渲染。

export const POSES = [
  {
    id: 'heart',
    name: '比心',
    emoji: '💗',
    desc: '双手举过头顶比个大爱心',
    shapes: [
      { tag: 'circle', cx: 50, cy: 34, r: 11 },
      { tag: 'path', d: 'M50 45 L50 78' },
      { tag: 'path', d: 'M50 52 L34 40 L42 26' },
      { tag: 'path', d: 'M50 52 L66 40 L58 26' },
      { tag: 'path', d: 'M50 22 C46 18 42 16 42 12 C42 8 47 7 50 11 C53 7 58 8 58 12 C58 16 54 18 50 22 Z' }
    ]
  },
  {
    id: 'vsign',
    name: '剪刀手',
    emoji: '✌️',
    desc: '举手比个耶，经典又可爱',
    shapes: [
      { tag: 'circle', cx: 50, cy: 34, r: 11 },
      { tag: 'path', d: 'M50 45 L50 78' },
      { tag: 'path', d: 'M50 52 L66 36' },
      { tag: 'path', d: 'M66 36 L62 22' },
      { tag: 'path', d: 'M66 36 L73 24' },
      { tag: 'path', d: 'M50 52 L36 64' }
    ]
  },
  {
    id: 'chin',
    name: '托腮',
    emoji: '🤔',
    desc: '单手托腮，显脸小神器',
    shapes: [
      { tag: 'circle', cx: 50, cy: 34, r: 11 },
      { tag: 'path', d: 'M50 45 L50 78' },
      { tag: 'path', d: 'M50 52 L63 49 L57 39' },
      { tag: 'circle', cx: 57, cy: 38, r: 3 },
      { tag: 'path', d: 'M50 52 L37 64' }
    ]
  },
  {
    id: 'cover',
    name: '挡脸',
    emoji: '🙈',
    desc: '手挡半边脸，害羞又上镜',
    shapes: [
      { tag: 'circle', cx: 50, cy: 34, r: 11 },
      { tag: 'path', d: 'M50 45 L50 78' },
      { tag: 'path', d: 'M50 52 L62 43 L53 31' },
      { tag: 'path', d: 'M47 28 L57 33' },
      { tag: 'path', d: 'M50 52 L37 64' }
    ]
  },
  {
    id: 'flower',
    name: '捧脸',
    emoji: '🌸',
    desc: '双手捧脸，像朵花一样',
    shapes: [
      { tag: 'circle', cx: 50, cy: 34, r: 11 },
      { tag: 'path', d: 'M50 45 L50 78' },
      { tag: 'path', d: 'M50 52 L36 46 L41 36' },
      { tag: 'path', d: 'M50 52 L64 46 L59 36' },
      { tag: 'circle', cx: 41, cy: 35, r: 3.5 },
      { tag: 'circle', cx: 59, cy: 35, r: 3.5 }
    ]
  },
  {
    id: 'hair',
    name: '撩发',
    emoji: '💇',
    desc: '轻撩头发，自然又撩人',
    shapes: [
      { tag: 'circle', cx: 50, cy: 34, r: 11 },
      { tag: 'path', d: 'M42 26 C44 20 56 20 58 26' },
      { tag: 'path', d: 'M50 45 L50 78' },
      { tag: 'path', d: 'M50 52 L65 43 L57 25' },
      { tag: 'circle', cx: 57, cy: 24, r: 3 },
      { tag: 'path', d: 'M50 52 L37 64' }
    ]
  },
  {
    id: 'cross',
    name: '抱臂',
    emoji: '😎',
    desc: '双手抱臂，气场全开',
    shapes: [
      { tag: 'circle', cx: 50, cy: 34, r: 11 },
      { tag: 'path', d: 'M50 45 L50 78' },
      { tag: 'path', d: 'M38 52 L62 59' },
      { tag: 'path', d: 'M62 52 L38 59' },
      { tag: 'circle', cx: 62, cy: 59, r: 3 },
      { tag: 'circle', cx: 38, cy: 59, r: 3 }
    ]
  },
  {
    id: 'point',
    name: '指向镜头',
    emoji: '👉',
    desc: '伸手点镜头，互动感满满',
    shapes: [
      { tag: 'circle', cx: 50, cy: 34, r: 11 },
      { tag: 'path', d: 'M50 45 L50 78' },
      { tag: 'path', d: 'M50 52 L64 48' },
      { tag: 'circle', cx: 67, cy: 47, r: 3.5 },
      { tag: 'path', d: 'M70 46 L77 44' },
      { tag: 'path', d: 'M50 52 L37 64' }
    ]
  }
]

export function usePoses() {
  return { poses: POSES }
}
