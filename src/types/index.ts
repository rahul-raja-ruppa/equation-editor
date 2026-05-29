export interface QuickButtonDef {
  latex: string;
  glyph: string;
  tooltip: string;
}

export interface ExpressionDef {
  latex: string;
  display: string;
  label: string;
}

export interface SymbolDef {
  latex: string; // what gets inserted into MathLive
  display: string; // what appears on the button face
  tooltip: string; // hover label
  isTemplate?: boolean; // true → renders as large violet template button
  extra?: boolean; // true → hidden behind ▼ More expander
}

export interface Section {
  header: string; // section label shown in small caps above the row
  symbols: SymbolDef[];
}

export interface TabData {
  id: TabId;
  label: string;
  sections: Section[];
}

export interface TabDef {
  id: string;
  label: string;
  expressions: ExpressionDef[];
}

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

export const TAB_IDS = [
  'general',
  'symbols',
  'arrows',
  'greek',
  'matrices',
  'scripts',
  'bigops',
  'calculus',
] as const;

export type TabId = (typeof TAB_IDS)[number];
