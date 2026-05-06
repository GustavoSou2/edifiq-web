import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { Webhook } from '../../../../shared/types/domain.types';

const WEBHOOK_EVENTS = [
  { key: 'order.created',        label: 'Pedido criado' },
  { key: 'proposal.submitted',   label: 'Proposta enviada' },
  { key: 'delivery.confirmed',   label: 'Entrega confirmada' },
  { key: 'order.cancelled',      label: 'Pedido cancelado' },
];

const MOCK_WEBHOOKS: Partial<Webhook>[] = [
  {
    id: 'wh1',
    url: 'https://minha-api.com/webhooks/edifiq',
    events: ['order.created', 'delivery.confirmed'],
    isActive:  true,
    createdAt: '2024-01-10T00:00:00Z',
  },
  {
    id: 'wh2',
    url: 'https://erp.empresa.com/hooks/orders',
    events: ['order.created', 'order.cancelled'],
    isActive:  false,
    createdAt: '2024-01-05T00:00:00Z',
  },
];

@Component({
  selector: 'edq-settings-webhooks',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, FormsModule, PageHeaderComponent, ButtonComponent, InputComponent],
  template: `
    <edq-page-header title="Configurações" subtitle="Gerencie as configurações da sua conta" />

    <div class="settings-layout">
      <!-- Sidebar Nav -->
      <nav class="settings-nav" aria-label="Navegação de configurações">
        <a class="settings-nav__link" routerLink="../company"  routerLinkActive="settings-nav__link--active">Empresa</a>
        <a class="settings-nav__link" routerLink="../plan"     routerLinkActive="settings-nav__link--active">Plano & Assinatura</a>
        <a class="settings-nav__link" routerLink="../webhooks" routerLinkActive="settings-nav__link--active">Webhooks</a>
        <a class="settings-nav__link" routerLink="../audit"    routerLinkActive="settings-nav__link--active">Auditoria</a>
      </nav>

      <!-- Content -->
      <div class="settings-content">
        <section class="settings-section">
          <div class="section-header">
            <h2 class="settings-section__title">Webhooks Configurados</h2>
            <edq-button variant="primary" size="sm" (clicked)="showForm.set(!showForm())">
              {{ showForm() ? '✕ Cancelar' : '+ Adicionar Webhook' }}
            </edq-button>
          </div>

          <!-- Add form -->
          @if (showForm()) {
            <div class="webhook-form">
              <edq-input label="URL do Webhook" [(value)]="newUrl" placeholder="https://sua-api.com/webhook" />
              <div class="events-group">
                <p class="events-label">Eventos</p>
                <div class="events-list">
                  @for (evt of webhookEvents; track evt.key) {
                    <label class="event-checkbox">
                      <input
                        type="checkbox"
                        [checked]="newEvents.includes(evt.key)"
                        (change)="toggleEvent(evt.key)"
                      />
                      <span>{{ evt.label }}</span>
                    </label>
                  }
                </div>
              </div>
              <edq-button variant="primary" size="sm" (clicked)="addWebhook()">Salvar Webhook</edq-button>
            </div>
          }

          <!-- Webhook list -->
          <div class="webhook-list">
            @for (wh of webhooks(); track wh.id) {
              <div class="webhook-item">
                <div class="webhook-item__info">
                  <span class="webhook-url">{{ wh.url }}</span>
                  <div class="webhook-events">
                    @for (evt of wh.events; track evt) {
                      <span class="event-chip">{{ evt }}</span>
                    }
                  </div>
                </div>
                <div class="webhook-item__actions">
                  <button
                    class="status-toggle"
                    [class.status-toggle--active]="wh.isActive"
                    (click)="toggleWebhook(wh)"
                    [attr.aria-label]="wh.isActive ? 'Desativar webhook' : 'Ativar webhook'"
                  >
                    <span class="status-toggle__dot"></span>
                    {{ wh.isActive ? 'Ativo' : 'Inativo' }}
                  </button>
                  <edq-button variant="ghost" size="sm" (clicked)="removeWebhook(wh)">Remover</edq-button>
                </div>
              </div>
            } @empty {
              <p class="empty-msg">Nenhum webhook configurado.</p>
            }
          </div>
        </section>
      </div>
    </div>
  `,
  styleUrl: './settings-webhooks.component.scss',
})
export class SettingsWebhooksComponent {
  protected readonly webhooks      = signal<Partial<Webhook>[]>(MOCK_WEBHOOKS);
  protected readonly showForm      = signal(false);
  protected readonly webhookEvents = WEBHOOK_EVENTS;

  protected newUrl    = '';
  protected newEvents: string[] = [];

  protected toggleEvent(key: string): void {
    if (this.newEvents.includes(key)) {
      this.newEvents = this.newEvents.filter(e => e !== key);
    } else {
      this.newEvents = [...this.newEvents, key];
    }
  }

  protected addWebhook(): void {
    if (!this.newUrl) return;
    this.webhooks.update(list => [
      ...list,
      {
        id:        `wh${Date.now()}`,
        url:       this.newUrl,
        events:    [...this.newEvents],
        isActive:  true,
        createdAt: new Date().toISOString(),
      },
    ]);
    this.newUrl    = '';
    this.newEvents = [];
    this.showForm.set(false);
  }

  protected toggleWebhook(wh: Partial<Webhook>): void {
    this.webhooks.update(list =>
      list.map(w => w.id === wh.id ? { ...w, isActive: !w.isActive } : w),
    );
  }

  protected removeWebhook(wh: Partial<Webhook>): void {
    this.webhooks.update(list => list.filter(w => w.id !== wh.id));
  }
}
