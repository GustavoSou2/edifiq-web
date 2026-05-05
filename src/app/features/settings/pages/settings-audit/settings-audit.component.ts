import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { InputComponent } from '../../../../shared/components/input/input.component';

interface AuditEntry {
  id:        string;
  datetime:  string;
  user:      string;
  action:    string;
  entity:    string;
  ip:        string;
}

const MOCK_AUDIT: AuditEntry[] = [
  { id: 'a1', datetime: '2024-01-15T10:05:00Z', user: 'João Melo',      action: 'order.created',    entity: 'Order #EDQ-2024-0042', ip: '192.168.1.10' },
  { id: 'a2', datetime: '2024-01-15T09:55:00Z', user: 'Ana Souza',      action: 'proposal.accepted', entity: 'Proposal #P-0038',     ip: '192.168.1.11' },
  { id: 'a3', datetime: '2024-01-14T16:30:00Z', user: 'Carlos Lima',    action: 'user.invited',      entity: 'User fernanda@...',    ip: '10.0.0.5' },
  { id: 'a4', datetime: '2024-01-14T14:00:00Z', user: 'João Melo',      action: 'settings.updated',  entity: 'Company Settings',     ip: '192.168.1.10' },
  { id: 'a5', datetime: '2024-01-13T11:20:00Z', user: 'Ricardo Alves',  action: 'order.cancelled',   entity: 'Order #EDQ-2024-0039', ip: '172.16.0.3' },
  { id: 'a6', datetime: '2024-01-13T09:00:00Z', user: 'Ana Souza',      action: 'supplier.blocked',  entity: 'Supplier #S-004',      ip: '192.168.1.11' },
  { id: 'a7', datetime: '2024-01-12T17:45:00Z', user: 'João Melo',      action: 'webhook.created',   entity: 'Webhook #WH-002',      ip: '192.168.1.10' },
  { id: 'a8', datetime: '2024-01-12T08:30:00Z', user: 'Carlos Lima',    action: 'order.created',     entity: 'Order #EDQ-2024-0038', ip: '10.0.0.5' },
];

@Component({
  selector: 'edq-settings-audit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, PageHeaderComponent, InputComponent],
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
          <h2 class="settings-section__title">Log de Auditoria</h2>

          <!-- Filters -->
          <div class="audit-filters">
            <edq-input type="search" placeholder="Filtrar por usuário..." size="sm" [(value)]="filterUser">
              <span slot="prefix">👤</span>
            </edq-input>
            <edq-input type="search" placeholder="Filtrar por ação..." size="sm" [(value)]="filterAction">
              <span slot="prefix">⚡</span>
            </edq-input>
            <edq-input type="search" placeholder="Filtrar por entidade..." size="sm" [(value)]="filterEntity">
              <span slot="prefix">📋</span>
            </edq-input>
          </div>

          <!-- Table -->
          <div class="table-wrapper">
            <table class="data-table" aria-label="Log de auditoria">
              <thead>
                <tr>
                  <th scope="col">Data/Hora</th>
                  <th scope="col">Usuário</th>
                  <th scope="col">Ação</th>
                  <th scope="col">Entidade</th>
                  <th scope="col">IP</th>
                </tr>
              </thead>
              <tbody>
                @for (entry of filteredEntries(); track entry.id) {
                  <tr class="table-row">
                    <td class="date-cell">{{ formatDate(entry.datetime) }}</td>
                    <td class="user-cell">{{ entry.user }}</td>
                    <td><span class="action-chip">{{ entry.action }}</span></td>
                    <td class="entity-cell">{{ entry.entity }}</td>
                    <td class="ip-cell">{{ entry.ip }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5">
                      <div class="table-empty">
                        <span>🔍</span>
                        <p>Nenhum registro encontrado.</p>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  `,
  styleUrl: './settings-audit.component.scss',
})
export class SettingsAuditComponent {
  protected readonly filterUser   = signal('');
  protected readonly filterAction = signal('');
  protected readonly filterEntity = signal('');

  protected readonly filteredEntries = computed(() => {
    let list = MOCK_AUDIT;
    const u = this.filterUser();
    const a = this.filterAction();
    const e = this.filterEntity();
    if (u) list = list.filter(entry => entry.user.toLowerCase().includes(u.toLowerCase()));
    if (a) list = list.filter(entry => entry.action.toLowerCase().includes(a.toLowerCase()));
    if (e) list = list.filter(entry => entry.entity.toLowerCase().includes(e.toLowerCase()));
    return list;
  });

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}
