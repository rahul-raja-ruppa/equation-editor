import { Parentheses, Divide, Superscript, ArrowUpDown, Grid2x2 } from 'lucide-react';
import styles from './CategoryButton.module.css';

const UNICODE_ICONS: Record<string, string> = {
  relations: '≤',
  decorations: '⋯',
  operators: '±',
  arrows: '→',
  logic: '∀',
  sets: '⊂',
  misc: '∂',
  'greek-lower': 'λ',
  'greek-upper': 'Ω',
  summation: '∑',
  integrals: '∫',
  bigops: '∏',
};

const LUCIDE_ICONS: Record<string, React.FC> = {
  fences: () => <Parentheses size={16} strokeWidth={1.75} />,
  fractions: () => <Divide size={16} strokeWidth={1.75} />,
  scripts: () => <Superscript size={16} strokeWidth={1.75} />,
  'over-under': () => <ArrowUpDown size={16} strokeWidth={1.75} />,
  matrices: () => <Grid2x2 size={16} strokeWidth={1.75} />,
};

export function CategoryIcon({ id }: { id: string }) {
  const unicode = UNICODE_ICONS[id];
  if (unicode) return <span className={styles.unicodeIcon}>{unicode}</span>;

  const Icon = LUCIDE_ICONS[id];
  if (Icon) return <span className={styles.svgIcon}><Icon /></span>;

  return null;
}
