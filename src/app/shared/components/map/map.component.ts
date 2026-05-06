export type { MapMarker, MapConfig, MapMarkerColor, MapTileStyle } from './map.types';

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  input,
  output,
} from '@angular/core';
import * as L from 'leaflet';
import {
  MapMarker,
  MapConfig,
  TILE_LAYERS,
  MARKER_COLORS,
  DEFAULT_CONFIG,
} from './map.types';

/* ── CSS injetado uma vez para os controles e popups ────────*/
const LEAFLET_OVERRIDES = `
  /* ── Zoom control — minimalista (estilo Uber) ─────────── */
  .edq-map .leaflet-control-zoom {
    border: none !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12) !important;
    border-radius: 8px !important;
    overflow: hidden;
  }
  .edq-map .leaflet-control-zoom a {
    width: 32px !important;
    height: 32px !important;
    line-height: 32px !important;
    font-size: 16px !important;
    font-weight: 400 !important;
    color: #374151 !important;
    background: #ffffff !important;
    border: none !important;
    border-bottom: 1px solid #F3F4F6 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: background 0.12s ease !important;
  }
  .edq-map .leaflet-control-zoom a:last-child { border-bottom: none !important; }
  .edq-map .leaflet-control-zoom a:hover { background: #F9FAFB !important; }

  /* ── Attribution — micro texto discreto ──────────────── */
  .edq-map .leaflet-control-attribution {
    background: rgba(255,255,255,0.75) !important;
    backdrop-filter: blur(4px) !important;
    font-size: 9px !important;
    color: #9CA3AF !important;
    padding: 2px 6px !important;
    border-radius: 4px 0 0 0 !important;
    box-shadow: none !important;
  }
  .edq-map .leaflet-control-attribution a { color: #9CA3AF !important; }

  /* ── Popup — card flutuante estilo iFood ─────────────── */
  .edq-map .leaflet-popup-content-wrapper {
    border-radius: 10px !important;
    box-shadow: 0 4px 20px rgba(0,0,0,0.14) !important;
    border: 1px solid #E5E7EB !important;
    padding: 0 !important;
    overflow: hidden !important;
  }
  .edq-map .leaflet-popup-content {
    margin: 0 !important;
    font-family: 'Inter', sans-serif !important;
  }
  .edq-map .leaflet-popup-tip-container { display: none !important; }
  .edq-map .leaflet-popup-close-button {
    top: 8px !important;
    right: 8px !important;
    width: 20px !important;
    height: 20px !important;
    font-size: 14px !important;
    color: #9CA3AF !important;
    background: #F3F4F6 !important;
    border-radius: 50% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    line-height: 1 !important;
  }

  /* ── Tooltip ─────────────────────────────────────────── */
  .edq-map .leaflet-tooltip {
    background: #111827 !important;
    color: #F9FAFB !important;
    border: none !important;
    border-radius: 6px !important;
    font-family: 'Inter', sans-serif !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    padding: 4px 10px !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
    white-space: nowrap !important;
  }
  .edq-map .leaflet-tooltip::before { display: none !important; }

  /* ── Tile layer — suaviza o carregamento ─────────────── */
  .edq-map .leaflet-tile { filter: saturate(0.9) brightness(1.02); }
`;

let stylesInjected = false;

function injectStyles(): void {
  if (stylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = LEAFLET_OVERRIDES;
  document.head.appendChild(style);
  stylesInjected = true;
}

@Component({
  selector: 'edq-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #mapContainer
      class="edq-map-container"
      [style.height.px]="height()"
      [style.border-radius]="cfg.borderRadius"
      [attr.aria-label]="ariaLabel()"
      role="img"
    ></div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .edq-map-container {
      width:     100%;
      overflow:  hidden;
      z-index:   0;
      isolation: isolate;
    }
  `],
})
export class MapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapContainer', { static: true })
  private readonly mapEl!: ElementRef<HTMLDivElement>;

  readonly markers   = input<MapMarker[]>([]);
  readonly height    = input<number>(360);
  readonly center    = input<[number, number]>([-23.5505, -46.6333]);
  readonly zoom      = input<number>(13);
  readonly lat       = input<number | null>(null);
  readonly lng       = input<number | null>(null);
  readonly config    = input<MapConfig>({});
  readonly ariaLabel = input<string>('Mapa');
  /** Polyline de rota: array de [lat, lng] — ex: [[origem], [ponto1], [destino]] */
  readonly route     = input<[number, number][]>([]);

  readonly markerClick = output<MapMarker>();
  readonly mapClick    = output<{ lat: number; lng: number }>();

  private map!: L.Map;
  private markerLayer!: L.LayerGroup;
  private routeLayer!: L.LayerGroup;
  private initialized = false;

  get cfg(): Required<MapConfig> {
    return { ...DEFAULT_CONFIG, ...this.config() };
  }

  ngAfterViewInit(): void {
    injectStyles();
    setTimeout(() => {
      this.initMap();
      this.initialized = true;
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) return;

    if (changes['markers'] && this.markerLayer) {
      this.markerLayer.clearLayers();
      this.renderMarkers(this.markers());
    }

    if (changes['route'] && this.routeLayer) {
      this.routeLayer.clearLayers();
      this.renderRoute(this.route());
    }

    if ((changes['lat'] || changes['lng']) && this.map) {
      const lat = this.lat();
      const lng = this.lng();
      if (lat !== null && lng !== null) {
        this.map.setView([lat, lng], this.zoom());
      }
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  flyTo(lat: number, lng: number, zoom?: number): void {
    this.map?.flyTo([lat, lng], zoom ?? this.zoom(), { duration: 0.6 });
  }

  clearMarkers(): void {
    this.markerLayer?.clearLayers();
  }

  /* ── Init ─────────────────────────────────────────────── */
  private initMap(): void {
    const cfg  = this.cfg;
    const tile = TILE_LAYERS[cfg.tileStyle];

    const singleLat   = this.lat();
    const singleLng   = this.lng();
    const firstMarker = this.markers()[0];

    const initialCenter: L.LatLngExpression =
      singleLat !== null && singleLng !== null
        ? [singleLat, singleLng]
        : firstMarker
          ? [firstMarker.lat, firstMarker.lng]
          : this.center();

    /* Adiciona classe para escopo dos overrides CSS */
    this.mapEl.nativeElement.classList.add('edq-map');

    this.map = L.map(this.mapEl.nativeElement, {
      center:           initialCenter,
      zoom:             this.zoom(),
      zoomControl:      false,          /* recriamos manualmente abaixo */
      attributionControl: cfg.attribution,
      dragging:         cfg.dragging,
      scrollWheelZoom:  cfg.scrollWheelZoom,
      doubleClickZoom:  cfg.doubleClickZoom,
      touchZoom:        cfg.touchZoom,
      keyboard:         cfg.keyboard,
    });

    /* Tile layer */
    L.tileLayer(tile.url, {
      attribution: cfg.attribution ? tile.attribution : '',
      maxZoom:     19,
      subdomains:  'abcd',
    }).addTo(this.map);

    /* Zoom control minimalista — canto inferior direito */
    if (cfg.zoomControl) {
      L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    }

    this.markerLayer = L.layerGroup().addTo(this.map);
    this.routeLayer  = L.layerGroup().addTo(this.map);

    /* Rota (polyline) — renderizada antes dos marcadores para ficar abaixo */
    if (this.route().length >= 2) {
      this.renderRoute(this.route());
    }

    if (singleLat !== null && singleLng !== null) {
      this.renderSingleMarker(singleLat, singleLng, cfg);
    }

    if (this.markers().length > 0) {
      this.renderMarkers(this.markers());
    }

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.mapClick.emit({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
  }

  /* ── Marcador único (lat/lng direto) — estilo pino iFood ─*/
  private renderSingleMarker(
    lat: number,
    lng: number,
    cfg: Required<MapConfig>,
  ): void {
    const color = cfg.markerColor;
    const size  = cfg.markerSize;
    const tail  = cfg.markerTail;

    const icon = tail
      ? this.buildPinIcon(color, size)
      : this.buildDotIcon(color, size);

    L.marker([lat, lng], { icon }).addTo(this.markerLayer);
  }

  /* ── Múltiplos marcadores (array) ────────────────────── */
  private renderMarkers(markers: MapMarker[]): void {
    const cfg = this.cfg;

    markers.forEach((m, index) => {
      const hex  = MARKER_COLORS[m.color ?? 'primary'];
      const size = cfg.markerSize;
      const icon = this.buildDotIcon(hex, size);

      const lm = L.marker([m.lat, m.lng], { icon });

      if (m.popup) {
        lm.bindPopup(this.buildPopupHtml(m.label, m.popup), {
          maxWidth:    260,
          closeButton: true,
          className:   '',
        });
      } else {
        lm.bindTooltip(m.label, { permanent: false, direction: 'top' });
      }

      lm.on('click', () => this.markerClick.emit(m));
      this.markerLayer.addLayer(lm);

      if (index === 0 && cfg.openFirstPopup && m.popup) {
        lm.openPopup();
      }
    });

    if (cfg.fitBounds && markers.length > 1) {
      this.map.fitBounds(
        L.latLngBounds(markers.map(m => [m.lat, m.lng] as [number, number])),
        { padding: cfg.fitBoundsPadding, maxZoom: cfg.fitBoundsMaxZoom },
      );
    } else if (cfg.fitBounds && markers.length === 1) {
      this.map.setView([markers[0].lat, markers[0].lng], this.zoom());
    }
  }

  /* ── Polyline de rota estilo Uber ────────────────────── */
  private renderRoute(points: [number, number][]): void {
    if (points.length < 2) return;
    const cfg = this.cfg;

    /* Sombra da rota — linha mais grossa e transparente atrás */
    L.polyline(points, {
      color:   'rgba(0,0,0,0.12)',
      weight:  cfg.routeWeight + 4,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(this.routeLayer);

    /* Linha principal da rota */
    L.polyline(points, {
      color:     cfg.routeColor,
      weight:    cfg.routeWeight,
      opacity:   0.92,
      lineCap:   'round',
      lineJoin:  'round',
      dashArray: undefined,
    }).addTo(this.routeLayer);

    /* Ajusta o bounds para mostrar a rota completa */
    if (cfg.fitBounds) {
      this.map.fitBounds(
        L.latLngBounds(points),
        { padding: cfg.fitBoundsPadding, maxZoom: cfg.fitBoundsMaxZoom },
      );
    }
  }

  /* ── Pino estilo iFood/Google Maps ───────────────────── */
  private buildPinIcon(color: string, size: number): L.DivIcon {
    const w    = size;
    const h    = Math.round(size * 1.35);
    const r    = Math.round(size * 0.5);
    const tail = Math.round(size * 0.35);

    const html = `
      <div style="
        position: relative;
        width: ${w}px;
        height: ${h}px;
        filter: drop-shadow(0 3px 8px rgba(0,0,0,0.28));
      ">
        <!-- Corpo do pino -->
        <div style="
          position: absolute;
          top: 0; left: 0;
          width: ${w}px;
          height: ${w}px;
          background: ${color};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
        "></div>
        <!-- Ponto branco interno -->
        <div style="
          position: absolute;
          top: ${Math.round(w * 0.25)}px;
          left: ${Math.round(w * 0.25)}px;
          width: ${Math.round(w * 0.5)}px;
          height: ${Math.round(w * 0.5)}px;
          background: white;
          border-radius: 50%;
          opacity: 0.9;
        "></div>
      </div>
    `;

    return L.divIcon({
      className: '',
      html,
      iconSize:   [w, h],
      iconAnchor: [w / 2, h],
    });
  }

  /* ── Dot estilo Uber (múltiplos marcadores) ──────────── */
  private buildDotIcon(color: string, size: number): L.DivIcon {
    const s = size;

    const html = `
      <div style="
        width: ${s}px;
        height: ${s}px;
        background: ${color};
        border-radius: 50%;
        border: 2.5px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.22), 0 0 0 1px ${color}33;
      "></div>
    `;

    return L.divIcon({
      className: '',
      html,
      iconSize:   [s, s],
      iconAnchor: [s / 2, s / 2],
      popupAnchor: [0, -(s / 2 + 6)],
    });
  }

  /* ── Popup HTML — card estilo iFood ──────────────────── */
  private buildPopupHtml(label: string, content: string): string {
    return `
      <div style="
        font-family: 'Inter', sans-serif;
        min-width: 180px;
        max-width: 240px;
        padding: 12px 14px;
      ">
        <div style="
          font-size: 12px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
          letter-spacing: -0.01em;
        ">${label}</div>
        <div style="
          font-size: 12px;
          color: #6B7280;
          line-height: 1.5;
        ">${content}</div>
      </div>
    `;
  }
}
