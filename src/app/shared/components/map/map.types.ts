/**
 * Edifiq — Map Types
 * Estilo inspirado em Uber / iFood:
 *   - Tile: CartoDB Positron (fundo branco, ruas cinza suave)
 *   - Marcadores: pino sólido com sombra, sem borda branca grossa
 *   - Popup: card flutuante com sombra suave
 *   - Controles: zoom minimalista, sem atribuição visível por padrão
 */

export type MapMarkerColor =
  | 'primary' | 'green' | 'red' | 'yellow'
  | 'blue'    | 'teal'  | 'orange' | 'gray'
  /* aliases legados */
  | 'purple';

export type MapTileStyle =
  | 'positron'      /* CartoDB Positron — iFood/Uber light (padrão) */
  | 'positron_lite' /* Positron sem labels — ainda mais limpo        */
  | 'dark'          /* CartoDB Dark Matter — Uber dark mode          */
  | 'dark_lite'     /* Dark sem labels                               */
  | 'street'        /* OSM padrão (fallback)                         */
  | 'satellite';    /* Esri World Imagery                            */

export interface MapMarker {
  lat:    number;
  lng:    number;
  label:  string;
  color?: MapMarkerColor;
  popup?: string;
  data?:  unknown;
}

export interface MapConfig {
  zoomControl?:      boolean;
  dragging?:         boolean;
  scrollWheelZoom?:  boolean;
  doubleClickZoom?:  boolean;
  touchZoom?:        boolean;
  keyboard?:         boolean;
  attribution?:      boolean;
  tileStyle?:        MapTileStyle;
  fitBounds?:        boolean;
  fitBoundsPadding?: [number, number];
  fitBoundsMaxZoom?: number;
  openFirstPopup?:   boolean;
  /** Cor hex do marcador único (usado com lat/lng direto) */
  markerColor?:      string;
  markerSize?:       number;
  /** true = pino com cauda (estilo iFood); false = círculo (estilo Uber) */
  markerTail?:       boolean;
  borderRadius?:     string;
  /** Cor da polyline de rota */
  routeColor?:       string;
  /** Espessura da polyline */
  routeWeight?:      number;
}

/* ── Tile layers ──────────────────────────────────────────── */
export const TILE_LAYERS: Record<MapTileStyle, { url: string; attribution: string }> = {
  /* CartoDB Positron — fundo branco, ruas cinza claro, labels discretos */
  positron: {
    url:         'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  /* Positron sem labels — mapa ainda mais limpo para thumbnails */
  positron_lite: {
    url:         'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
  },
  /* CartoDB Dark Matter — fundo escuro, estilo Uber dark */
  dark: {
    url:         'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  /* Dark sem labels */
  dark_lite: {
    url:         'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
  },
  /* OSM padrão — fallback */
  street: {
    url:         'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  /* Esri satellite */
  satellite: {
    url:         'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
  },
};

/* ── Marker colors ────────────────────────────────────────── */
export const MARKER_COLORS: Record<MapMarkerColor, string> = {
  primary: '#4F46E5',   /* indigo — acento do design system */
  purple:  '#4F46E5',   /* alias legado */
  green:   '#059669',
  red:     '#DC2626',
  yellow:  '#D97706',
  blue:    '#2563EB',
  teal:    '#0891B2',
  orange:  '#EA580C',
  gray:    '#6B7280',
};

/* ── Default config ───────────────────────────────────────── */
export const DEFAULT_CONFIG: Required<MapConfig> = {
  zoomControl:       true,
  dragging:          true,
  scrollWheelZoom:   true,
  doubleClickZoom:   true,
  touchZoom:         true,
  keyboard:          true,
  attribution:       false,   /* oculto por padrão — mais limpo */
  tileStyle:         'positron',
  fitBounds:         true,
  fitBoundsPadding:  [48, 48],
  fitBoundsMaxZoom:  14,
  openFirstPopup:    false,
  markerColor:       '#4F46E5',
  markerSize:        32,
  markerTail:        true,
  borderRadius:      'var(--radius-lg)',
  routeColor:        '#4F46E5',
  routeWeight:       4,
};
