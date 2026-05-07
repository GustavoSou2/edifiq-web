import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import { PageHeaderComponent }  from '../../../../shared/components/page-header/page-header.component';
import { ButtonComponent }      from '../../../../shared/components/button/button.component';
import { InputComponent }       from '../../../../shared/components/input/input.component';
import { ToastService }         from '../../../../shared/services/toast.service';
import { OrdersApiService, CreateOrderPayload } from '../../../../core/services/api/orders-api.service';

type Step = 1 | 2 | 3;

interface OrderItemForm {
  name:     string;
  quantity: string;
  unit:     string;
  notes:    string;
}

const UNIT_OPTIONS = ['un', 'kg', 'g', 't', 'm', 'm²', 'm³', 'L', 'saco', 'cx', 'rolo', 'par', 'pç'];

@Component({
  selector: 'edq-order-create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, DatePipe, PageHeaderComponent, ButtonComponent, InputComponent],
  template: `
    <edq-page-header title="Novo Pedido" subtitle="Preencha os dados para criar o pedido">
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
                <edq-input
                  label="Nome do material"
                  placeholder="Ex: Cimento CP-II 50kg"
                  [variant]="submitted() && !item.name ? 'error' : 'default'"
                  [hint]="submitted() && !item.name ? 'Campo obrigatório' : ''"
                  [(value)]="item.name"
                />

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

                  <edq-input
                    label="Observações (opcional)"
                    placeholder="Marca, especificação..."
                    [(value)]="item.notes"
                  />
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

    <!-- ── Step 2 — Detalhes ──────────────────────────────── -->
    @if (currentStep() === 2) {
      <div class="form-section" aria-label="Passo 2: Detalhes do pedido">
        <h2 class="form-section__title">Detalhes do Pedido</h2>
        <p class="form-section__desc">Informações gerais sobre o pedido.</p>

        <div class="details-grid">
          <edq-input
            label="Título do pedido"
            placeholder="Ex: Materiais para obra Fase 2"
            [variant]="submitted() && !title ? 'error' : 'default'"
            [hint]="submitted() && !title ? 'Campo obrigatório' : ''"
            [(value)]="title"
          />

          <div class="notes-field">
            <label class="field-label">Descrição (opcional)</label>
            <textarea
              class="notes-textarea"
              placeholder="Informações adicionais sobre o pedido, contexto da obra..."
              [(ngModel)]="description"
              rows="3"
            ></textarea>
          </div>

          <div class="field-group">
            <label class="field-label">Data de agendamento (opcional)</label>
            <p class="field-desc">Quando os materiais precisam ser entregues</p>
            <input
              type="datetime-local"
              class="unit-select"
              [(ngModel)]="scheduledAt"
              aria-label="Data de agendamento"
            />
          </div>
        </div>
      </div>
    }

    <!-- ── Step 3 — Agendamento ──────────────────────────── -->
    @if (currentStep() === 3) {
      <div class="form-section" aria-label="Passo 3: Agendamento e configurações">
        <h2 class="form-section__title">Agendamento e Configurações</h2>
        <p class="form-section__desc">Defina quando e como os fornecedores devem responder.</p>

        <div class="config-grid">

          <!-- Janela de entrega -->
          <div class="config-block">
            <h3 class="config-block__title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Janela de Entrega
            </h3>
            <p class="config-block__desc">Período em que os materiais devem ser entregues</p>

            <div class="window-row">
              <div class="field-group">
                <label class="field-label">
                  Data/hora mínima
                  <span class="required-mark">*</span>
                </label>
                <input
                  type="datetime-local"
                  class="unit-select"
                  [(ngModel)]="deliveryWindowStart"
                  [class.unit-select--error]="submitted() && !deliveryWindowStart"
                  aria-label="Data/hora mínima de entrega"
                />
                @if (submitted() && !deliveryWindowStart) {
                  <span class="field-hint field-hint--error">Campo obrigatório</span>
                }
              </div>

              <div class="window-separator">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </div>

              <div class="field-group">
                <label class="field-label">Data/hora máxima <span class="optional-mark">(opcional)</span></label>
                <input
                  type="datetime-local"
                  class="unit-select"
                  [(ngModel)]="deliveryWindowEnd"
                  aria-label="Data/hora máxima de entrega"
                />
                <span class="field-hint">Define o range de entrega quando informado</span>
              </div>
            </div>
          </div>

          <!-- Urgência -->
          <div class="urgency-toggle" [class.urgency-toggle--active]="isUrgent">
            <label class="toggle-label">
              <input type="checkbox" [(ngModel)]="isUrgent" />
              <div class="toggle-track"><div class="toggle-thumb"></div></div>
              <div class="toggle-text">
                <strong>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  Pedido Urgente
                </strong>
                <span>Fornecedores serão notificados com prioridade máxima</span>
              </div>
            </label>
          </div>

          <!-- Tempo de resposta -->
          <div class="config-block">
            <h3 class="config-block__title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Tempo de Resposta
            </h3>
            <p class="config-block__desc">Quanto tempo os fornecedores têm para enviar propostas</p>
            <div class="chip-options">
              @for (opt of durationOptions; track opt.value) {
                <button
                  type="button"
                  class="chip"
                  [class.chip--active]="auctionDurationMin() === opt.value"
                  (click)="auctionDurationMin.set(opt.value)"
                >
                  {{ opt.label }}
                </button>
              }
            </div>
          </div>

          <!-- Máximo de fornecedores -->
          <div class="config-block">
            <h3 class="config-block__title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
              Máximo de Fornecedores
            </h3>
            <p class="config-block__desc">Limite de fornecedores que serão notificados</p>
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

          <!-- Campos opcionais -->
          <div class="optional-fields">
            <edq-input
              label="Código de referência (opcional)"
              placeholder="Ex: OBRA-2025-001"
              [(value)]="referenceCode"
            />

            <div class="notes-field">
              <label class="field-label">Observações gerais (opcional)</label>
              <textarea
                class="notes-textarea"
                placeholder="Informações adicionais para os fornecedores..."
                [(ngModel)]="notes"
                rows="3"
              ></textarea>
            </div>
          </div>

          <!-- Resumo -->
          <div class="summary-card">
            <div class="summary-card__title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Resumo do Pedido
            </div>
            <div class="summary-rows">
              <div class="summary-row">
                <span>Título</span>
                <strong>{{ title }}</strong>
              </div>
              <div class="summary-row">
                <span>Itens</span>
                <strong>{{ items().length }} item{{ items().length !== 1 ? 's' : '' }}</strong>
              </div>
              <div class="summary-row">
                <span>Entrega a partir de</span>
                <strong>{{ deliveryWindowStart ? (deliveryWindowStart | date:'dd/MM/yyyy HH:mm') : '—' }}</strong>
              </div>
              @if (deliveryWindowEnd) {
                <div class="summary-row">
                  <span>Entrega até</span>
                  <strong>{{ deliveryWindowEnd | date:'dd/MM/yyyy HH:mm' }}</strong>
                </div>
              }
              <div class="summary-row">
                <span>Urgente</span>
                <strong [class.text-danger]="isUrgent">{{ isUrgent ? '⚡ Sim' : 'Não' }}</strong>
              </div>
              <div class="summary-row">
                <span>Tempo de resposta</span>
                <strong>{{ durationLabel() }}</strong>
              </div>
              <div class="summary-row">
                <span>Fornecedores</span>
                <strong>até {{ maxSuppliers() }}</strong>
              </div>
            </div>
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
          Criar Pedido
        </edq-button>
      }
    </div>
  `,
  styleUrl: './order-create.component.scss',
})
export class OrderCreateComponent {
  private readonly ordersApi = inject(OrdersApiService);
  private readonly toast     = inject(ToastService);
  private readonly router    = inject(Router);

  /* ── Step ───────────────────────────────────────────────── */
  protected readonly currentStep  = signal<Step>(1);
  protected readonly isSubmitting = signal(false);
  protected readonly submitted    = signal(false);

  protected readonly steps = [
    { id: 1, label: 'Itens' },
    { id: 2, label: 'Entrega' },
    { id: 3, label: 'Agendamento' },
  ];

  /* ── Items ──────────────────────────────────────────────── */
  protected readonly items = signal<OrderItemForm[]>([
    { name: '', quantity: '1', unit: '', notes: '' },
  ]);

  protected readonly unitOptions = UNIT_OPTIONS;

  /* ── Order details ──────────────────────────────────────── */
  protected title       = '';
  protected description = '';
  protected scheduledAt = '';

  /* ── Scheduling & auction config ────────────────────────── */
  protected deliveryWindowStart = '';
  protected deliveryWindowEnd   = '';
  protected isUrgent            = false;
  protected readonly auctionDurationMin = signal(60);
  protected readonly maxSuppliers       = signal(10);
  protected referenceCode = '';
  protected notes         = '';

  protected readonly durationOptions = [
    { value: 30,  label: '30 min' },
    { value: 60,  label: '1 hora' },
    { value: 120, label: '2 horas' },
    { value: 240, label: '4 horas' },
    { value: 480, label: '8 horas' },
  ];

  protected readonly supplierOptions = [
    { value: 5,  label: '5' },
    { value: 10, label: '10' },
    { value: 20, label: '20' },
    { value: 50, label: '50' },
  ];

  protected readonly durationLabel = computed(() => {
    const opt = this.durationOptions.find(o => o.value === this.auctionDurationMin());
    return opt?.label ?? `${this.auctionDurationMin()} min`;
  });

  /* ── Validation ─────────────────────────────────────────── */
  isItemValid(item: OrderItemForm): boolean {
    return item.name.trim().length > 0 && +item.quantity > 0 && item.unit.length > 0;
  }

  /* ── Items ──────────────────────────────────────────────── */
  addItem(): void {
    this.items.update(list => [...list, { name: '', quantity: '1', unit: '', notes: '' }]);
  }

  removeItem(index: number): void {
    this.items.update(list => list.filter((_, i) => i !== index));
  }

  /* ── Navigation ─────────────────────────────────────────── */
  nextStep(): void {
    this.submitted.set(true);

    if (this.currentStep() === 1) {
      if (!this.items().every(item => this.isItemValid(item))) {
        this.toast.error('Preencha todos os campos dos itens antes de continuar.');
        return;
      }
    }

    if (this.currentStep() === 2) {
      if (!this.title.trim()) {
        this.toast.error('Informe o título do pedido.');
        return;
      }
    }

    if (this.currentStep() === 3) {
      if (!this.deliveryWindowStart) {
        this.toast.error('Informe a data/hora mínima de entrega.');
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
    this.isSubmitting.set(true);

    const payload: CreateOrderPayload = {
      title:                this.title.trim(),
      description:          this.description.trim() || null,
      deliveryWindowStart:  new Date(this.deliveryWindowStart).toISOString(),
      deliveryWindowEnd:    this.deliveryWindowEnd ? new Date(this.deliveryWindowEnd).toISOString() : null,
      isUrgent:             this.isUrgent,
      auctionDurationMin:   this.auctionDurationMin(),
      maxSuppliers:         this.maxSuppliers(),
      referenceCode:        this.referenceCode.trim() || null,
      notes:                this.notes.trim() || null,
      items: this.items().map((item, i) => ({
        description: item.name.trim(),
        unit:        item.unit || null,
        quantity:    +item.quantity,
        notes:       item.notes.trim() || null,
        sortOrder:   i,
      })),
    };

    const loadingId = this.toast.loading('Criando pedido...');

    try {
      const order = await firstValueFrom(this.ordersApi.create(payload));
      this.toast.dismiss(loadingId);
      this.toast.success('Pedido criado!', { message: 'Publique para notificar os fornecedores.' });
      await this.router.navigate(['/app/orders', order.id]);
    } catch (err: any) {
      this.toast.dismiss(loadingId);
      this.toast.error(
        err?.message ?? 'Erro ao criar o pedido.',
        { message: 'Verifique os dados e tente novamente.' },
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
