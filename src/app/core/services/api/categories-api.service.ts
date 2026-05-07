import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { Category } from '../../../shared/types/domain.types';

export interface CreateCategoryPayload {
  name:     string;
  slug:     string;
  parentId: string | null;
}

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
}

@Injectable({ providedIn: 'root' })
export class CategoriesApiService extends ApiService {

  /** Lista todas as categorias (árvore completa) */
  listAll(): Observable<Category[]> {
    return this.getRaw<Category[]>('/categories');
  }

  /** Lista apenas categorias raiz (sem parent) */
  listRoots(): Observable<Category[]> {
    return this.getRaw<Category[]>('/categories', { root: true });
  }

  /** Lista filhas de uma categoria */
  listChildren(parentId: string): Observable<Category[]> {
    return this.getRaw<Category[]>(`/categories/${parentId}/children`);
  }

  /** Cria uma categoria */
  create(payload: CreateCategoryPayload): Observable<Category> {
    return this.post<Category>('/categories', payload);
  }

  /** Atualiza uma categoria */
  update(id: string, payload: UpdateCategoryPayload): Observable<Category> {
    return this.put<Category>(`/categories/${id}`, payload);
  }

  /** Remove uma categoria */
  remove(id: string): Observable<void> {
    return this.delete<void>(`/categories/${id}`);
  }

  /** Busca categorias por nome (para autocomplete) */
  search(query: string): Observable<Category[]> {
    return this.getRaw<Category[]>('/categories/search', { q: query });
  }
}
