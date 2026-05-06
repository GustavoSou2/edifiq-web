import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { PageHeaderComponent }    from '../../../../shared/components/page-header/page-header.component';
import { ButtonComponent }        from '../../../../shared/components/button/button.component';
import { InputComponent }         from '../../../../shared/components/input/input.component';
import { ToastService }           from '../../../../shared/services/toast.service';
import { CategoriesApiService }   from '../../../../core/services/api/categories-api.service';
import { OrdersApiService, CreateOrderPayload } from '../../../../core/services/api/orders-api.service';
import { Category }               from '../../../../shared/types/domain.types';

type Step = 1 | 2 | 3;

interface OrderItemForm {
  description: string;
  quantity:    string;
  unit:        string;
  categoryId:  string;
}

interface ViaCepResponse {
  logradouro: string;
  bairro:     string;
  localidade: string;
  uf:         string;
  erro?:      boolean;
}

const UNIT_OPTIONS = ['un', 'kg', 'g', 't', 'm', 'm²', 'm³', 'L', 'saco', 'cx', 'rolo', 'par', 'pç'];

@Component({
  selector: 'edq-order-create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, PageHeaderComponent, ButtonComponent, InputComponent],
  template: `
    <edq-page-header title="Novo Pedido" subtitle="Preencha os dados para iniciar o leilão">
      <edq-button slot="actions" variant="secondary" size="sm" routerLink="../">Cancelar</edq-button>
    </edq-page-header>

    <!-- Step indicator -->
    <div class="step-indicator" aria-label="Progresso do formulário">
      @for (s of steps; track s.id) {
        <div class="step" [class.step--active]="currentStep() === s.id" [class.step--done]="currentStep() > s.id">
          <div class="step__circle" [attr.aria-current]="currentStep() === s.id ? 'step' : null">
            @if (currentStep() > s.id) {
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            } @else {
              {{ s.id }}
            }
          </div>
          <span class="step__label">{{ s.label }}</span>
        </div>
        @if (s.id < 3) {
          <div class="step__line" [class.step__line--done]="currentStep() > s.id"></div>
        }
      }
    </div>

    <!-- ── Step 1 — Itens ─────────────────────────────────── -->
    @if (currentStep() === 1) {
      <div class="form-section" aria-label="Passo 1: Itens do pedido">
        <div class="form-section__header">
          <div>
            <h2 class="form-section__title">Itens do Pedido</h2>
            <p class="form-section__desc">Adicione os materiais que você precisa cotar.</p>
          </div>
          <div class="item-count-badge">{{ items().length }} item{{ items().length !== 1 ? 's' : '' }}</div>
        </div>

        <div class="items-list">
          @for (item of items(); track $index; let i = $index) {
            <div class="item-card" [class.item-card--error]="submitted() && !isItemValid(item)">
              <div class="item-card__header">
                <span class="item-card__num">{{ i + 1 }}</span>
                <span class="item-card__title">Item {{ i + 1 }}</span>
                @if (items().length > 1) {
                  <button class="remove-btn" type="button" (click)="removeItem(i)" aria-label="Remover item {{ i + 1 }}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                }
              </div>

              <div class="item-card__body">
                <div class="item-card__desc">
                  <edq-input
                    label="Descrição do material"
                    placeholder="Ex: Saco de Cimento CP-II 50kg"
                    [variant]="submitted() && !item.description ? 'error' : 'default'"
                    [hint]="submitted() && !item.description ? 'Campo obrigatório' : ''"
                    [(value)]="item.description"
                  />
                </div>

                <div class="item-card__row">
                  <edq-input
                    label="Quantidade"
                    type="number"
                    placeholder="0"
                    [variant]="submitted() && (!item.quantity || +item.quantity <= 0) ? 'error' : 'default'"
                    [hint]="submitted() && (!item.quantity || +item.quantity <= 0) ? 'Informe a quantidade' : ''"
                    [(value)]="item.quantity"
                  />

                  <div class="field-group">
                    <label class="field-label">Unidade</label>
                    <div class="unit-select-wrapper">
                      <select
                        class="unit-select"
                        [(ngModel)]="item.unit"
                        [class.unit-select--error]="submitted() && !item.unit"
                        aria-label="Unidade do item {{ i + 1 }}"
                      >
                        <option value="" disabled>Selecione</option>
                        @for (u of unitOptions; track u) {
                          <option [value]="u">{{ u }}</option>
                        }
                      </select>
                    </div>
                    @if (submitted() && !item.unit) {
                      <span class="field-hint field-hint--error">Selecione a unidade</span>
                    }
                  </div>

                  <div class="field-group">
                    <label class="field-label">Categoria</label>
                    <div class="unit-select-wrapper">
                      <select
                        class="unit-select"
                        [(ngModel)]="item.categoryId"
                        [class.unit-select--error]="submitted() && !item.categoryId"
                        aria-label="Categoria do item {{ i + 1 }}"
                      >
                        <option value="" disabled>Selecione</option>
                        @if (categoriesLoading()) {
                          <option disabled>Carregando...</option>
                        }
                        @for (cat of categories(); track cat.id) {
                          <option [value]="cat.id">{{ cat.name }}</option>
                        }
                      </select>
                    </div>
                    @if (submitted() && !item.categoryId) {
                      <span class="field-hint field-hint--error">Selecione a categoria</span>
                    }
                  </div>
                </div>
              </div>
            </div>
          }
        </div>

        <button class="add-item-btn" type="button" (click)="addItem()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Adicionar item
        </button>
      </div>
    }

    <!-- ── Step 2 — Entrega ───────────────────────────────── -->
    @if (currentStep() === 2) {
      <div class="form-section" aria-label="Passo 2: Endereço de entrega">
        <h2 class="form-section__title">Endereço de Entrega</h2>
        <p class="form-section__desc">Onde os materiais devem ser entregues?</p>

        <div class="cep-row">
          <div class="cep-field">
            <edq-input
              label="CEP"
              placeholder="00000-000"
              [variant]="cepError() ? 'error' : 'default'"
              [hint]="cepError()"
              [(value)]="delivery.cep"
            />
          </div>
          <edq-button
            variant="secondary"
            size="sm"
            [loading]="cepLoading()"
            (clicked)="lookupCep()"
          >
            Buscar CEP
          </edq-button>
        </div>

        <div class="form-grid">
          <edq-input
            label="Endereço completo"
            placeholder="Rua, número, bairro"
            [variant]="submitted() && !delivery.address ? 'error' : 'default'"
            [hint]="submitted() && !delivery.address ? 'Campo obrigatório' : ''"
            [(value)]="delivery.address"
          />
          <edq-input
            label="Cidade"
            placeholder="São Paulo"
            [variant]="submitted() && !delivery.city ? 'error' : 'default'"
            [hint]="submitted() && !delivery.city ? 'Campo obrigatório' : ''"
            [(value)]="delivery.city"
          />
          <div class="field-group">
            <label class="field-label">Estado</label>
            <div class="unit-select-wrapper">
              <select
                class="unit-select"
                [(ngModel)]="delivery.state"
                [class.unit-select--error]="submitted() && !delivery.state"
                aria-label="Estado"
              >
                <option value="" disabled>UF</option>
                @for (uf of ufs; track uf) {
                  <option [value]="uf">{{ uf }}</option>
                }
              </select>
            </div>
            @if (submitted() && !delivery.state) {
              <span class="field-hint field-hint--error">Selecione o estado</span>
            }
          </div>
        </div>

        <div class="urgency-toggle" [class.urgency-toggle--active]="isUrgent">
          <label class="toggle-label">
            <input type="checkbox" [(ngModel)]="isUrgent" />
            <div class="toggle-track">
              <div class="toggle-thumb"></div>
            </div>
            <div class="toggle-text">
              <strong>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Pedido Urgente
              </strong>
              <span>Fornecedores serão notificados com prioridade máxima</span>
            </div>
          </label>
        </div>

        <div class="notes-field">
          <label class="field-label">Observações (opcional)</label>
          <textarea
            class="notes-textarea"
            placeholder="Informações adicionais para os fornecedores, restrições de acesso, horários de entrega..."
            [(ngModel)]="notes"
            rows="3"
          ></textarea>
        </div>
      </div>
    }

    <!-- ── Step 3 — Leilão ────────────────────────────────── -->
    @if (currentStep() === 3) {
      <div class="form-section" aria-label="Passo 3: Configuração do leilão">
        <h2 class="form-section__title">Configuração do Leilão</h2>
        <p class="form-section__desc">Defina as regras de competição entre fornecedores.</p>

        <div class="config-grid">
          <div class="field-group">
            <label class="field-label">Duração do Leilão</label>
            <p class="field-desc">Quanto tempo os fornecedores têm para enviar propostas</p>
            <div class="chip-options">
              @for (opt of durationOptions; track opt.value) {
                <button
                  type="button"
                  class="chip"
                  [class.chip--active]="auctionDuration() === opt.value"
                  (click)="auctionDuration.set(opt.value)"
                >
                  {{ opt.label }}
                </button>
              }
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">Máximo de Fornecedores</label>
            <p class="field-desc">Limite de fornecedores que podem participar</p>
            <div class="chip-options">
              @for (opt of supplierOptions; track opt.value) {
                <button
                  type="button"
                  class="chip"
                  [class.chip--active]="maxSuppliers() === opt.value"
                  (click)="maxSuppliers.set(opt.value)"
                >
                  {{ opt.label }}
                </button>
              }
            </div>
          </div>

          <edq-input
            label="Código de referência (opcional)"
            placeholder="Ex: OBRA-2025-001"
            [(value)]="referenceCode"
          />
        </div>

        <!-- Resumo -->
        <div class="summary-card">
          <div class="summary-card__title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Resumo do Pedido
          </div>
          <div class="summary-rows">
            <div class="summary-row">
              <span>Itens</span>
              <strong>{{ items().length }} item{{ items().length !== 1 ? 's' : '' }}</strong>
            </div>
            <div class="summary-row">
              <span>Entrega</span>
              <strong>{{ delivery.city || '—' }}{{ delivery.state ? ', ' + delivery.state : '' }}</strong>
            </div>
            <div class="summary-row">
              <span>Urgente</span>
              <strong [class.text-danger]="isUrgent">{{ isUrgent ? '⚡ Sim' : 'Não' }}</strong>
            </div>
            <div class="summary-row">
              <span>Duração do leilão</span>
              <strong>{{ durationLabel() }}</strong>
            </div>
            <div class="summary-row">
              <span>Fornecedores</span>
              <strong>até {{ maxSuppliers() }}</strong>
            </div>
            @if (referenceCode) {
              <div class="summary-row">
                <span>Referência</span>
                <strong>{{ referenceCode }}</strong>
              </div>
            }
          </div>
        </div>
      </div>
    }

    <!-- Navigation -->
    <div class="form-nav">
      @if (currentStep() > 1) {
        <edq-button variant="secondary" (clicked)="prevStep()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Anterior
        </edq-button>
      } @else {
        <div></div>
      }

      @if (currentStep() < 3) {
        <edq-button variant="primary" (clicked)="nextStep()">
          Próximo
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </edq-button>
      } @else {
        <edq-button variant="primary" [loading]="isSubmitting()" (clicked)="handleSubmit()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          Publicar Pedido
        </edq-button>
      }
    </div>
  `,
  styleUrl: './order-create.component.scss',
})
export class OrderCreateComponent implements OnInit {
  private readonly categoriesApi = inject(CategoriesApiService);
  private readonly ordersApi     = inject(OrdersApiService);
  private readonly toast         = inject(ToastService);
  private readonly router        = inject(Router);
  private readonly http          = inject(HttpClient);

  /* ── Step ───────────────────────────────────────────────── */
  protected readonly currentStep  = signal<Step>(1);
  protected readonly isSubmitting = signal(false);
  protected readonly submitted    = signal(false);

  protected readonly steps = [
    { id: 1, label: 'Itens' },
    { id: 2, label: 'Entrega' },
    { id: 3, label: 'Configurar' },
  ];

  /* ── Categories ─────────────────────────────────────────── */
  protected readonly categories       = signal<Category[]>([]);
  protected readonly categoriesLoading = signal(false);

  /* ── Items ──────────────────────────────────────────────── */
  protected readonly items = signal<OrderItemForm[]>([
    { description: '', quantity: '1', unit: '', categoryId: '' },
  ]);

  protected readonly unitOptions = UNIT_OPTIONS;

  /* ── Delivery ───────────────────────────────────────────── */
  protected delivery = { cep: '', address: '', city: '', state: '' };
  protected isUrgent = false;
  protected notes    = '';

  protected readonly cepLoading = signal(false);
  protected readonly cepError   = signal('');

  protected readonly ufs = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
    'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
    'SP','SE','TO',
  ];

  /* ── Auction config ─────────────────────────────────────── */
  protected readonly auctionDuration = signal(60);
  protected readonly maxSuppliers    = signal(5);
  protected referenceCode            = '';

  protected readonly durationOptions = [
    { value: 30,  label: '30 min' },
    { value: 60,  label: '1 hora' },
    { value: 120, label: '2 horas' },
    { value: 240, label: '4 horas' },
    { value: 480, label: '8 horas' },
  ];

  protected readonly supplierOptions = [
    { value: 3,  label: '3' },
    { value: 5,  label: '5' },
    { value: 10, label: '10' },
    { value: 20, label: '20' },
  ];

  protected readonly durationLabel = computed(() => {
    const opt = this.durationOptions.find(o => o.value === this.auctionDuration());
    return opt?.label ?? `${this.auctionDuration()} min`;
  });

  /* ── Lifecycle ──────────────────────────────────────────── */
  ngOnInit(): void {
    this.loadCategories();
  }

  private async loadCategories(): Promise<void> {
    this.categoriesLoading.set(true);
    try {
      const cats = await firstValueFrom(this.categoriesApi.listAll());
      this.categories.set(cats);
    } catch {
      this.toast.error('Não foi possível carregar as categorias.');
    } finally {
      this.categoriesLoading.set(false);
    }
  }

  /* ── CEP lookup ─────────────────────────────────────────── */
  async lookupCep(): Promise<void> {
    const cep = this.delivery.cep.replace(/\D/g, '');
    if (cep.length !== 8) {
      this.cepError.set('CEP inválido. Informe 8 dígitos.');
      return;
    }

    this.cepLoading.set(true);
    this.cepError.set('');

    try {
      const data = await firstValueFrom(
        this.http.get<ViaCepResponse>(`https://viacep.com.br/ws/${cep}/json/`),
      );

      if (data.erro) {
        this.cepError.set('CEP não encontrado.');
        return;
      }

      this.delivery.address = `${data.logradouro}${data.bairro ? ', ' + data.bairro : ''}`;
      this.delivery.city    = data.localidade;
      this.delivery.state   = data.uf;
    } catch {
      this.cepError.set('Erro ao buscar CEP. Tente novamente.');
    } finally {
      this.cepLoading.set(false);
    }
  }

  /* ── Items ──────────────────────────────────────────────── */
  addItem(): void {
    this.items.update(list => [
      ...list,
      { description: '', quantity: '1', unit: '', categoryId: '' },
    ]);
  }

  removeItem(index: number): void {
    this.items.update(list => list.filter((_, i) => i !== index));
  }

  isItemValid(item: OrderItemForm): boolean {
    return (
      item.description.trim().length > 0 &&
      +item.quantity > 0 &&
      item.unit.length > 0 &&
      item.categoryId.length > 0
    );
  }

  /* ── Navigation ─────────────────────────────────────────── */
  nextStep(): void {
    this.submitted.set(true);

    if (this.currentStep() === 1) {
      const allValid = this.items().every(item => this.isItemValid(item));
      if (!allValid) {
        this.toast.error('Preencha todos os campos dos itens antes de continuar.');
        return;
      }
    }

    if (this.currentStep() === 2) {
      if (!this.delivery.address || !this.delivery.city || !this.delivery.state) {
        this.toast.error('Preencha o endereço completo antes de continuar.');
        return;
      }
    }

    this.submitted.set(false);
    if (this.currentStep() < 3) this.currentStep.update(s => (s + 1) as Step);
  }

  prevStep(): void {
    this.submitted.set(false);
    if (this.currentStep() > 1) this.currentStep.update(s => (s - 1) as Step);
  }

  /* ── Submit ─────────────────────────────────────────────── */
  async handleSubmit(): Promise<void> {
    this.submitted.set(true);
    this.isSubmitting.set(true);

    const payload: CreateOrderPayload = {
      deliveryAddress:   this.delivery.address,
      deliveryCity:      this.delivery.city,
      deliveryState:     this.delivery.state,
      isUrgent:          this.isUrgent,
      auctionDurationMin: this.auctionDuration(),
      maxSuppliers:      this.maxSuppliers(),
      referenceCode:     this.referenceCode || undefined,
      notes:             this.notes || undefined,
      items: this.items().map((item, i) => ({
        categoryId:  item.categoryId,
        description: item.description,
        quantity:    +item.quantity,
        unit:        item.unit,
        sortOrder:   i + 1,
      })),
    };

    const loadingId = this.toast.loading('Publicando pedido...');

    try {
      const order = await firstValueFrom(this.ordersApi.create(payload));
      this.toast.dismiss(loadingId);
      this.toast.success('Pedido publicado!', { message: 'Fornecedores já foram notificados.' });
      await this.router.navigate(['/app/orders', order.id]);
    } catch (err: any) {
      this.toast.dismiss(loadingId);
      this.toast.error(
        err?.message ?? 'Erro ao publicar o pedido.',
        { message: 'Verifique os dados e tente novamente.' },
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
