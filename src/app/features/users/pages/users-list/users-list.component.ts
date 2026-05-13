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
import { firstValueFrom, forkJoin } from 'rxjs';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ButtonComponent }     from '../../../../shared/components/button/button.component';
import { InputComponent }      from '../../../../shared/components/input/input.component';
import { ToastService }        from '../../../../shared/services/toast.service';
import { User, Role, UserRole, Invite, InviteStatusDict } from '../../../../shared/types/domain.types';
import { UsersApiService }     from '../../../../core/services/api/users-api.service';

@Component({
  selector: 'edq-users-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, FormsModule, PageHeaderComponent, ButtonComponent, InputComponent],
  template: `
    <edq-page-header title="Usuários & Convites" subtitle="Controle de acesso da equipe">
      <edq-button slot="actions" variant="primary"   size="sm" (clicked)="openInvite()">+ Convidar Usuário</edq-button>
    </edq-page-header>

    <section class="users-content">
    <h3>Usuários</h3>
    @if (isLoading()) {
      <div class="table-loading" aria-live="polite">Carregando usuários...</div>
    } @else if (error()) {
      <div class="table-error" role="alert">{{ error() }}</div>
    } @else {
      <div class="table-wrapper" style="margin-top: 12px;">
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
                    <div class="user-avatar" [attr.aria-label]="user.fullName || user.email">
                      {{ initials(user.fullName || user.email) }}
                    </div>
                    <div class="user-info">
                      <span class="user-name">{{ user.fullName || user.email }}</span>
                      @if (user.fullName) {
                        <span class="user-email-sub">{{ user.email }}</span>
                      }
                    </div>
                  </div>
                </td>
                <td class="email-cell">{{ user.email }}</td>
                <td>
                  <div class="role-chips">
                    @for (role of userRolesMap().get(user.id) ?? []; track role.id) {
                      <span class="role-chip">{{ role.name }}</span>
                    }
                    @if (!(userRolesMap().get(user.id)?.length)) {
                      <span class="role-chip role-chip--empty">Sem role</span>
                    }
                  </div>
                </td>
                <td>
                  <button
                    class="status-toggle"
                    [class.status-toggle--active]="user.active"
                    (click)="toggleActive(user)"
                    [attr.aria-label]="user.active ? 'Desativar usuário' : 'Ativar usuário'"
                  >
                    <span class="status-toggle__dot"></span>
                    {{ user.active ? 'Ativo' : 'Inativo' }}
                  </button>
                </td>
                <td class="date-cell">
                  {{ user.lastLoginAt ? (user.lastLoginAt | date:'dd/MM/yyyy') : 'Nunca' }}
                </td>
                <td>
                  <div class="row-actions">
                    <edq-button variant="ghost" size="sm" (clicked)="openEdit(user)">Editar</edq-button>
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
    </section>

    <section  class="invites" style="margin-top: 24px;">
      <h3>Convites</h3>
      @if (isLoading()) {
      <div class="table-loading" aria-live="polite">Carregando usuários...</div>
    } @else if (error()) {
      <div class="table-error" role="alert">{{ error() }}</div>
    } @else {
      <div class="table-wrapper" style="margin-top: 12px;">
        <table class="data-table" aria-label="Lista de usuários">
          <thead>
            <tr>
              <th scope="col">Email</th>
              <th scope="col">Roles</th>
              <th scope="col">Status</th>
              <th scope="col">Convidado por</th>
              <th scope="col">Expira em</th>
              <th scope="col"><span class="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            @for (invite of invistes(); track invite.id) {
              <tr class="table-row">
                <td>
                  <div class="user-cell">
                    <div class="user-info">
                      <span class="user-name">{{ invite.email }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="role-chips">
                    @if (invite.role.name) {
                      <span class="role-chip">{{ invite.role.name }}</span>
                    } @else {
                      <span class="role-chip role-chip--empty">Sem role</span>
                    }
                  </div>
                </td>

                <td>
                  <button
                    class="status-toggle"
                  >
                    <span class="status-toggle__dot"></span>
                    {{ inviteStatusDict[invite.status] }}
                  </button>
                </td>
                 <td class="date-cell">
                  {{ invite.invitedBy.fullName ? invite.invitedBy.fullName : invite.invitedBy.email }}
                </td>
                <td class="date-cell">
                  {{ invite.expiresAt ? (invite.expiresAt | date:'dd/MM/yyyy') : 'Nunca' }}
                </td>
                <td>
                  <div class="row-actions">
                    <edq-button variant="ghost" size="sm" >Cancelar</edq-button>
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
    </section>

    <!-- ── Modal Editar Usuário ───────────────────────────── -->
    @if (editOpen()) {
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Editar usuário" (click)="closeEdit()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal__header">
            <div class="modal__header-info">
              <div class="modal__avatar">{{ initials(editForm.fullName || editForm.email) }}</div>
              <div>
                <h3 class="modal__title">Editar Usuário</h3>
                <p class="modal__subtitle">{{ editForm.email }}</p>
              </div>
            </div>
            <button class="modal__close" type="button" aria-label="Fechar" (click)="closeEdit()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="modal__body">

            <!-- Dados pessoais -->
            <div class="modal__section">
              <p class="modal__section-title">Dados Pessoais</p>

              <edq-input
                label="Nome completo"
                placeholder="Ex: João da Silva"
                [variant]="editSubmitted() && !editForm.fullName ? 'error' : 'default'"
                [hint]="editSubmitted() && !editForm.fullName ? 'Campo obrigatório' : ''"
                [(value)]="editForm.fullName"
              />

              <edq-input
                label="Telefone"
                type="tel"
                placeholder="(11) 99999-9999"
                [(value)]="editForm.phone"
              />
            </div>

            <!-- Status -->
            <div class="modal__section">
              <p class="modal__section-title">Status da Conta</p>
              <label class="toggle-row">
                <div class="toggle-row__info">
                  <span class="toggle-row__label">Conta ativa</span>
                  <span class="toggle-row__desc">Usuário pode acessar a plataforma</span>
                </div>
                <button
                  type="button"
                  class="toggle-switch"
                  [class.toggle-switch--on]="editForm.active"
                  [attr.aria-checked]="editForm.active"
                  role="switch"
                  (click)="editForm.active = !editForm.active"
                >
                  <span class="toggle-switch__thumb"></span>
                </button>
              </label>
            </div>

            <!-- Roles -->
            <div class="modal__section">
              <p class="modal__section-title">Perfis de Acesso</p>
              @if (rolesLoading()) {
                <p class="field-hint">Carregando perfis...</p>
              } @else {
                <div class="roles-checklist">
                  @for (role of availableRoles(); track role.id) {
                    <label class="role-check-item">
                      <input
                        type="checkbox"
                        [checked]="editForm.roleIds.includes(role.id)"
                        (change)="toggleEditRole(role.id)"
                      />
                      <div class="role-check-info">
                        <span class="role-check-name">{{ role.name }}</span>
                        @if (role.system) {
                          <span class="role-check-badge">Sistema</span>
                        }
                      </div>
                    </label>
                  }
                </div>
                @if (!availableRoles().length) {
                  <p class="field-hint">Nenhum perfil disponível.</p>
                }
              }
            </div>

            @if (editError()) {
              <div class="form-error" role="alert">{{ editError() }}</div>
            }
          </div>

          <div class="modal__footer">
            <edq-button variant="secondary" (clicked)="closeEdit()">Cancelar</edq-button>
            <edq-button variant="primary" [loading]="saving()" (clicked)="saveEdit()">
              Salvar Alterações
            </edq-button>
          </div>
        </div>
      </div>
    }

    <!-- ── Modal Convidar Usuário ─────────────────────────── -->
    @if (inviteOpen()) {
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Convidar usuário" (click)="closeInvite()">
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
                        type="radio"
                        [checked]="inviteForm.roleIds.includes(role.id)"
                        (change)="toggleRole(role.id)"
                      />
                      <div class="role-check-info">
                        <span class="role-check-name">{{ role.name }}</span>
                        @if (role.system) {
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

  protected readonly users        = signal<User[]>([]);
  protected readonly invistes        = signal<Invite[]>([]);
  protected readonly isLoading    = signal(false);
  protected readonly error        = signal<string | null>(null);
  protected readonly userRolesMap = signal<Map<string, Role[]>>(new Map());

  readonly inviteStatusDict = InviteStatusDict

  /** Todas as user-role associations do tenant (para diff no save) */
  private allUserRoles: UserRole[] = [];

  /* ── Edit modal ─────────────────────────────────────────── */
  protected readonly editOpen      = signal(false);
  protected readonly editSubmitted = signal(false);
  protected readonly saving        = signal(false);
  protected readonly editError     = signal('');
  protected readonly availableRoles = signal<Role[]>([]);
  protected readonly rolesLoading   = signal(false);
  protected editingUserId           = '';
  protected editForm = { fullName: '', email: '', phone: '', active: true, roleIds: [] as string[] };

  /* ── Invite modal ───────────────────────────────────────── */
  protected readonly inviteOpen      = signal(false);
  protected readonly inviteSubmitted = signal(false);
  protected readonly inviting        = signal(false);
  protected readonly inviteError     = signal('');
  protected inviteForm = { name: '', email: '', roleIds:'' };

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.error.set(null);

    forkJoin({
      users:     this.usersApi.list(),
      roles:     this.usersApi.listRoles(),
      invites:   this.usersApi.listInvites()
    }).subscribe({
      next: ({ users, roles, invites }: any) => {
        this.users.set(users.data ?? users);
        this.availableRoles.set(roles.data ?? roles);
        this.invistes.set(invites)

        // Monta mapa userId → Role[]
        const rolesById = new Map<string, Role>((roles.data ?? roles).map((r: Role) => [r.id, r]));
        const map = new Map<string, Role[]>();
        
        this.userRolesMap.set(map);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Erro ao carregar usuários.');
        this.isLoading.set(false);
      },
    });
  }

  protected initials(name: string): string {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  protected toggleActive(user: User): void {
    this.usersApi.update(user.id, { active: !user.active }).subscribe({
      next: updated => {
        this.users.update(list => list.map(u => u.id === updated.id ? updated : u));
        this.toast.success(updated.active ? 'Usuário ativado' : 'Usuário desativado');
      },
      error: () => this.toast.error('Erro ao alterar status'),
    });
  }

  /* ── Edit ───────────────────────────────────────────────── */
  openEdit(user: User): void {
    this.editingUserId = user.id;
    this.editForm = {
      fullName: user.fullName ?? '',
      email:    user.email,
      phone:    user.phone ?? '',
      active:   user.active,
      roleIds:  (this.userRolesMap().get(user.id) ?? []).map(r => r.id),
    };
    this.editSubmitted.set(false);
    this.editError.set('');
    this.loadRoles();
    this.editOpen.set(true);
  }

  closeEdit(): void {
    this.editOpen.set(false);
  }

  protected toggleEditRole(roleId: string): void {
    const ids = this.editForm.roleIds;
    this.editForm.roleIds = ids.includes(roleId)
      ? ids.filter(id => id !== roleId)
      : [...ids, roleId];
  }

  async saveEdit(): Promise<void> {
    this.editSubmitted.set(true);
    this.editError.set('');

    if (!this.editForm.fullName.trim()) return;

    this.saving.set(true);
    try {
      // 1. Atualiza dados do usuário
      const updated = await firstValueFrom(
        this.usersApi.update(this.editingUserId, {
          fullName: this.editForm.fullName.trim(),
          phone:    this.editForm.phone.trim() || null,
          active:   this.editForm.active,
        })
      );

      // 2. Sincroniza roles — calcula diff entre estado atual e novo
      const currentRoleIds = new Set(
        (this.userRolesMap().get(this.editingUserId) ?? []).map(r => r.id)
      );
      const newRoleIds = new Set(this.editForm.roleIds);

      // Roles a conceder (estão no novo mas não no atual)
      const toGrant = [...newRoleIds].filter(id => !currentRoleIds.has(id));

      // Roles a revogar (estão no atual mas não no novo)
      const toRevoke = this.allUserRoles.filter(
        ur => ur.userId === this.editingUserId && !newRoleIds.has(ur.roleId)
      );

      await Promise.all([
        ...toGrant.map(roleId =>
          firstValueFrom(this.usersApi.grantRole({ userId: this.editingUserId, roleId }))
        ),
        ...toRevoke.map(ur =>
          firstValueFrom(this.usersApi.revokeRole(ur.id))
        ),
      ]);

      // 3. Atualiza estado local
      this.users.update(list => list.map(u => u.id === updated.id ? updated : u));

      // Reconstrói o mapa de roles para este usuário
      const allRoles = this.availableRoles();
      const newRoles = allRoles.filter(r => newRoleIds.has(r.id));
      this.userRolesMap.update(map => {
        const next = new Map(map);
        next.set(this.editingUserId, newRoles);
        return next;
      });

      // Atualiza allUserRoles local para próximas operações
      this.allUserRoles = this.allUserRoles.filter(ur => ur.userId !== this.editingUserId);

      this.toast.success('Usuário atualizado!');
      this.closeEdit();
    } catch (err: any) {
      this.editError.set(err?.message ?? 'Erro ao salvar. Tente novamente.');
    } finally {
      this.saving.set(false);
    }
  }

  /* ── Invite ─────────────────────────────────────────────── */
  openInvite(): void {
    this.inviteForm = { name: '', email: '', roleIds: '' };
    this.inviteSubmitted.set(false);
    this.inviteError.set('');
    this.inviteOpen.set(true);
    this.loadRoles();
  }

  closeInvite(): void {
    this.inviteOpen.set(false);
  }

  private loadRoles(): void {
    if (this.availableRoles().length) return; // já carregado
    this.rolesLoading.set(true);
    this.usersApi.listRoles().subscribe({
      next:  roles => { this.availableRoles.set(roles); this.rolesLoading.set(false); },
      error: ()    => this.rolesLoading.set(false),
    });
  }

  protected toggleRole(roleId: string): void {
    this.inviteForm.roleIds = roleId;
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
          roleId: this.inviteForm.roleIds,
        })
      );


      this.toast.success('Usuário criado!', { message: `${this.inviteForm.email} foi adicionado ao tenant.` });
      this.closeInvite();
      this.load();
    } catch (err: any) {
      this.inviteError.set(err?.message ?? 'Erro ao criar usuário. Tente novamente.');
    } finally {
      this.inviting.set(false);
    }
  }
}
