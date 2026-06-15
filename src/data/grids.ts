import { GridConfig } from '../types';

export const GRIDS: GridConfig[] = [
  {
    id: '1x4',
    columns: 1,
    rows: 4,
    label: '1 × 4',
    photoCount: 4,
    description: 'Classic strip',
  },
  {
    id: '2x3',
    columns: 2,
    rows: 3,
    label: '2 × 3',
    photoCount: 6,
    description: 'Portrait grid',
  },
  {
    id: '2x4',
    columns: 2,
    rows: 4,
    label: '2 × 4',
    photoCount: 8,
    description: 'Full sheet',
  },
  {
    id: '1x3',
    columns: 1,
    rows: 3,
    label: '1 × 3',
    photoCount: 3,
    description: 'Short strip',
  },
  {
    id: '2x2',
    columns: 2,
    rows: 2,
    label: '2 × 2',
    photoCount: 4,
    description: 'Square quad',
  },
  {
    id: '3x3',
    columns: 3,
    rows: 3,
    label: '3 × 3',
    photoCount: 9,
    description: 'Nine-pack',
  },
];
