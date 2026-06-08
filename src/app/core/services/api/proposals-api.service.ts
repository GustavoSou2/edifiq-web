import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import {
  Proposal,
  ProposalItem,
  ProposalStatus,
  PaginationParams,
} from '../../../shared/types/domain.types';

export interface SubmitProposalPayload {
  status:             'submitted';
  deliveryEtaHours?:  number | null;
  proposedDeliveryAt?: string | null;
  message?:           string | null;
  items: {
    orderItemId:  string;
    unitPrice:    number;
    totalPrice:   number;
    availability: 'in_stock' | 'backorder' | 'unavailable';
  }[];
}

/** Distribuição recebida pelo fornecedor — retornada por GET /v1/distributions/received */
export interface ReceivedDistribution {
  id:               string;
  orderId:          string;
  supplierId:       string;
  buyerTenantId:    string;
  supplierTenantId: string;
  status:           string;
  distributedAt:    string;
  /** Proposta enviada pelo fornecedor para esta distribuição (quando existir) */
  proposal?: Proposal;
  /** Dados do pedido expandidos (quando disponíveis) */
  order?: {
    id:              string;
    title:           string | null;
    referenceCode:   string | null;
    status:          string;
    isUrgent:        boolean;
    deliveryAddress: string;
    deliveryCity:    string | null;
    deliveryState:   string | null;
    deliveryLat:     number | null;
    deliveryLng:     number | null;
    notes:           string | null;
    createdAt:       string;
    items: {
      id:          string;
      description: string;
      quantity:    number;
      unit:        string;
      notes:       string | null;
    }[];
  };
}

@Injectable({ providedIn: 'root' })
export class ProposalsApiService extends ApiService {

  /** Lista distribuições recebidas pelo tenant como fornecedor */
  listReceived(): Observable<ReceivedDistribution[]> {
    return this.get<ReceivedDistribution[]>('/v1/distributions/received');
  }

  /** Envia proposta para uma distribuição */
  submitToDistribution(distributionId: string, payload: SubmitProposalPayload): Observable<Proposal> {
    return this.post<Proposal>(`/v1/distributions/${distributionId}/proposals`, payload);
  }

  /** Retira uma proposta (fornecedor) */
  withdraw(distributionId: string): Observable<Proposal> {
    return this.post<Proposal>(`/v1/distributions/${distributionId}/proposals/withdraw`, {});
  }

  /** Lista propostas de um pedido (visão comprador) */
  listByOrder(orderId: string, params?: PaginationParams): Observable<Proposal[]> {
    return this.get<Proposal[]>(
      `/v1/orders/${orderId}/proposals`,
      params as Record<string, unknown>,
    );
  }

  /** Lista os itens de uma proposta */
  listItems(proposalId: string): Observable<ProposalItem[]> {
    return this.get<ProposalItem[]>(`/v1/proposals/${proposalId}/items`);
  }
}
