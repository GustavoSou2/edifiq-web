import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import {
  Delivery,
  Rating,
  PaginatedResponse,
  PaginationParams,
} from '../../../shared/types/domain.types';

export interface UpdateDeliveryPayload {
  trackingCode?: string;
  scheduledAt?:  string;
}

export interface ConfirmDeliveryPayload {
  proofUrl?: string;
}

export interface RateDeliveryPayload {
  score:    1 | 2 | 3 | 4 | 5;
  comment?: string;
}

@Injectable({ providedIn: 'root' })
export class DeliveriesApiService extends ApiService {

  /** Lista entregas com paginação */
  list(params?: PaginationParams & { status?: string }): Observable<PaginatedResponse<Delivery>> {
    return this.get<PaginatedResponse<Delivery>>('/deliveries', params as Record<string, unknown>);
  }

  /** Busca uma entrega pelo ID */
  findById(id: string): Observable<Delivery> {
    return this.get<Delivery>(`/deliveries/${id}`);
  }

  /** Atualiza dados da entrega (tracking, agendamento) */
  update(id: string, payload: UpdateDeliveryPayload): Observable<Delivery> {
    return this.patch<Delivery>(`/deliveries/${id}`, payload);
  }

  /** Marca entrega como despachada (in_transit) */
  dispatch(id: string): Observable<Delivery> {
    return this.post<Delivery>(`/deliveries/${id}/dispatch`, {});
  }

  /** Confirma entrega recebida (delivered) */
  confirm(id: string, payload?: ConfirmDeliveryPayload): Observable<Delivery> {
    return this.post<Delivery>(`/deliveries/${id}/confirm`, payload ?? {});
  }

  /** Marca entrega como falha */
  fail(id: string, reason?: string): Observable<Delivery> {
    return this.post<Delivery>(`/deliveries/${id}/fail`, { reason });
  }

  /** Avalia o fornecedor após a entrega */
  rate(id: string, payload: RateDeliveryPayload): Observable<Rating> {
    return this.post<Rating>(`/deliveries/${id}/rate`, payload);
  }
}
