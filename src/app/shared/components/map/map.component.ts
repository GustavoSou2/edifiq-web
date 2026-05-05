export type { MapMarker, MapConfig, MapMarkerColor, MapTileStyle } from "./map.types";

import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnChanges, OnDestroy, SimpleChanges, ViewChild, input, output } from "@angular/core";
import * as L from "leaflet";
import { MapMarker, MapConfig, TILE_LAYERS, MARKER_COLORS, DEFAULT_CONFIG } from "./map.types";

@Component({
  selector: "edq-map",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #mapContainer class="edq-map-container" [style.height.px]="height()" [style.border-radius]="cfg.borderRadius" [attr.aria-label]="ariaLabel()" role="img"></div>`,
  styles: [":host { display: block; width: 100%; } .edq-map-container { width: 100%; overflow: hidden; z-index: 0; isolation: isolate; }"],
})
export class MapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild("mapContainer", { static: true }) private readonly mapEl!: ElementRef<HTMLDivElement>;

  readonly markers   = input<MapMarker[]>([]);
  readonly height    = input<number>(360);
  readonly center    = input<[number, number]>([-23.5505, -46.6333]);
  readonly zoom      = input<number>(13);
  readonly lat       = input<number | null>(null);
  readonly lng       = input<number | null>(null);
  readonly config    = input<MapConfig>({});
  readonly ariaLabel = input<string>("Mapa");

  readonly markerClick = output<MapMarker>();
  readonly mapClick    = output<{ lat: number; lng: number }>();

  private map!: L.Map;
  private markerLayer!: L.LayerGroup;
  private initialized = false;

  get cfg(): Required<MapConfig> { return { ...DEFAULT_CONFIG, ...this.config() }; }

  ngAfterViewInit(): void { setTimeout(() => { this.initMap(); this.initialized = true; }, 0); }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) { return; }
    if (changes["markers"] && this.markerLayer) { this.markerLayer.clearLayers(); this.renderMarkers(this.markers()); }
    if ((changes["lat"] || changes["lng"]) && this.map) {
      const lat = this.lat(); const lng = this.lng();
      if (lat !== null && lng !== null) { this.map.setView([lat, lng], this.zoom()); }
    }
  }

  ngOnDestroy(): void { this.map?.remove(); }

  flyTo(lat: number, lng: number, zoom?: number): void { this.map?.flyTo([lat, lng], zoom ?? this.zoom(), { duration: 0.8 }); }
  clearMarkers(): void { this.markerLayer?.clearLayers(); }

  private initMap(): void {
    const cfg = this.cfg;
    const tile = TILE_LAYERS[cfg.tileStyle];
    const singleLat = this.lat(); const singleLng = this.lng();
    const firstMarker = this.markers()[0];
    const initialCenter: L.LatLngExpression = singleLat !== null && singleLng !== null ? [singleLat, singleLng] : firstMarker ? [firstMarker.lat, firstMarker.lng] : this.center();
    this.map = L.map(this.mapEl.nativeElement, { center: initialCenter, zoom: this.zoom(), zoomControl: cfg.zoomControl, attributionControl: cfg.attribution, dragging: cfg.dragging, scrollWheelZoom: cfg.scrollWheelZoom, doubleClickZoom: cfg.doubleClickZoom, touchZoom: cfg.touchZoom, keyboard: cfg.keyboard });
    L.tileLayer(tile.url, { attribution: cfg.attribution ? tile.attribution : "", maxZoom: 19 }).addTo(this.map);
    this.markerLayer = L.layerGroup().addTo(this.map);
    if (singleLat !== null && singleLng !== null) { this.renderSingleMarker(singleLat, singleLng, cfg); }
    if (this.markers().length > 0) { this.renderMarkers(this.markers()); }
    this.map.on("click", (e: L.LeafletMouseEvent) => { this.mapClick.emit({ lat: e.latlng.lat, lng: e.latlng.lng }); });
  }

  private renderSingleMarker(lat: number, lng: number, cfg: Required<MapConfig>): void {
    const c = cfg.markerColor; const s = cfg.markerSize; const t = cfg.markerTail;
    const tH = Math.round(s * 0.32); const tW = Math.round(s * 0.24);
    const tailHtml = t ? "<div style='position:absolute;bottom:-" + tH + "px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:" + tW + "px solid transparent;border-right:" + tW + "px solid transparent;border-top:" + tH + "px solid " + c + ";'></div>" : "";
    const html = "<div style='width:" + s + "px;height:" + s + "px;background:" + c + ";border:3px solid white;border-radius:50%;box-shadow:0 3px 14px rgba(0,0,0,0.35);position:relative;'>" + tailHtml + "</div>";
    const icon = L.divIcon({ className: "", html, iconSize: [s, t ? s + tH : s], iconAnchor: [s / 2, t ? s + tH : s / 2] });
    L.marker([lat, lng], { icon }).addTo(this.markerLayer);
  }

  private renderMarkers(markers: MapMarker[]): void {
    const cfg = this.cfg;
    markers.forEach((m, index) => {
      const hex = MARKER_COLORS[m.color ?? "purple"]; const s = cfg.markerSize;
      const html = "<div style='width:" + s + "px;height:" + s + "px;background:" + hex + ";border:2.5px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.28);'></div>";
      const icon = L.divIcon({ className: "", html, iconSize: [s, s], iconAnchor: [s / 2, s / 2], popupAnchor: [0, -(s / 2 + 4)] });
      const lm = L.marker([m.lat, m.lng], { icon });
      if (m.popup) { lm.bindPopup("<div style='font-family:Inter,sans-serif;font-size:13px;min-width:160px;line-height:1.5;'><strong style='display:block;margin-bottom:4px;color:#1F2033;'>" + m.label + "</strong><span style='color:#676879;'>" + m.popup + "</span></div>", { maxWidth: 240 }); }
      else { lm.bindTooltip(m.label, { permanent: false, direction: "top" }); }
      lm.on("click", () => { this.markerClick.emit(m); });
      this.markerLayer.addLayer(lm);
      if (index === 0 && cfg.openFirstPopup && m.popup) { lm.openPopup(); }
    });
    if (cfg.fitBounds && markers.length > 1) { this.map.fitBounds(L.latLngBounds(markers.map(m => [m.lat, m.lng])), { padding: cfg.fitBoundsPadding, maxZoom: cfg.fitBoundsMaxZoom }); }
    else if (cfg.fitBounds && markers.length === 1) { this.map.setView([markers[0].lat, markers[0].lng], this.zoom()); }
  }
}