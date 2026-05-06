import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import {
  Proposal,
  ProposalItem,
  PaginatedResponse,
  PaginationParams,
} from '../../../shared/types/domain.types';

export interface SubmitProposalPayload {
  orderId:     string;
  totalPrice:  number;
  deliveryMin: number;
  items: {
    orderItemId: string;
    unitPrice:   number;
    quantity:    number;
    available:   boolean;
  }[];
}

export interface SelectProposalPayload {
  reason?: string;
}

@Injectable({ providedIn: 'root' })
export class ProposalsApiService extends ApiService {

  /** Lista propostas de um pedido */
  listByOrder(orderId: string, params?: PaginationParams): Observable<PaginatedResponse<Proposal>> {
    return this.get<PaginatedResponse<Proposal>>(
      `/orders/${orderId}/proposals`,
      params as Record<string, unknown>,
    );
  }

  /** Busca uma proposta pelo ID */
  findById(id: string): Observable<Proposal> {
    return this.get<Proposal>(`/proposals/${id}`);
  }

  /** Envia uma proposta (fornecedor) */
  submit(payload: SubmitProposalPayload): Observable<Proposal> {
    return this.post<Proposal>('/proposals', payload);
  }

  /** Atualiza uma proposta ainda não aceita */
  update(id: string, payload: Partial<SubmitProposalPayload>): Observable<Proposal> {
    return this.put<Proposal>(`/proposals/${id}`, payload);
  }

  /** Seleciona uma proposta (comprador) — encerra o leilão */
  select(id: string, payload?: SelectProposalPayload): Observable<Proposal> {
    return this.post<Proposal>(`/proposals/${id}/select`, payload ?? {});
  }

  /** Retira uma proposta (fornecedor) */
  withdraw(id: string): Observable<Proposal> {
    return this.post<Proposal>(`/proposals/${id}/withdraw`, {});
  }

  /** Lista os itens de uma proposta */
  listItems(proposalId: string): Observable<ProposalItem[]> {
    return this.get<ProposalItem[]>(`/proposals/${proposalId}/items`);
  }
}
