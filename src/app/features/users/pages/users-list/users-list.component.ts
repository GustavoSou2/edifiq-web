import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ButtonComponent }     from '../../../../shared/components/button/button.component';
import { InputComponent }      from '../../../../shared/components/input/input.component';
import { ToastService }        from '../../../../shared/services/toast.service';
import { User, Role }          from '../../../../shared/types/domain.types';
import { UsersApiService }     from '../../../../core/services/api/users-api.service';

@Component({
  selector: 'edq-users-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, FormsModule, PageHeaderComponent, ButtonComponent, InputComponent],
  template: `
    <edq-page-header title="Usuários & Permissões" subtitle="Controle de acesso da equipe">
      <edq-button slot="actions" variant="secondary" size="sm" routerLink="roles">Gerenciar Roles</edq-button>
      <edq-button slot="actions" variant="primary"   size="sm" (clicked)="openInvite()">+ Convidar Usuário</edq-button>
    </edq-page-header>

    @if (isLoading()) {
      <div class="table-loading" aria-live="polite">Carregando usuários...</div>
    } @else if (error()) {
      <div class="table-error" role="alert">{{ error() }}</div>
    } @else {
      <div class="table-wrapper">
        <table class="data-table" aria-label="Lista de usuários">
          <thead>
            <tr>
              <th scope="col">Usuário</th>
              <th scope="col">Email</th>
              <th scope="col">Roles</th>
              <th scope="col">Status</th>
              <th scope="col">Último Login</th>
              <th scope="col"><span class="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            @for (user of users(); track user.id) {
              <tr class="table-row">
                <td>
                  <div class="user-cell">
                    <div class="user-avatar" [attr.aria-label]="user.fullName">
                      {{ initials(user.fullName) }}
                    </div>
                    <span class="user-name">{{ user.fullName }}</span>
                  </div>
                </td>
                <td class="email-cell">{{ user.email }}</td>
                <td>
                  <div class="role-chips">
                    @for (role of user.roles; track role.id) {
                      <span class="role-chip">{{ role.name }}</span>
                    }
                    @if (!user.roles?.length) {
                      <span class="role-chip role-chip--empty">Sem role</span>
                    }
                  </div>
                </td>
                <td>
                  <button
                    class="status-toggle"
                    [class.status-toggle--active]="user.isActive"
                    (click)="toggleActive(user)"
                    [attr.aria-label]="user.isActive ? 'Desativar usuário' : 'Ativar usuário'"
                  >
                    <span class="status-toggle__dot"></span>
                    {{ user.isActive ? 'Ativo' : 'Inativo' }}
                  </button>
                </td>
                <td class="date-cell">
                  {{ user.lastLoginAt ? (user.lastLoginAt | date:'dd/MM/yyyy') : 'Nunca' }}
                </td>
                <td>
                  <div class="row-actions">
                    <edq-button variant="ghost" size="sm">Editar</edq-button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6">
                  <div class="table-empty">
                    <span>👥</span>
                    <p>Nenhum usuário encontrado.</p>
                    <edq-button variant="primary" size="sm" (clicked)="openInvite()">Convidar primeiro usuário</edq-button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <!-- ── Modal Convidar Usuário ─────────────────────────── -->
    @if (inviteOpen()) {
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Convidar usuário">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal__header">
            <h3 class="modal__title">Convidar Usuário</h3>
            <button class="modal__close" type="button" aria-label="Fechar" (click)="closeInvite()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="modal__body">
            <p class="modal__desc">
              O usuário receberá um e-mail com o link de acesso e deverá criar sua senha no primeiro login.
            </p>

            <edq-input
              label="Nome completo"
              placeholder="Ex: João da Silva"
              [variant]="inviteSubmitted() && !inviteForm.name ? 'error' : 'default'"
              [hint]="inviteSubmitted() && !inviteForm.name ? 'Campo obrigatório' : ''"
              [(value)]="inviteForm.name"
            />

            <edq-input
              label="E-mail"
              type="email"
              placeholder="joao@empresa.com"
              [variant]="inviteSubmitted() && !inviteForm.email ? 'error' : 'default'"
              [hint]="inviteSubmitted() && !inviteForm.email ? 'Informe um e-mail válido' : ''"
              [(value)]="inviteForm.email"
            />

            <div class="field-group">
              <label class="field-label">Perfis de acesso</label>
              @if (rolesLoading()) {
                <p class="field-hint">Carregando perfis...</p>
              } @else {
                <div class="roles-checklist">
                  @for (role of availableRoles(); track role.id) {
                    <label class="role-check-item">
                      <input
                        type="checkbox"
                        [checked]="inviteForm.roleIds.includes(role.id)"
                        (change)="toggleRole(role.id)"
                      />
                      <div class="role-check-info">
                        <span class="role-check-name">{{ role.name }}</span>
                        @if (role.isSystem) {
                          <span class="role-check-badge">Sistema</span>
                        }
                      </div>
                    </label>
                  }
                </div>
              }
              @if (inviteSubmitted() && !inviteForm.roleIds.length) {
                <span class="field-hint field-hint--error">Selecione ao menos um perfil</span>
              }
            </div>

            @if (inviteError()) {
              <div class="form-error" role="alert">{{ inviteError() }}</div>
            }
          </div>

          <div class="modal__footer">
            <edq-button variant="secondary" (clicked)="closeInvite()">Cancelar</edq-button>
            <edq-button variant="primary" [loading]="inviting()" (clicked)="sendInvite()">
              Enviar Convite
            </edq-button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './users-list.component.scss',
})
export class UsersListComponent implements OnInit {
  private readonly usersApi = inject(UsersApiService);
  private readonly toast    = inject(ToastService);

  protected readonly users     = signal<User[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly error     = signal<string | null>(null);

  /* ── Invite modal ───────────────────────────────────────── */
  protected readonly inviteOpen      = signal(false);
  protected readonly inviteSubmitted = signal(false);
  protected readonly inviting        = signal(false);
  protected readonly inviteError     = signal('');
  protected readonly availableRoles  = signal<Role[]>([]);
  protected readonly rolesLoading    = signal(false);
  protected inviteForm = { name: '', email: '', roleIds: [] as string[] };

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.usersApi.list().subscribe({
      next:  res => { this.users.set(res.data); this.isLoading.set(false); },
      error: ()  => { this.error.set('Erro ao carregar usuários.'); this.isLoading.set(false); },
    });
  }

  protected initials(name: string): string {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  protected toggleActive(user: User): void {
    this.usersApi.toggleActive(user.id, !user.isActive).subscribe({
      next: updated => {
        this.users.update(list => list.map(u => u.id === updated.id ? updated : u));
      },
    });
  }

  /* ── Invite ─────────────────────────────────────────────── */
  openInvite(): void {
    this.inviteForm = { name: '', email: '', roleIds: [] };
    this.inviteSubmitted.set(false);
    this.inviteError.set('');
    this.inviteOpen.set(true);
    this.loadRoles();
  }

  closeInvite(): void {
    this.inviteOpen.set(false);
  }

  private loadRoles(): void {
    this.rolesLoading.set(true);
    this.usersApi.listRoles().subscribe({
      next:  roles => { this.availableRoles.set(roles); this.rolesLoading.set(false); },
      error: ()    => this.rolesLoading.set(false),
    });
  }

  protected toggleRole(roleId: string): void {
    const ids = this.inviteForm.roleIds;
    this.inviteForm.roleIds = ids.includes(roleId)
      ? ids.filter(id => id !== roleId)
      : [...ids, roleId];
  }

  async sendInvite(): Promise<void> {
    this.inviteSubmitted.set(true);
    this.inviteError.set('');

    if (!this.inviteForm.name || !this.inviteForm.email || !this.inviteForm.roleIds.length) return;

    this.inviting.set(true);
    try {
      const user = await firstValueFrom(
        this.usersApi.invite({
          name:    this.inviteForm.name,
          email:   this.inviteForm.email,
          roleIds: this.inviteForm.roleIds,
        })
      );
      this.users.update(list => [...list, user]);
      this.toast.success('Convite enviado!', { message: `${this.inviteForm.email} receberá o link de acesso.` });
      this.closeInvite();
    } catch (err: any) {
      this.inviteError.set(err?.message ?? 'Erro ao enviar convite. Tente novamente.');
    } finally {
      this.inviting.set(false);
    }
  }
}
