import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api.service';

export interface SupplierProfile {
  id:              string;
  companyName:     string;
  email:           string | null;
  phone:           string | null;
  address:         string | null;
  city:            string;
  state:           string;
  postalCode:      string | null;
  lat:             number | null;
  lng:             number | null;
  maxDeliveryKm:   number;
  responseSlaMin:  number;
  reputationScore: number;
  active:          boolean;
}

export interface CreateSupplierProfilePayload {
  companyName:    string;
  email?:         string | null;
  phone?:         string | null;
  address?:       string | null;
  city:           string;
  state:          string;
  postalCode?:    string | null;
  lat?:           number | null;
  lng?:           number | null;
  maxDeliveryKm?: number;
}

export type UpdateSupplierProfilePayload = Partial<CreateSupplierProfilePayload>;

@Injectable({ providedIn: 'root' })
export class SupplierProfileApiService extends ApiService {

  /** Retorna o perfil de fornecedor do tenant logado. 404 se não existir. */
  getProfile(): Observable<SupplierProfile> {
    return this.get<SupplierProfile>('/v1/me/supplier-profile');
  }

  /** Cria o perfil de fornecedor (onboarding). */
  create(payload: CreateSupplierProfilePayload): Observable<SupplierProfile> {
    return this.post<SupplierProfile>('/v1/me/supplier-profile', payload);
  }

  /** Atualiza campos do perfil de fornecedor. */
  update(payload: UpdateSupplierProfilePayload): Observable<SupplierProfile> {
    return this.patch<SupplierProfile>('/v1/me/supplier-profile', payload);
  }
}
