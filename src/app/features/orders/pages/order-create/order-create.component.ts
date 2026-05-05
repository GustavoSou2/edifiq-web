import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { CommonModule } from '@angular/common';

type Step = 1 | 2 | 3;

interface OrderItem {
  description: string;
  quantity:    string;   // string para binding com InputComponent
  unit:        string;
  category:    string;
}

@Component({
  selector: 'edq-order-create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, PageHeaderComponent, ButtonComponent, InputComponent, CommonModule],
  template: `
    <edq-page-header title="Novo Pedido" subtitle="Preencha os dados para iniciar o leilão">
      <edq-button slot="actions" variant="secondary" size="sm" routerLink="../">Cancelar</edq-button>
    </edq-page-header>

    <!-- Step indicator -->
    <div class="step-indicator" aria-label="Progresso do formulário">
      @for (s of steps; track s.id) {
        <div class="step" [class.step--active]="currentStep() === s.id" [class.step--done]="currentStep() > s.id">
          <div class="step__circle" [attr.aria-current]="currentStep() === s.id ? 'step' : null">
            @if (currentStep() > s.id) { ✓ } @else { {{ s.id }} }
          </div>
          <span class="step__label">{{ s.label }}</span>
        </div>
        @if (s.id < 3) {
          <div class="step__line" [class.step__line--done]="currentStep() > s.id"></div>
        }
      }
    </div>

    <!-- Step 1 — Itens -->
    @if (currentStep() === 1) {
      <div class="form-section" aria-label="Passo 1: Itens do pedido">
        <h2 class="form-section__title">Itens do Pedido</h2>
        <p class="form-section__desc">Adicione os materiais que você precisa.</p>

        <div class="items-list">
          @for (item of items(); track $index; let i = $index) {
            <div class="item-row">
              <span class="item-row__num">{{ i + 1 }}</span>
              <div class="item-row__fields">
                <edq-input
                  label="Descrição"
                  placeholder="Ex: Saco de Cimento CP-II 50kg"
                  [(value)]="item.description"
                />
                <div class="item-row__inline">
                  <edq-input label="Qtd" type="number" placeholder="0" [(value)]="item.quantity" />
                  <edq-input label="Unidade" placeholder="saco, m³, un..." [(value)]="item.unit" />
                  <edq-input label="Categoria" placeholder="Cimento, Areia..." [(value)]="item.category" />
                </div>
              </div>
              @if (items().length > 1) {
                <button class="remove-btn" type="button" (click)="removeItem(i)" aria-label="Remover item">✕</button>
              }
            </div>
          }
        </div>

        <edq-button variant="ghost" size="sm" (clicked)="addItem()">
          + Adicionar item
        </edq-button>
      </div>
    }

    <!-- Step 2 — Entrega -->
    @if (currentStep() === 2) {
      <div class="form-section" aria-label="Passo 2: Endereço de entrega">
        <h2 class="form-section__title">Endereço de Entrega</h2>

        <div class="form-grid">
          <edq-input label="CEP" placeholder="00000-000" [(value)]="delivery.cep" />
          <edq-input label="Cidade" placeholder="São Paulo" [(value)]="delivery.city" />
          <edq-input label="Estado" placeholder="SP" [(value)]="delivery.state" />
          <edq-input label="Endereço completo" placeholder="Rua, número, bairro" [(value)]="delivery.address" />
        </div>

        <div class="urgency-toggle">
          <label class="toggle-label">
            <input type="checkbox" [(ngModel)]="isUrgent" />
            <span class="toggle-box"></span>
            <div class="toggle-text">
              <strong>Pedido Urgente</strong>
              <span>Fornecedores serão notificados com prioridade máxima</span>
            </div>
          </label>
        </div>
      </div>
    }

    <!-- Step 3 — Configuração do leilão -->
    @if (currentStep() === 3) {
      <div class="form-section" aria-label="Passo 3: Configuração do leilão">
        <h2 class="form-section__title">Configuração do Leilão</h2>

        <div class="form-grid">
          <div class="field-group">
            <label class="field-label">Duração do Leilão</label>
            <div class="duration-options">
              @for (opt of durationOptions; track opt.value) {
                <button
                  type="button"
                  class="duration-btn"
                  [class.duration-btn--active]="auctionDuration() === opt.value"
                  (click)="auctionDuration.set(opt.value)"
                >
                  {{ opt.label }}
                </button>
              }
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">Máximo de Fornecedores</label>
            <div class="duration-options">
              @for (opt of supplierOptions; track opt.value) {
                <button
                  type="button"
                  class="duration-btn"
                  [class.duration-btn--active]="maxSuppliers() === opt.value"
                  (click)="maxSuppliers.set(opt.value)"
                >
                  {{ opt.label }}
                </button>
              }
            </div>
          </div>

          <edq-input
            label="Código de referência (opcional)"
            placeholder="Ex: OBRA-2024-001"
            [(value)]="referenceCode"
          />
        </div>

        <!-- Resumo -->
        <div class="summary-card">
          <h3 class="summary-card__title">Resumo do Pedido</h3>
          <div class="summary-rows">
            <div class="summary-row">
              <span>Itens</span>
              <strong>{{ items().length }} item(s)</strong>
            </div>
            <div class="summary-row">
              <span>Entrega</span>
              <strong>{{ delivery.city || '—' }}, {{ delivery.state || '—' }}</strong>
            </div>
            <div class="summary-row">
              <span>Urgente</span>
              <strong>{{ isUrgent ? 'Sim' : 'Não' }}</strong>
            </div>
            <div class="summary-row">
              <span>Duração do leilão</span>
              <strong>{{ auctionDuration() }} minutos</strong>
            </div>
            <div class="summary-row">
              <span>Fornecedores</span>
              <strong>até {{ maxSuppliers() }}</strong>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Navigation -->
    <div class="form-nav">
      @if (currentStep() > 1) {
        <edq-button variant="secondary" (clicked)="prevStep()">← Anterior</edq-button>
      } @else {
        <div></div>
      }

      @if (currentStep() < 3) {
        <edq-button variant="primary" (clicked)="nextStep()">Próximo →</edq-button>
      } @else {
        <edq-button variant="primary" [loading]="isSubmitting()" (clicked)="handleSubmit()">
          🚀 Publicar Pedido
        </edq-button>
      }
    </div>
  `,
  styleUrl: './order-create.component.scss',
})
export class OrderCreateComponent {
  protected readonly currentStep  = signal<Step>(1);
  protected readonly isSubmitting = signal(false);

  protected readonly steps = [
    { id: 1, label: 'Itens' },
    { id: 2, label: 'Entrega' },
    { id: 3, label: 'Configurar' },
  ];

  protected readonly items = signal<OrderItem[]>([
    { description: '', quantity: '1', unit: '', category: '' },
  ]);

  protected delivery = { cep: '', city: '', state: '', address: '' };
  protected isUrgent = false;
  protected referenceCode = '';

  protected readonly auctionDuration = signal(60);
  protected readonly maxSuppliers    = signal(5);

  protected readonly durationOptions = [
    { value: 30,  label: '30 min' },
    { value: 60,  label: '1 hora' },
    { value: 120, label: '2 horas' },
    { value: 240, label: '4 horas' },
  ];

  protected readonly supplierOptions = [
    { value: 3,  label: '3' },
    { value: 5,  label: '5' },
    { value: 10, label: '10' },
    { value: 20, label: '20' },
  ];

  addItem(): void {
    this.items.update(list => [...list, { description: '', quantity: '1', unit: '', category: '' }]);
  }

  removeItem(index: number): void {
    this.items.update(list => list.filter((_, i) => i !== index));
  }

  nextStep(): void {
    if (this.currentStep() < 3) this.currentStep.update(s => (s + 1) as Step);
  }

  prevStep(): void {
    if (this.currentStep() > 1) this.currentStep.update(s => (s - 1) as Step);
  }

  async handleSubmit(): Promise<void> {
    this.isSubmitting.set(true);
    await new Promise(r => setTimeout(r, 1500));
    this.isSubmitting.set(false);
    // TODO: navegar para o pedido criado
  }
}
