import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import {
  Order,
  OrderItem,
  OrderFilters,
  PaginatedResponse,
} from '../../../shared/types/domain.types';

export interface CreateOrderPayload {
  deliveryAddress:    string;
  deliveryCity:       string;
  deliveryState:      string;
  deliveryLat?:       number;
  deliveryLng?:       number;
  isUrgent:           boolean;
  auctionDurationMin: number;
  maxSuppliers:       number;
  referenceCode?:     string;
  notes?:             string;
  items: {
    categoryId:  string;
    description: string;
    quantity:    number;
    unit:        string;
    sortOrder?:  number;
  }[];
}

export interface PublishOrderPayload {
  expiresAt?: string;
}

@Injectable({ providedIn: 'root' })
export class OrdersApiService extends ApiService {

  /** Lista pedidos com filtros e paginação */
  list(filters?: OrderFilters): Observable<PaginatedResponse<Order>> {
    return this.get<PaginatedResponse<Order>>('/orders', filters as Record<string, unknown>);
  }

  /** Busca um pedido pelo ID */
  findById(id: string): Observable<Order> {
    return this.get<Order>(`/orders/${id}`);
  }

  /** Cria um novo pedido (status: draft) */
  create(payload: CreateOrderPayload): Observable<Order> {
    return this.post<Order>('/orders', payload);
  }

  /** Atualiza um pedido em rascunho */
  update(id: string, payload: Partial<CreateOrderPayload>): Observable<Order> {
    return this.put<Order>(`/orders/${id}`, payload);
  }

  /** Publica o pedido (draft → open → in_auction) */
  publish(id: string, payload?: PublishOrderPayload): Observable<Order> {
    return this.post<Order>(`/orders/${id}/publish`, payload ?? {});
  }

  /** Cancela um pedido */
  cancel(id: string, reason?: string): Observable<Order> {
    return this.post<Order>(`/orders/${id}/cancel`, { reason });
  }

  /** Lista os itens de um pedido */
  listItems(orderId: string): Observable<OrderItem[]> {
    return this.get<OrderItem[]>(`/orders/${orderId}/items`);
  }

  /** Exclui um pedido em rascunho */
  remove(id: string): Observable<void> {
    return this.delete<void>(`/orders/${id}`);
  }
}
