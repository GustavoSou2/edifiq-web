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

@Component({
  selector: 'edq-settings-company',
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
          <h2 class="settings-section__title">Dados da Empresa</h2>

          <div class="form-grid">
            <edq-input label="Nome da Empresa" [(value)]="companyName" placeholder="Ex: Construtora ABC Ltda" />
            <edq-input label="CNPJ" [(value)]="cnpj" placeholder="00.000.000/0001-00" />
            <div class="form-field">
              <label class="form-label">Status</label>
              <select class="form-select" [(ngModel)]="status" aria-label="Status da empresa">
                <option value="active">Ativo</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspenso</option>
              </select>
            </div>
            <div class="form-field">
              <label class="form-label">Fuso Horário</label>
              <select class="form-select" [(ngModel)]="timezone" aria-label="Fuso horário">
                <option value="America/Sao_Paulo">America/São_Paulo (UTC-3)</option>
                <option value="America/Manaus">America/Manaus (UTC-4)</option>
                <option value="America/Belem">America/Belém (UTC-3)</option>
              </select>
            </div>
          </div>

          <div class="form-actions">
            <edq-button variant="primary" [loading]="saving()" (clicked)="save()">
              Salvar Alterações
            </edq-button>
          </div>
        </section>

        <!-- Danger Zone -->
        <section class="settings-section settings-section--danger">
          <h2 class="settings-section__title settings-section__title--danger">Zona de Perigo</h2>
          <p class="danger-desc">Ao cancelar a assinatura, sua conta será suspensa ao final do período vigente.</p>
          <edq-button variant="danger" size="sm">Cancelar Assinatura</edq-button>
        </section>
      </div>
    </div>
  `,
  styleUrl: './settings-company.component.scss',
})
export class SettingsCompanyComponent {
  protected companyName = 'Construtora Exemplo Ltda';
  protected cnpj        = '12.345.678/0001-90';
  protected status      = 'active';
  protected timezone    = 'America/Sao_Paulo';
  protected readonly saving = signal(false);

  protected save(): void {
    this.saving.set(true);
    setTimeout(() => this.saving.set(false), 1500);
  }
}
