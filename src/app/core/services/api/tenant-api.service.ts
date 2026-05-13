import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { Tenant, Plan, Webhook } from '../../../shared/types/domain.types';

export interface UpdateTenantPayload {
  name?:     string;
  cnpj?:     string;
  settings?: Record<string, unknown>;
}

export interface CreateWebhookPayload {
  url:       string;
  events:    string[];
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class TenantApiService extends ApiService {

  /** Retorna os dados do tenant atual */
  getCurrent(): Observable<Tenant> {
    return this.get<Tenant>('/tenant');
  }

  /** Atualiza dados do tenant */
  update(payload: UpdateTenantPayload): Observable<Tenant> {
    return this.patch<Tenant>('/tenant', payload);
  }

  /** Lista planos disponíveis */
  listPlans(): Observable<Plan[]> {
    return this.get<Plan[]>('/plans');
  }

  listSupplierByTenantId(tenantId: string): Observable<any[]> {
    return this.getRaw<any[]>('/suppliers/search/findAllByTenant_Id', {
      tenantId
    })
  }

  /** Faz upgrade/downgrade de plano */
  changePlan(planId: string): Observable<Tenant> {
    return this.post<Tenant>('/tenant/plan', { planId });
  }

  /* ── Webhooks ───────────────────────────────────────────── */

  /** Lista webhooks configurados */
  listWebhooks(): Observable<Webhook[]> {
    return this.get<Webhook[]>('/webhooks');
  }

  /** Cria um webhook */
  createWebhook(payload: CreateWebhookPayload): Observable<Webhook> {
    return this.post<Webhook>('/webhooks', payload);
  }

  /** Atualiza um webhook */
  updateWebhook(id: string, payload: Partial<CreateWebhookPayload>): Observable<Webhook> {
    return this.put<Webhook>(`/webhooks/${id}`, payload);
  }

  /** Ativa/desativa um webhook */
  toggleWebhook(id: string, active: boolean): Observable<Webhook> {
    return this.patch<Webhook>(`/webhooks/${id}`, { isActive: active });
  }

  /** Remove um webhook */
  removeWebhook(id: string): Observable<void> {
    return this.delete<void>(`/webhooks/${id}`);
  }
}
