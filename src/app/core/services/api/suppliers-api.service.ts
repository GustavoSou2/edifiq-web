import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { Supplier, Category, SupplierFilters } from '../../../shared/types/domain.types';

export interface CreateSupplierPayload {
  name:            string;
  email?:          string | null;
  phone?:          string | null;
  address?:        string | null;
  city?:           string | null;
  state?:          string | null;
  postalCode?:     string | null;
  active:          boolean;
  /** ID do tenant da plataforma que este supplier representa (opcional). */
  linkedTenantId?: string | null;
}

export type UpdateSupplierPayload = Partial<CreateSupplierPayload>;

@Injectable({ providedIn: 'root' })
export class SuppliersApiService extends ApiService {

  /** Lista fornecedores do tenant */
  list(filters?: SupplierFilters): Observable<Supplier[]> {
    return this.get<Supplier[]>('/v1/suppliers', filters as Record<string, unknown>);
  }

  /** Busca um fornecedor pelo ID */
  findById(id: string): Observable<Supplier> {
    return this.get<Supplier>(`/v1/suppliers/${id}`);
  }

  /** Cria um fornecedor */
  create(payload: CreateSupplierPayload): Observable<Supplier> {
    return this.post<Supplier>('/v1/suppliers', payload);
  }

  /** Atualiza um fornecedor */
  update(id: string, payload: UpdateSupplierPayload): Observable<Supplier> {
    return this.put<Supplier>(`/v1/suppliers/${id}`, payload);
  }

  /** Remove um fornecedor */
  remove(id: string): Observable<void> {
    return this.delete<void>(`/v1/suppliers/${id}`);
  }

  /** Lista as categorias de um fornecedor */
  listCategories(supplierId: string): Observable<Category[]> {
    return this.get<Category[]>(`/v1/supplier-categories`);
  }
}
