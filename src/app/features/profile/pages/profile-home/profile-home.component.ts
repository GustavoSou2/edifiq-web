import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';

@Component({
  selector: 'edq-profile-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, ButtonComponent, InputComponent],
  template: `
    <edq-page-header title="Meu Perfil" subtitle="Gerencie suas informações pessoais" />

    <!-- Avatar -->
    <div class="avatar-section">
      <div class="avatar-circle" aria-label="Avatar de João Melo">JM</div>
      <div class="avatar-info">
        <span class="avatar-name">João Melo</span>
        <span class="avatar-role">Admin</span>
        <edq-button variant="ghost" size="sm">Alterar foto</edq-button>
      </div>
    </div>

    <!-- Informações Pessoais -->
    <section class="profile-section">
      <h2 class="profile-section__title">Informações Pessoais</h2>
      <div class="form-grid">
        <edq-input label="Nome" [(value)]="name" placeholder="Seu nome completo" />
        <edq-input label="Email" [(value)]="email" [readonly]="true" />
        <edq-input label="Telefone" [(value)]="phone" placeholder="(11) 99999-9999" type="tel" />
      </div>
      <div class="form-actions">
        <edq-button variant="primary" [loading]="savingInfo()" (clicked)="saveInfo()">Salvar</edq-button>
      </div>
    </section>

    <!-- Alterar Senha -->
    <section class="profile-section">
      <h2 class="profile-section__title">Alterar Senha</h2>
      <div class="form-grid">
        <edq-input label="Senha atual"        [(value)]="currentPassword" type="password" placeholder="••••••••" />
        <edq-input label="Nova senha"         [(value)]="newPassword"     type="password" placeholder="••••••••" />
        <edq-input label="Confirmar nova senha" [(value)]="confirmPassword" type="password" placeholder="••••••••" />
      </div>
      <div class="form-actions">
        <edq-button variant="primary" [loading]="savingPassword()" (clicked)="savePassword()">Alterar Senha</edq-button>
      </div>
    </section>

    <!-- Last Login -->
    <div class="last-login">
      <span class="last-login__icon">🕐</span>
      <span class="last-login__text">Último acesso: <strong>15/01/2024 às 10:00</strong> — IP 192.168.1.10</span>
    </div>
  `,
  styleUrl: './profile-home.component.scss',
})
export class ProfileHomeComponent {
  protected name            = 'João Melo';
  protected email           = 'joao.melo@empresa.com';
  protected phone           = '(11) 98765-4321';
  protected currentPassword = '';
  protected newPassword     = '';
  protected confirmPassword = '';

  protected readonly savingInfo     = signal(false);
  protected readonly savingPassword = signal(false);

  protected saveInfo(): void {
    this.savingInfo.set(true);
    setTimeout(() => this.savingInfo.set(false), 1500);
  }

  protected savePassword(): void {
    this.savingPassword.set(true);
    setTimeout(() => this.savingPassword.set(false), 1500);
  }
}
