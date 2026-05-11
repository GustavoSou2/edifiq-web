import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, Subject, switchMap, catchError, of, map } from 'rxjs';

import { PageHeaderComponent }  from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ButtonComponent }      from '../../../../shared/components/button/button.component';
import { InputComponent }       from '../../../../shared/components/input/input.component';
import { MapComponent }         from '../../../../shared/components/map/map.component';
import { MapConfig }            from '../../../../shared/components/map/map.types';
import { OrderStatus, Order } from '../../../../shared/types/domain.types';
import { ToastService }         from '../../../../shared/services/toast.service';
import { toSignal }             from '@angular/core/rxjs-interop';
import { OrdersApiService }     from 'src/app/core/services/api';

type DetailTab = 'items' | 'proposals' | 'distribution' | 'history';

interface NominatimResult {
  display_name: string;
  lat:          string;
  lon:          string;
  address: {
    road?:         string;
    house_number?: string;
    city?:         string;
    town?:         string;
    village?:      string;
    state?:        string;
  };
}

const BANNER_MAP_CONFIG: MapConfig = {
  zoomControl:     true,
  dragging:        true,
  scrollWheelZoom: false,
  doubleClickZoom: true,
  touchZoom:       true,
  keyboard:        false,
  attribution:     false,
  tileStyle:       'positron',
  fitBounds:       false,
  markerSize:      34,
  markerTail:      true,
  borderRadius:    '0',
};

const STATUS_COLOR_MAP: Record<OrderStatus, string> = {
  draft:      '#9CA3AF',
  open:       '#2563EB',
  in_auction: '#DC2626',
  selected:   '#D97706',
  confirmed:  '#059669',
  cancelled:  '#DC2626',
  expired:    '#9CA3AF',
};

@Component({
  selector: 'edq-order-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule, PageHeaderComponent, StatusBadgeComponent, ButtonComponent, InputComponent, MapComponent],
  template: `
    <!-- ── Banner de mapa ─────────────────────────────────── -->
    <div class="map-banner" [class.map-banner--no-location]="!hasLocation()">
      @if (hasLocation()) {
        <edq-map
          [lat]="order()?.deliveryLat ?? -23.5505"
          [lng]="order()?.deliveryLng ?? -46.6333"
          [height]="400"
          [zoom]="15"
          [config]="bannerConfig()"
          [ariaLabel]="'Localização — ' + order()?.deliveryAddress"
        />
        <div class="map-banner__overlay">
          <div class="map-banner__info">
            <div class="map-banner__location">
              <span class="map-banner__pin">📍</span>
              <div>
                <span class="map-banner__city">{{ order()?.deliveryCity }}, {{ order()?.deliveryState }}</span>
                <span class="map-banner__address">{{ order()?.deliveryAddress }}</span>
              </div>
            </div>
            <div class="map-banner__badges">
              <edq-status-badge [status]="order()?.status ?? 'draft'" />
              @if (order()?.isUrgent) {
                <span class="urgent-pill">🔥 URGENTE</span>
              }
              @if (order()?.status === 'in_auction') {
                <span class="auction-live-pill">⏱ Leilão ativo</span>
              }
              <button class="edit-location-btn" type="button" (click)="openAddressModal()">
                ✏️ Editar
              </button>
            </div>
          </div>
        </div>
      } @else {
        <div class="map-banner__placeholder">
          <span class="map-banner__placeholder-icon">📍</span>
          <p class="map-banner__placeholder-text">Endereço de entrega não cadastrado</p>
          <edq-button variant="primary" size="sm" (clicked)="openAddressModal()">
            Adicionar endereço
          </edq-button>
        </div>
      }
    </div>

    <!-- ── Status Action Bar ──────────────────────────────── -->
    @if (statusAction(); as action) {
      <div class="status-action-bar" [attr.data-status]="order()?.status">
        <div class="status-action-bar__content">
          <div class="status-action-bar__info">
            <span class="status-action-bar__icon">{{ action.icon }}</span>
            <div>
              <p class="status-action-bar__title">{{ action.title }}</p>
              <p class="status-action-bar__desc">{{ action.description }}</p>
            </div>
          </div>
          @if (action.actions.length > 0) {
            <div class="status-action-bar__actions">
              @for (btn of action.actions; track btn.key) {
                <edq-button
                  [variant]="btn.variant"
                  size="sm"
                  [loading]="actionLoading() === btn.key"
                  [disabled]="btn.disabled()"
                  (clicked)="handleAction(btn.key)"
                >
                  {{ btn.label }}
                </edq-button>
              }
            </div>
          }
        </div>
      </div>
    }

    <!-- ── Page header ────────────────────────────────────── -->
    <div class="detail-content">
      <edq-page-header
        [title]="order()?.title ?? order()?.referenceCode ?? ''"
        [subtitle]="'Criado em ' + order()?.createdAt"
      >
        <edq-button slot="actions" variant="secondary" size="sm" routerLink="../">
          ← Voltar
        </edq-button>
        @if (order()?.status === 'in_auction' || order()?.status === 'open') {
          <edq-button slot="actions" variant="primary" size="sm" routerLink="proposals">
            Ver Propostas
          </edq-button>
        }
      </edq-page-header>

      <!-- ── Info cards ─────────────────────────────────────── -->
      <div class="order-info-grid">
        <div class="info-card">
          <span class="info-card__label">Status</span>
          <edq-status-badge [status]="order()?.status ?? 'draft'" />
        </div>
        <div class="info-card">
          <span class="info-card__label">Urgência</span>
          @if (order()?.isUrgent) {
            <span class="badge-urgent">URGENTE</span>
          } @else {
            <span class="info-card__value">Normal</span>
          }
        </div>
        <div class="info-card" [class.info-card--warning]="!hasLocation()">
          <span class="info-card__label">Cidade</span>
          @if (hasLocation()) {
            <span class="info-card__value">{{ order()?.deliveryCity }}, {{ order()?.deliveryState }}</span>
          } @else {
            <button class="info-card__add-btn" type="button" (click)="openAddressModal()">
              + Adicionar endereço
            </button>
          }
        </div>
        <div class="info-card">
          <span class="info-card__label">Duração do Leilão</span>
          <span class="info-card__value">{{ order()?.auctionDurationMin }} min</span>
        </div>
        <div class="info-card">
          <span class="info-card__label">Propostas</span>
          <span class="info-card__value info-card__value--highlight">
            {{ proposalCount() }} recebida{{ proposalCount() !== 1 ? 's' : '' }}
          </span>
        </div>
        <div class="info-card">
          <span class="info-card__label">Fornecedores</span>
          <span class="info-card__value">Até {{ order()?.maxSuppliers }}</span>
        </div>
      </div>

      <!-- ── Tabs ───────────────────────────────────────────── -->
      <div class="tabs" role="tablist" aria-label="Seções do pedido">
        @for (tab of tabs; track tab.id) {
          <button
            class="tab"
            role="tab"
            [class.tab--active]="activeTab() === tab.id"
            [attr.aria-selected]="activeTab() === tab.id"
            (click)="activeTab.set(tab.id)"
          >
            {{ tab.label }}
          </button>
        }
      </div>

      <!-- ── Tab content ────────────────────────────────────── -->
      <div class="tab-content" role="tabpanel">
        @switch (activeTab()) {
          @case ('items') {
            <div class="items-table-wrapper">
              <table class="data-table" aria-label="Itens do pedido">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Descrição</th>
                    <th scope="col">Categoria</th>
                    <th scope="col">Qtd</th>
                    <th scope="col">Unidade</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of order()?.items ?? []; track item?.id; let i = $index) {
                    <tr>
                      <td class="mono">{{ i + 1 }}</td>
                      <td>{{ item?.description }}</td>
                      <td><span class="category-chip">{{ item?.categoryId ?? '—' }}</span></td>
                      <td class="mono">{{ item?.quantity }}</td>
                      <td class="mono">{{ item?.unit }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
          @case ('proposals') {
            <div class="tab-placeholder">
              <span class="tab-placeholder__icon">💬</span>
              <p>{{ proposalCount() }} propostas recebidas.</p>
              <a routerLink="proposals" class="tab-link">Ver comparativo completo →</a>
            </div>
          }
          @case ('distribution') {
            <div class="tab-placeholder">
              <span class="tab-placeholder__icon">📡</span>
              <p>Fornecedores notificados para este pedido.</p>
            </div>
          }
          @case ('history') {
            <div class="tab-placeholder">
              <span class="tab-placeholder__icon">🕐</span>
              <p>Histórico de eventos do pedido.</p>
            </div>
          }
        }
      </div>
    </div>

    <!-- ── Modal: Endereço de Entrega ─────────────────────── -->
    @if (addressModalOpen()) {
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Endereço de entrega">
        <div class="modal modal--address" (click)="$event.stopPropagation()">

          <div class="modal__header">
            <h3 class="modal__title">📍 Endereço de Entrega</h3>
            <button class="modal__close" type="button" aria-label="Fechar" (click)="closeAddressModal()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="modal__body modal__body--address">

            <!-- Busca geocoding -->
            <div class="address-search">
              <edq-input
                label="Buscar endereço"
                placeholder="Ex: Av. Paulista, 1000, São Paulo"
                [(value)]="addressQuery"
                (valueChange)="onAddressQueryChange($event)"
              />
              @if (geocodingLoading()) {
                <p class="address-search__hint">🔍 Buscando...</p>
              }
              @if (geocodingResults().length > 0) {
                <ul class="address-suggestions" role="listbox">
                  @for (result of geocodingResults(); track result.display_name) {
                    <li class="address-suggestion" role="option" (click)="selectGeocodingResult(result)">
                      <span class="address-suggestion__icon">📍</span>
                      <span class="address-suggestion__text">{{ result.display_name }}</span>
                    </li>
                  }
                </ul>
              }
            </div>

            <!-- Preview mapa -->
            <div class="address-map-preview">
              <edq-map
                [lat]="previewLat()"
                [lng]="previewLng()"
                [height]="220"
                [zoom]="15"
                [config]="previewMapConfig"
                ariaLabel="Preview do endereço"
                (mapClick)="onMapClick($event)"
              />
              <p class="address-map-hint">Clique no mapa para ajustar o pino de entrega</p>
            </div>

            <!-- Campos manuais -->
            <div class="address-fields">
              <edq-input
                label="Endereço completo"
                placeholder="Rua, número, complemento"
                [(value)]="addressForm.deliveryAddress"
              />
              <div class="address-fields__row">
                <edq-input label="Cidade" placeholder="São Paulo" [(value)]="addressForm.deliveryCity" />
                <edq-input label="Estado" placeholder="SP" [(value)]="addressForm.deliveryState" />
              </div>
            </div>

            @if (addressError()) {
              <div class="form-error" role="alert">{{ addressError() }}</div>
            }
          </div>

          <div class="modal__footer">
            <edq-button variant="secondary" (clicked)="closeAddressModal()">Cancelar</edq-button>
            <edq-button
              variant="primary"
              [loading]="savingAddress()"
              [disabled]="!addressForm.deliveryAddress || !addressForm.deliveryCity"
              (clicked)="saveAddress()"
            >
              Salvar Endereço
            </edq-button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './order-detail.component.scss',
})
export class OrderDetailComponent {
  private readonly route            = inject(ActivatedRoute);
  private readonly router           = inject(Router);
  private readonly ordersApiService = inject(OrdersApiService);
  private readonly toast            = inject(ToastService);
  private readonly http             = inject(HttpClient);

  /* ── Route param ────────────────────────────────────────── */
  private readonly paramMap = toSignal(
    this.route.paramMap.pipe(map(params => ({ id: params.get('id') }))),
    { initialValue: { id: null } },
  );
  readonly id = computed(() => this.paramMap().id ?? '');

  /* ── Order data ─────────────────────────────────────────── */
  private readonly _order = signal<Order | undefined>(undefined);
  protected readonly order = this._order.asReadonly();
  protected readonly proposalCount = signal(0);

  /* ── UI state ───────────────────────────────────────────── */
  protected readonly activeTab     = signal<DetailTab>('items');
  protected readonly actionLoading = signal<string | null>(null);

  /* ── Address modal ──────────────────────────────────────── */
  protected readonly addressModalOpen = signal(false);
  protected readonly geocodingLoading = signal(false);
  protected readonly geocodingResults = signal<NominatimResult[]>([]);
  protected readonly savingAddress    = signal(false);
  protected readonly addressError     = signal('');
  protected addressQuery              = '';
  protected readonly previewLat       = signal(-23.5505);
  protected readonly previewLng       = signal(-46.6333);
  protected addressForm = { deliveryAddress: '', deliveryCity: '', deliveryState: '' };

  private readonly geocodeSubject = new Subject<string>();

  protected readonly previewMapConfig: MapConfig = {
    zoomControl: true, dragging: true, scrollWheelZoom: true,
    tileStyle: 'positron', markerSize: 32, markerTail: true,
    markerColor: '#4F46E5', fitBounds: false, attribution: false,
    borderRadius: 'var(--radius-lg)',
  };

  /* ── Tabs ───────────────────────────────────────────────── */
  protected readonly tabs: { id: DetailTab; label: string }[] = [
    { id: 'items',        label: 'Itens' },
    { id: 'proposals',    label: 'Propostas' },
    { id: 'distribution', label: 'Fornecedores Convidados' },
    { id: 'history',      label: 'Histórico' },
  ];

  /* ── Computed ───────────────────────────────────────────── */
  protected readonly hasLocation = computed(() => {
    const o = this.order();
    return !!(o?.deliveryCity || o?.deliveryAddress);
  });

  protected readonly statusAction = computed(() => {
    const o = this.order();
    if (!o) return null;
    const noAddr = !this.hasLocation();

    type Action = { key: string; label: string; variant: 'primary' | 'secondary' | 'danger' | 'ghost'; disabled: () => boolean };
    type StatusActionResult = { icon: string; title: string; description: string; actions: Action[] };

    const result = (r: StatusActionResult) => r;

    switch (o.status) {
      case 'draft':
        return result({
          icon: '📝',
          title: 'Pedido em Rascunho',
          description: noAddr
            ? 'Adicione o endereço de entrega antes de publicar o pedido.'
            : 'Revise os itens e publique para receber propostas dos fornecedores.',
          actions: [
            ...(noAddr ? [{ key: 'add-address', label: '📍 Adicionar Endereço', variant: 'secondary' as const, disabled: (): boolean => false }] : []),
            { key: 'publish', label: '🚀 Publicar Pedido', variant: 'primary' as const, disabled: (): boolean => noAddr },
          ],
        });
      case 'open':
        return result({
          icon: '📢', title: 'Pedido Publicado',
          description: 'Aguardando início do leilão. Fornecedores já podem visualizar.',
          actions: [{ key: 'cancel', label: 'Cancelar Pedido', variant: 'danger' as const, disabled: (): boolean => false }],
        });
      case 'in_auction':
        return result({
          icon: '⏱', title: 'Leilão em Andamento',
          description: `${this.proposalCount()} proposta${this.proposalCount() !== 1 ? 's' : ''} recebida${this.proposalCount() !== 1 ? 's' : ''}. Aguarde o encerramento para selecionar.`,
          actions: [{ key: 'view-proposals', label: '💬 Ver Propostas', variant: 'primary' as const, disabled: (): boolean => this.proposalCount() === 0 }],
        });
      case 'selected':
        return result({
          icon: '✅', title: 'Proposta Selecionada',
          description: 'Uma proposta foi selecionada. Aguardando confirmação do fornecedor.',
          actions: [{ key: 'view-proposals', label: 'Ver Proposta Selecionada', variant: 'primary' as const, disabled: (): boolean => false }],
        });
      case 'confirmed':
        return result({
          icon: '🚚', title: 'Pedido Confirmado',
          description: 'O fornecedor confirmou. Acompanhe a entrega.',
          actions: [{ key: 'view-delivery', label: '🚚 Ver Entrega', variant: 'primary' as const, disabled: (): boolean => false }],
        });
      case 'cancelled':
        return result({ icon: '❌', title: 'Pedido Cancelado', description: 'Este pedido foi cancelado.', actions: [] });
      case 'expired':
        return result({ icon: '⏰', title: 'Pedido Expirado', description: 'O prazo do leilão encerrou sem seleção.', actions: [] });
      default:
        return null;
    }
  });

  protected readonly bannerConfig = computed<MapConfig>(() => ({
    ...BANNER_MAP_CONFIG,
    markerColor: STATUS_COLOR_MAP[this.order()?.status ?? 'draft'],
  }));

  constructor() {
    // Carrega o pedido
    this.ordersApiService.findById(this.id()).subscribe({
      next: o => this._order.set(o),
    });

    // Carrega contagem de propostas
    const id = this.id();
    if (id) {
      this.ordersApiService.listProposals(id).subscribe({
        next: proposals => this.proposalCount.set(proposals.length),
        error: () => {},
      });
    }

    // Geocoding com debounce
    this.geocodeSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.length < 5) { this.geocodingResults.set([]); this.geocodingLoading.set(false); return of([]); }
        this.geocodingLoading.set(true);
        return this.http.get<NominatimResult[]>('https://nominatim.openstreetmap.org/search', {
          params: { q: query, format: 'json', addressdetails: '1', limit: '5', countrycodes: 'br' },
          headers: { 'Accept-Language': 'pt-BR' },
        }).pipe(catchError(() => of([])));
      }),
    ).subscribe(results => {
      this.geocodingResults.set(results as NominatimResult[]);
      this.geocodingLoading.set(false);
    });
  }

  /* ── Actions ────────────────────────────────────────────── */
  protected handleAction(key: string): void {
    switch (key) {
      case 'publish':        this.publishOrder();    break;
      case 'cancel':         this.cancelOrder();     break;
      case 'add-address':    this.openAddressModal(); break;
      case 'view-proposals': this.router.navigate(['proposals'], { relativeTo: this.route }); break;
      case 'view-delivery':  this.router.navigate(['/app/deliveries']); break;
    }
  }

  private publishOrder(): void {
    const id = this.id();
    if (!id) return;
    this.actionLoading.set('publish');
    this.ordersApiService.publish(id).subscribe({
      next: () => {
        this.toast.success('Pedido publicado!', { message: 'Fornecedores serão notificados em breve.' });
        this.actionLoading.set(null);
        this.ordersApiService.findById(id).subscribe({ next: o => this._order.set(o as any) });
      },
      error: (err: any) => {
        this.toast.error('Erro ao publicar', { message: err?.message ?? 'Tente novamente.' });
        this.actionLoading.set(null);
      },
    });
  }

  private cancelOrder(): void {
    this.toast.error('Cancelamento', { message: 'Funcionalidade em desenvolvimento.' });
  }

  /* ── Address modal ──────────────────────────────────────── */
  protected openAddressModal(): void {
    const o = this.order();
    this.addressForm = {
      deliveryAddress: o?.deliveryAddress ?? '',
      deliveryCity:    o?.deliveryCity    ?? '',
      deliveryState:   o?.deliveryState   ?? '',
    };
    if (o?.deliveryLat && o?.deliveryLng) {
      this.previewLat.set(o.deliveryLat);
      this.previewLng.set(o.deliveryLng);
    }
    this.addressQuery = '';
    this.geocodingResults.set([]);
    this.addressError.set('');
    this.addressModalOpen.set(true);
  }

  protected closeAddressModal(): void { this.addressModalOpen.set(false); }

  protected onAddressQueryChange(query: string): void { this.geocodeSubject.next(query); }

  protected selectGeocodingResult(result: NominatimResult): void {
    const lat  = parseFloat(result.lat);
    const lng  = parseFloat(result.lon);
    const addr = result.address;
    const street = [addr.road, addr.house_number].filter(Boolean).join(', ');
    this.previewLat.set(lat);
    this.previewLng.set(lng);
    this.addressForm.deliveryAddress = street || result.display_name.split(',')[0];
    this.addressForm.deliveryCity    = addr.city ?? addr.town ?? addr.village ?? '';
    this.addressForm.deliveryState   = addr.state ?? '';
    this.addressQuery                = result.display_name;
    this.geocodingResults.set([]);
  }

  protected onMapClick(event: { lat: number; lng: number }): void {
    this.previewLat.set(event.lat);
    this.previewLng.set(event.lng);
    this.http.get<any>('https://nominatim.openstreetmap.org/reverse', {
      params: { lat: event.lat.toString(), lon: event.lng.toString(), format: 'json' },
      headers: { 'Accept-Language': 'pt-BR' },
    }).subscribe({
      next: res => {
        if (res?.address) {
          const a = res.address;
          const street = [a.road, a.house_number].filter(Boolean).join(', ');
          if (street) this.addressForm.deliveryAddress = street;
          const city = a.city ?? a.town ?? a.village;
          if (city) this.addressForm.deliveryCity = city;
          if (a.state) this.addressForm.deliveryState = a.state;
        }
      },
    });
  }

  protected saveAddress(): void {
    if (!this.addressForm.deliveryAddress || !this.addressForm.deliveryCity) {
      this.addressError.set('Preencha o endereço e a cidade.');
      return;
    }
    const id = this.id();
    if (!id) return;
    this.savingAddress.set(true);
    this.addressError.set('');
    this.ordersApiService.update(id, {
      deliveryAddress: this.addressForm.deliveryAddress,
      deliveryCity:    this.addressForm.deliveryCity,
      deliveryState:   this.addressForm.deliveryState,
      deliveryLat:     this.previewLat(),
      deliveryLng:     this.previewLng(),
    }).subscribe({
      next: () => {
        this.toast.success('Endereço salvo!');
        this.savingAddress.set(false);
        this.closeAddressModal();
        this.ordersApiService.findById(id).subscribe({ next: o => this._order.set(o as any) });
      },
      error: (err: any) => {
        this.addressError.set(err?.message ?? 'Erro ao salvar endereço.');
        this.savingAddress.set(false);
      },
    });
  }
}
