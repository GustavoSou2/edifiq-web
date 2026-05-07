import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { Order, OrderItem, OrderFilters, PaginatedResponse } from '../../../shared/types/domain.types';

/* ── Request payloads ───────────────────────────────────────*/

export interface CreateOrderPayload {
  title:                string;
  description?:         string | null;
  scheduledAt?:         string | null;
  deliveryAddress?:     string | null;
  deliveryCity?:        string | null;
  deliveryState?:       string | null;
  deliveryLat?:         number | null;
  deliveryLng?:         number | null;
  deliveryWindowStart:  string;           // ISO-8601, obrigatório
  deliveryWindowEnd?:   string | null;
  isUrgent?:            boolean;
  auctionDurationMin?:  number;
  maxSuppliers?:        number;
  referenceCode?:       string | null;
  notes?:               string | null;
  items: {
    description: string;
    quantity:    number;
    categoryId?: string | null;
    unit?:       string | null;
    notes?:      string | null;
    sortOrder?:  number;
  }[];
}

export interface SelectProposalPayload {
  proposalId: string;
}

export interface CreateRatingPayload {
  score:    number;
  comment?: string | null;
}

@Injectable({ providedIn: 'root' })
export class OrdersApiService extends ApiService {

  /** Lista pedidos do tenant */
  list(filters?: OrderFilters): Observable<PaginatedResponse<Order>> {
    return this.get<PaginatedResponse<Order>>('/orders', filters as Record<string, unknown>);
  }

  /** Busca um pedido pelo ID */
  findById(id: string): Observable<Order> {
    return this.get<Order>(`/orders/${id}`);
  }

  /** Cria um novo pedido */
  create(payload: CreateOrderPayload): Observable<Order> {
    return this.post<Order>('/orders', payload);
  }

  /** Publica o pedido (distribui para fornecedores) */
  publish(id: string): Observable<unknown> {
    return this.post<unknown>(`/orders/${id}/publish`, {});
  }

  /** Lista distribuições de um pedido */
  listDistributions(id: string): Observable<unknown[]> {
    return this.get<unknown[]>(`/orders/${id}/distributions`);
  }

  /** Lista propostas de um pedido */
  listProposals(id: string): Observable<unknown[]> {
    return this.get<unknown[]>(`/orders/${id}/proposals`);
  }

  /** Seleciona uma proposta */
  selectProposal(orderId: string, payload: SelectProposalPayload): Observable<unknown> {
    return this.post<unknown>(`/orders/${orderId}/select`, payload);
  }

  /** Busca a seleção de um pedido */
  getSelection(orderId: string): Observable<unknown> {
    return this.get<unknown>(`/orders/${orderId}/selection`);
  }

  /** Busca a entrega de um pedido */
  getDelivery(orderId: string): Observable<unknown> {
    return this.get<unknown>(`/orders/${orderId}/delivery`);
  }

  /** Avalia o fornecedor após entrega */
  rate(orderId: string, payload: CreateRatingPayload): Observable<unknown> {
    return this.post<unknown>(`/orders/${orderId}/rate`, payload);
  }

  /** Lista itens de proposta */
  listProposalItems(orderId: string, proposalId: string): Observable<unknown[]> {
    return this.get<unknown[]>(`/orders/${orderId}/proposals/${proposalId}/items`);
  }
}
