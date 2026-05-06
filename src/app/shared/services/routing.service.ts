import { Injectable } from '@angular/core';

export interface RouteResult {
  /** Pontos da polyline em [lat, lng] */
  points:       [number, number][];
  /** Distância em metros */
  distance:     number;
  /** Duração em segundos */
  duration:     number;
  /** Distância formatada (ex: "4,2 km") */
  distanceText: string;
  /** Duração formatada (ex: "12 min") */
  durationText: string;
}

/**
 * RoutingService — busca rotas reais via OSRM (Open Source Routing Machine).
 *
 * OSRM é gratuito, sem chave de API, e retorna a geometria real das vias.
 * API pública: https://router.project-osrm.org
 *
 * Formato da URL:
 *   /route/v1/{profile}/{lng1},{lat1};{lng2},{lat2}
 *   ?overview=full&geometries=geojson
 *
 * NOTA: Em produção, hospedar uma instância própria do OSRM ou usar
 * Mapbox Directions / Google Routes para evitar dependência de servidor público.
 */
@Injectable({ providedIn: 'root' })
export class RoutingService {

  private readonly BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

  /**
   * Busca a rota real entre dois pontos via OSRM.
   * Retorna os pontos da polyline seguindo as vias do mapa.
   */
  async getRoute(
    originLat:  number,
    originLng:  number,
    destLat:    number,
    destLng:    number,
  ): Promise<RouteResult | null> {
    const url = [
      `${this.BASE_URL}`,
      `/${originLng},${originLat}`,
      `;${destLng},${destLat}`,
      `?overview=full&geometries=geojson&steps=false`,
    ].join('');

    try {
      const res  = await fetch(url);
      if (!res.ok) return null;

      const data = await res.json();
      if (data.code !== 'Ok' || !data.routes?.length) return null;

      const route    = data.routes[0];
      const distance = route.distance as number;   /* metros */
      const duration = route.duration as number;   /* segundos */

      /* GeoJSON coordinates são [lng, lat] — invertemos para [lat, lng] */
      const coords = route.geometry.coordinates as [number, number][];
      const points = coords.map(([lng, lat]) => [lat, lng] as [number, number]);

      return {
        points,
        distance,
        duration,
        distanceText: this.formatDistance(distance),
        durationText: this.formatDuration(duration),
      };
    } catch {
      return null;
    }
  }

  private formatDistance(meters: number): string {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
  }

  private formatDuration(seconds: number): string {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
}
