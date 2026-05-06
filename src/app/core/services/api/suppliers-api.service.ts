import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import {
  Supplier,
  Category,
  SupplierFilters,
  PaginatedResponse,
} from '../../../shared/types/domain.types';

export interface CreateSupplierPayload {
  companyName:    string;
  cnpj:           string;
  email:          string;
  phone?:         string;
  city:           string;
  state:          string;
  lat:            number;
  lng:            number;
  responseSlaMin: number;
  maxDeliveryKm:  number;
  categoryIds:    string[];
}

@Injectable({ providedIn: 'root' })
export class SuppliersApiService extends ApiService {

  /** Lista fornecedores com filtros */
  list(filters?: SupplierFilters): Observable<PaginatedResponse<Supplier>> {
    return this.get<PaginatedResponse<Supplier>>('/suppliers', filters as Record<string, unknown>);
  }

  /** Busca um fornecedor pelo ID */
  findById(id: string): Observable<Supplier> {
    return this.get<Supplier>(`/suppliers/${id}`);
  }

  /** Cria um fornecedor */
  create(payload: CreateSupplierPayload): Observable<Supplier> {
    return this.post<Supplier>('/suppliers', payload);
  }

  /** Atualiza um fornecedor */
  update(id: string, payload: Partial<CreateSupplierPayload>): Observable<Supplier> {
    return this.put<Supplier>(`/suppliers/${id}`, payload);
  }

  /** Bloqueia um fornecedor */
  block(id: string, reason?: string): Observable<Supplier> {
    return this.post<Supplier>(`/suppliers/${id}/block`, { reason });
  }

  /** Reativa um fornecedor bloqueado */
  unblock(id: string): Observable<Supplier> {
    return this.post<Supplier>(`/suppliers/${id}/unblock`, {});
  }

  /** Remove um fornecedor */
  remove(id: string): Observable<void> {
    return this.delete<void>(`/suppliers/${id}`);
  }

  /** Lista as categorias de um fornecedor */
  listCategories(supplierId: string): Observable<Category[]> {
    return this.get<Category[]>(`/suppliers/${supplierId}/categories`);
  }

  /** Atualiza as categorias de um fornecedor */
  updateCategories(supplierId: string, categoryIds: string[]): Observable<Category[]> {
    return this.put<Category[]>(`/suppliers/${supplierId}/categories`, { categoryIds });
  }
}
