import { LucideIconData } from 'lucide-angular';

export const DcDiamond: LucideIconData = [
  ['polygon', { points: '12 2 22 12 12 22 2 12', 'shape-rendering': 'geometricPrecision' }],
];

export const DcBolt: LucideIconData = [
  [
    'path',
    {
      d: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'shape-rendering': 'geometricPrecision',
    },
  ],
];

export const DcSpeedo: LucideIconData = [
  [
    'path',
    {
      d: 'M5 19a9 9 0 1 1 14 0',
      'stroke-linecap': 'round',
      'shape-rendering': 'geometricPrecision',
    },
  ],
  [
    'path',
    {
      d: 'M8 19a6 6 0 0 1 8 0',
      'stroke-linecap': 'round',
      'shape-rendering': 'geometricPrecision',
    },
  ],
  [
    'path',
    { d: 'M12 13L16 8', 'stroke-linecap': 'round', 'shape-rendering': 'geometricPrecision' },
  ],
  ['circle', { cx: '12', cy: '13', r: '1', 'shape-rendering': 'geometricPrecision' }],
];
