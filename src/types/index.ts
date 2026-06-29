// Toolbar data model
export interface PaletteItem {
  latex: string; // inserted into MathLive on click
  display: string; // shown on the palette button face (Unicode or HTML entity)
  tooltip: string;
  isTemplate?: boolean; // true → renders wider, violet-tinted
  isSpace?: boolean; // true → renders a proportional gap-bar visual instead of MathPreview
  spaceSize?: string; // controls gap bar width — keys into SPACE_WIDTHS in flyout-palette
}

export interface ToolbarCategory {
  id: string;
  icon: string; // latex rendered as the category tile glyph (v2.2 rail)
  glyph: string; // shown on the compact category button face
  tooltip: string; // button tooltip
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
  fontSize: number;
  mathType: 'display' | 'inline';
}

export interface CancelPayload {
  type: 'cancel';
}

export interface CancelRequestedPayload {
  type: 'cancel-requested';
  initialLatex: string;
  currentLatex: string;
}

// Sent every ~10s while the user is interacting with the iframe, so the parent's
// idle timer (which only sees activity on its own document) doesn't fire while
// editing is happening inside this iframe.
export interface ActivityHeartbeatPayload {
  type: 'activity-heartbeat';
}

export interface LoadMessage {
  type: 'load';
  latex: string;
  config: LoadConfig;
}

export interface InsertRequestedMessage {
  type: 'insert-requested';
}

export interface InsertSuccessMessage {
  type: 'insert-success';
}

export interface InsertErrorMessage {
  type: 'insert-error';
}

export type OutboundMessage =
  | InsertPayload
  | CancelPayload
  | CancelRequestedPayload
  | ActivityHeartbeatPayload;
export type InboundMessage =
  | LoadMessage
  | InsertRequestedMessage
  | InsertSuccessMessage
  | InsertErrorMessage;
