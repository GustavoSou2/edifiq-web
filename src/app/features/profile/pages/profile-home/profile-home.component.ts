import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { UsersApiService } from 'src/app/core/services/api';
import { AuthService } from 'src/app/features/auth/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, map } from 'rxjs';

@Component({
  selector: 'edq-profile-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, ButtonComponent, InputComponent, CommonModule, ReactiveFormsModule],
  template: `
    <edq-page-header title="Meu Perfil" subtitle="Gerencie suas informações pessoais" />

    <!-- Avatar -->
    <div class="avatar-section">
      <div class="avatar-circle" aria-label="Avatar de João Melo">JM</div>
      <div class="avatar-info">
        <span class="avatar-name">{{ name() }}</span>
        <span class="avatar-role">
        
       
                      </span>
                       @for (role of userRoles(); track role) {
          <span class="role-chip">{{ role?.name }}</span>
        }
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
  private readonly userService = inject(UsersApiService);
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder)

  protected readonly savingInfo     = signal(false);
  protected readonly savingPassword = signal(false);
  
  protected readonly userId = computed(() => this.authService.user()!.id)

  profileData = toSignal(
    forkJoin([
      this.userService.findById(this.userId()),
      this.userService.listUserRolesByUserId(this.userId())
    ])
  );

  name            = signal('');
  email           = signal('');
  phone           = signal('');
  userRoles       = signal<any[]>([]);
  protected currentPassword = '';
  protected newPassword     = '';
  protected confirmPassword = '';

constructor() {
  effect(() => {
    const profile = this.profileData();

    if (!profile) return;
    
    const [user, userRoles] = profile;

  if (user) {
        this.name.set(user.fullName);
        this.email.set(user.email);
        this.phone.set(user.phone ?? '');
      }

    console.log(userRoles)

    if(userRoles) this.userRoles.set(userRoles ?? []);
   
  });
}

  protected saveInfo(): void {
    this.savingInfo.set(true);
    setTimeout(() => this.savingInfo.set(false), 1500);
  }

  protected savePassword(): void {
    this.savingPassword.set(true);
    setTimeout(() => this.savingPassword.set(false), 1500);
  }
}
