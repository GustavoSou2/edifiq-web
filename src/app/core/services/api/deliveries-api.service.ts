import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { Delivery, PaginationParams } from '../../../shared/types/domain.types';

export interface DeliveryDetail {
  // Entrega
  id:                      string;
  status:                  string;
  trackingCode:            string | null;
  scheduledAt:             string | null;
  dispatchedAt:            string | null;
  deliveredAt:             string | null;
  proofUrl:                string | null;
  // Pedido
  orderId:                 string;
  orderTitle:              string | null;
  orderReferenceCode:      string | null;
  deliveryAddress:         string;
  deliveryCity:            string | null;
  deliveryState:           string | null;
  deliveryLat:             number | null;
  deliveryLng:             number | null;
  // Supplier
  supplierName:            string | null;
  supplierCity:            string | null;
  supplierState:           string | null;
  supplierLat:             number | null;
  supplierLng:             number | null;
  supplierReputationScore: number | null;
  // Proposta
  proposalId:              string;
  proposalTotalPrice:      number;
  proposalDeliveryEtaHours: number | null;
  proposalProposedDeliveryAt: string | null;
  proposalMessage:         string | null;
}

export interface UpdateDeliveryStatusPayload {
  status:       string;
  trackingCode?: string | null;
  proofUrl?:    string | null;
}

@Injectable({ providedIn: 'root' })
export class DeliveriesApiService extends ApiService {

  /** Lista entregas do tenant com filtro opcional por status */
  list(params?: PaginationParams & { status?: string }): Observable<Delivery[]> {
    return this.get<Delivery[]>('/v1/deliveries', params as Record<string, unknown>);
  }

  /** Busca uma entrega pelo ID com dados expandidos (pedido, supplier, proposta) */
  findById(id: string): Observable<DeliveryDetail> {
    return this.get<DeliveryDetail>(`/v1/deliveries/${id}`);
  }

  /** Atualiza o status da entrega (fornecedor) */
  updateStatus(id: string, payload: UpdateDeliveryStatusPayload): Observable<Delivery> {
    return this.patch<Delivery>(`/v1/deliveries/${id}`, payload);
  }
}
