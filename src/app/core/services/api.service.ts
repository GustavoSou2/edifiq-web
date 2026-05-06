import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/* ── Tipos de resposta da API ───────────────────────────────*/

export interface ApiResponse<T> {
  data:    T;
  message: string;
  success: boolean;
}

export interface ApiError {
  status:  number;
  code:    string;
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * ApiService — cliente HTTP base do Edifiq.
 *
 * Centraliza:
 * - URL base via environment
 * - Serialização de query params (ignora null/undefined)
 * - Unwrap automático do envelope `{ data, message, success }`
 * - Normalização de erros para `ApiError`
 *
 * Todos os serviços de domínio estendem esta classe.
 *
 * @example
 * // Serviço de domínio
 * @Injectable({ providedIn: 'root' })
 * export class OrdersApiService extends ApiService {
 *   list(filters: OrderFilters) {
 *     return this.get<PaginatedResponse<Order>>('/orders', filters);
 *   }
 * }
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http    = inject(HttpClient);
  protected readonly base  = environment.apiUrl;

  /* ── GET ────────────────────────────────────────────────── */

  get<T>(path: string, params?: Record<string, unknown>): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(this.url(path), { params: this.buildParams(params) })
      .pipe(map(r => r.data), catchError(this.handleError));
  }

  /** GET sem envelope — para endpoints que retornam o payload direto */
  getRaw<T>(path: string, params?: Record<string, unknown>): Observable<T> {
    return this.http
      .get<T>(this.url(path), { params: this.buildParams(params) })
      .pipe(catchError(this.handleError));
  }

  /* ── POST ───────────────────────────────────────────────── */

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(this.url(path), body)
      .pipe(map(r => r.data), catchError(this.handleError));
  }

  /* ── PUT ────────────────────────────────────────────────── */

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .put<ApiResponse<T>>(this.url(path), body)
      .pipe(map(r => r.data), catchError(this.handleError));
  }

  /* ── PATCH ──────────────────────────────────────────────── */

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .patch<ApiResponse<T>>(this.url(path), body)
      .pipe(map(r => r.data), catchError(this.handleError));
  }

  /* ── DELETE ─────────────────────────────────────────────── */

  delete<T = void>(path: string): Observable<T> {
    return this.http
      .delete<ApiResponse<T>>(this.url(path))
      .pipe(map(r => r.data), catchError(this.handleError));
  }

  /* ── Helpers ────────────────────────────────────────────── */

  /** Monta a URL completa */
  protected url(path: string): string {
    const clean = path.startsWith('/') ? path : `/${path}`;
    return `${this.base}${clean}`;
  }

  /**
   * Converte um objeto em HttpParams,
   * ignorando chaves com valor null ou undefined.
   */
  protected buildParams(obj?: Record<string, unknown>): HttpParams {
    let params = new HttpParams();
    if (!obj) return params;

    Object.entries(obj).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      if (Array.isArray(value)) {
        value.forEach(v => { params = params.append(key, String(v)); });
      } else {
        params = params.set(key, String(value));
      }
    });

    return params;
  }

  /** Normaliza erros HTTP para `ApiError` */
  protected handleError(err: HttpErrorResponse): Observable<never> {
    const apiError: ApiError = {
      status:  err.status,
      code:    err.error?.code    ?? 'UNKNOWN_ERROR',
      message: err.error?.message ?? err.message ?? 'Erro inesperado.',
      errors:  err.error?.errors,
    };

    /* Mensagens amigáveis por status */
    if (err.status === 0) {
      apiError.message = 'Sem conexão com o servidor. Verifique sua internet.';
    } else if (err.status === 401) {
      apiError.message = 'Sessão expirada. Faça login novamente.';
    } else if (err.status === 403) {
      apiError.message = 'Você não tem permissão para realizar esta ação.';
    } else if (err.status === 404) {
      apiError.message = 'Recurso não encontrado.';
    } else if (err.status === 422) {
      apiError.message = 'Dados inválidos. Verifique os campos e tente novamente.';
    } else if (err.status >= 500) {
      apiError.message = 'Erro interno do servidor. Tente novamente em instantes.';
    }

    return throwError(() => apiError);
  }
}
