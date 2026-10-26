/** Serializable icon registry keys (resolved on the client — no function props from RSC). */
export type ScrollStackIconSet = 'about-core-values' | 'about-what-we-do';

export type ScrollStackHighlight = {
  id: string;
  label: string;
  tone?: 'brand' | 'accent' | 'muted';
};

export type ScrollStackLayer = {
  id: string;
  title: string;
  body: string;
  /** Uppercase label on the layer edge (e.g. CONSENT FIRST) */
  stackLabel: string;
  highlights?: ScrollStackHighlight[];
};

export type ScrollStackFeatureProps = {
  badge: string;
  title: string;
  description?: string;
  layers: ScrollStackLayer[];
  borderTop?: boolean;
  /** Maps layer.id → Lucide icon inside the client bundle */
  layerIconSet?: ScrollStackIconSet;
};
