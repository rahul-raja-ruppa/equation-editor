// Toolbar data model
export interface PaletteItem {
  latex: string; // inserted into MathLive on click
  display: string; // shown on the palette button face (Unicode or HTML entity)
  tooltip: string;
  isTemplate?: boolean; // true → renders wider, violet-tinted
  isSpace?: boolean; // true → renders a proportional gap-bar visual instead of MathPreview
  spaceSize?: 'thin' | 'med' | 'quad' | 'qquad'; // controls gap bar width
}

export interface ToolbarCategory {
  id: string;
  icon: string; // LaTeX string rendered as MathLive icon on the category button
  tooltip: string;
  palette: PaletteItem[];
}

// Expression library (Zone 3 tabs)
export type ExpressionTabId =
  | 'algebra'
  | 'calculus'
  | 'statistics'
  | 'matrices'
  | 'sets'
  | 'trig'
  | 'geometry'
  | 'more';

export const EXPRESSION_TAB_IDS: ExpressionTabId[] = [
  'algebra',
  'calculus',
  'statistics',
  'matrices',
  'sets',
  'trig',
  'geometry',
  'more',
];

export const EXPRESSION_TAB_LABELS: Record<ExpressionTabId, string> = {
  algebra: 'Algebra',
  calculus: 'Calculus',
  statistics: 'Statistics',
  matrices: 'Matrices',
  sets: 'Sets',
  trig: 'Trig',
  geometry: 'Geometry',
  more: 'More',
};

export interface ExpressionItem {
  latex: string; // full formula inserted on click; #0, #1 are MathLive slots
  display: string; // rendered chip label (Unicode approximation)
  label: string; // small badge below chip
}

export interface ExpressionTab {
  id: ExpressionTabId;
  label: string;
  items: ExpressionItem[];
}

// postMessage protocol (unchanged)
export interface LoadConfig {
  fontSize: number;
  mathType: 'display' | 'inline';
  customer: string;
  project: string;
  doi: string;
}

export interface InsertPayload {
  type: 'insert';
  latex: string;
  mathml: string;
  imageUrl: string;
  fontSize: number;
  mathType: 'display' | 'inline';
}

export interface CancelPayload {
  type: 'cancel';
}

export interface LoadMessage {
  type: 'load';
  latex: string;
  config: LoadConfig;
}

export type OutboundMessage = InsertPayload | CancelPayload;
export type InboundMessage = LoadMessage;
