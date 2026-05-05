/**
 * Edifiq — Map Types
 * Tipos públicos do componente de mapa.
 */

export type MapMarkerColor =
  | 'purple' | 'green' | 'red' | 'yellow'
  | 'blue'   | 'teal'  | 'orange' | 'gray';

export type MapTileStyle = 'street' | 'satellite' | 'topo' | 'dark';

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
  markerColor?:      string;
  markerSize?:       number;
  markerTail?:       boolean;
  borderRadius?:     string;
}

export const TILE_LAYERS: Record<MapTileStyle, { url: string; attribution: string }> = {
  street: {
    url:         'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    url:         'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
  },
  topo: {
    url:         'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap',
  },
  dark: {
    url:         'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB',
  },
};

export const MARKER_COLORS: Record<MapMarkerColor, string> = {
  purple: '#6C5CE7',
  green:  '#00C875',
  red:    '#E2445C',
  yellow: '#FFCB00',
  blue:   '#0086C0',
  teal:   '#00D0D0',
  orange: '#FF7575',
  gray:   '#A8ABBE',
};

export const DEFAULT_CONFIG: Required<MapConfig> = {
  zoomControl:       true,
  dragging:          true,
  scrollWheelZoom:   true,
  doubleClickZoom:   true,
  touchZoom:         true,
  keyboard:          true,
  attribution:       true,
  tileStyle:         'street',
  fitBounds:         true,
  fitBoundsPadding:  [40, 40],
  fitBoundsMaxZoom:  14,
  openFirstPopup:    false,
  markerColor:       '#6C5CE7',
  markerSize:        28,
  markerTail:        true,
  borderRadius:      'var(--radius-lg)',
};
