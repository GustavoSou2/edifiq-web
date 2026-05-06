import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ButtonComponent }     from '../../../../shared/components/button/button.component';
import { InputComponent }      from '../../../../shared/components/input/input.component';
import { ToastService }        from '../../../../shared/services/toast.service';
import { Role }                from '../../../../shared/types/domain.types';
import { UsersApiService, CreateRolePayload } from '../../../../core/services/api/users-api.service';

const ALL_PERMISSIONS: { key: string; label: string; group: string }[] = [
  { key: 'orders.create',     label: 'Criar Pedidos',           group: 'Pedidos'       },
  { key: 'orders.view',       label: 'Visualizar Pedidos',      group: 'Pedidos'       },
  { key: 'orders.cancel',     label: 'Cancelar Pedidos',        group: 'Pedidos'       },
  { key: 'proposals.view',    label: 'Visualizar Propostas',    group: 'Propostas'     },
  { key: 'proposals.accept',  label: 'Aceitar Propostas',       group: 'Propostas'     },
  { key: 'suppliers.view',    label: 'Visualizar Fornecedores', group: 'Fornecedores'  },
  { key: 'suppliers.manage',  label: 'Gerenciar Fornecedores',  group: 'Fornecedores'  },
  { key: 'deliveries.view',   label: 'Visualizar Entregas',     group: 'Entregas'      },
  { key: 'deliveries.manage', label: 'Gerenciar Entregas',      group: 'Entregas'      },
  { key: 'users.manage',      label: 'Gerenciar Usuários',      group: 'Administração' },
  { key: 'settings.manage',   label: 'Gerenciar Configurações', group: 'Administração' },
  { key: 'analytics.view',    label: 'Ver Analytics',           group: 'Administração' },
];

const PERMISSION_GROUPS = [...new Set(ALL_PERMISSIONS.map(p => p.group))];

@Component({
  selector: 'edq-roles',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule, PageHeaderComponent, ButtonComponent, InputComponent],
  template: `
    <edq-page-header title="Perfis de Acesso" subtitle="Gerencie as permissões por perfil">
      <edq-button slot="actions" variant="secondary" size="sm" routerLink="../">← Voltar</edq-button>
      <edq-button slot="actions" variant="primary"   size="sm" (clicked)="openCreate()">+ Criar Perfil</edq-button>
    </edq-page-header>

    @if (isLoading()) {
      <div class="loading-state">Carregando perfis...</div>
    } @else {
      <div class="roles-grid">
        @for (role of roles(); track role.id) {
          <div class="role-card" [class.role-card--system]="role.isSystem">
            <div class="role-card__header">
              <div class="role-card__title-row">
                <h3 class="role-card__name">{{ role.name }}</h3>
                @if (role.isSystem) {
                  <span class="system-badge">Sistema</span>
                }
              </div>
              @if (role.description) {
                <p class="role-card__desc">{{ role.description }}</p>
              }
            </div>

            <div class="role-card__permissions">
              <p class="permissions-label">Permissões ({{ role.permissions.length }})</p>
              <div class="permission-chips">
                @for (perm of role.permissions.slice(0, 5); track perm) {
                  <span class="permission-chip">{{ permLabel(perm) }}</span>
                }
                @if (role.permissions.length > 5) {
                  <span class="permission-chip permission-chip--more">+{{ role.permissions.length - 5 }}</span>
                }
                @if (!role.permissions.length) {
                  <span class="permission-chip permission-chip--empty">Sem permissões</span>
                }
              </div>
            </div>

            <div class="role-card__footer">
              @if (!role.isSystem) {
                <edq-button variant="ghost" size="sm" (clicked)="openEdit(role)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Editar
                </edq-button>
                <edq-button variant="danger" size="sm" (clicked)="confirmDelete(role)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                  Excluir
                </edq-button>
              } @else {
                <span class="system-note">Perfil do sistema — não editável</span>
              }
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <span>🔐</span>
            <p>Nenhum perfil encontrado.</p>
            <edq-button variant="primary" size="sm" (clicked)="openCreate()">Criar primeiro perfil</edq-button>
          </div>
        }
      </div>
    }

    <!-- ── Modal Criar/Editar Role ────────────────────────── -->
    @if (modalOpen()) {
      <div class="modal-backdrop" role="dialog" aria-modal="true" [attr.aria-label]="editingId() ? 'Editar perfil' : 'Criar perfil'">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal__header">
            <h3 class="modal__title">{{ editingId() ? 'Editar Perfil' : 'Novo Perfil de Acesso' }}</h3>
            <button class="modal__close" type="button" aria-label="Fechar" (click)="closeModal()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="modal__body">
            <edq-input
              label="Nome do perfil"
              placeholder="Ex: Gerente de Compras"
              [variant]="formSubmitted() && !form.name ? 'error' : 'default'"
              [hint]="formSubmitted() && !form.name ? 'Campo obrigatório' : ''"
              [(value)]="form.name"
            />

            <edq-input
              label="Descrição (opcional)"
              placeholder="Descreva as responsabilidades deste perfil"
              [(value)]="form.description"
            />

            <div class="permissions-section">
              <div class="permissions-section__header">
                <p class="field-label">Permissões</p>
                <div class="select-all-row">
                  <button type="button" class="select-all-btn" (click)="selectAll()">Selecionar todas</button>
                  <button type="button" class="select-all-btn" (click)="clearAll()">Limpar</button>
                </div>
              </div>

              @if (formSubmitted() && !form.permissions.length) {
                <span class="field-hint field-hint--error">Selecione ao menos uma permissão</span>
              }

              @for (group of permissionGroups; track group) {
                <div class="perm-group">
                  <p class="perm-group__label">{{ group }}</p>
                  <div class="perm-group__items">
                    @for (perm of permsByGroup(group); track perm.key) {
                      <label class="perm-check-item">
                        <input
                          type="checkbox"
                          [checked]="form.permissions.includes(perm.key)"
                          (change)="togglePerm(perm.key)"
                        />
                        <span class="perm-check-label">{{ perm.label }}</span>
                      </label>
                    }
                  </div>
                </div>
              }
            </div>

            @if (formError()) {
              <div class="form-error" role="alert">{{ formError() }}</div>
            }
          </div>

          <div class="modal__footer">
            <edq-button variant="secondary" (clicked)="closeModal()">Cancelar</edq-button>
            <edq-button variant="primary" [loading]="saving()" (clicked)="saveRole()">
              {{ editingId() ? 'Salvar Alterações' : 'Criar Perfil' }}
            </edq-button>
          </div>
        </div>
      </div>
    }

    <!-- ── Modal Confirmar Exclusão ───────────────────────── -->
    @if (deleteTarget()) {
      <div class="modal-backdrop" role="alertdialog" aria-modal="true" aria-label="Confirmar exclusão">
        <div class="modal modal--sm" (click)="$event.stopPropagation()">
          <div class="modal__header">
            <h3 class="modal__title">Excluir perfil</h3>
          </div>
          <div class="modal__body">
            <p class="delete-confirm-text">
              Tem certeza que deseja excluir o perfil <strong>{{ deleteTarget()!.name }}</strong>?
              Os usuários com este perfil perderão as permissões associadas.
            </p>
          </div>
          <div class="modal__footer">
            <edq-button variant="secondary" (clicked)="deleteTarget.set(null)">Cancelar</edq-button>
            <edq-button variant="danger" [loading]="deleting()" (clicked)="deleteRole()">Excluir</edq-button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './roles.component.scss',
})
export class RolesComponent implements OnInit {
  private readonly usersApi = inject(UsersApiService);
  private readonly toast    = inject(ToastService);

  protected readonly roles     = signal<Role[]>([]);
  protected readonly isLoading = signal(false);

  /* ── Modal ──────────────────────────────────────────────── */
  protected readonly modalOpen     = signal(false);
  protected readonly editingId     = signal<string | null>(null);
  protected readonly saving        = signal(false);
  protected readonly formSubmitted = signal(false);
  protected readonly formError     = signal('');
  protected form = { name: '', description: '', permissions: [] as string[] };

  /* ── Delete ─────────────────────────────────────────────── */
  protected readonly deleteTarget = signal<Role | null>(null);
  protected readonly deleting     = signal(false);

  protected readonly permissionGroups = PERMISSION_GROUPS;

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.usersApi.listRoles().subscribe({
      next:  roles => { this.roles.set(roles); this.isLoading.set(false); },
      error: ()    => this.isLoading.set(false),
    });
  }

  protected permLabel(key: string): string {
    return ALL_PERMISSIONS.find(p => p.key === key)?.label ?? key;
  }

  protected permsByGroup(group: string) {
    return ALL_PERMISSIONS.filter(p => p.group === group);
  }

  /* ── Modal ──────────────────────────────────────────────── */
  openCreate(): void {
    this.editingId.set(null);
    this.form = { name: '', description: '', permissions: [] };
    this.formSubmitted.set(false);
    this.formError.set('');
    this.modalOpen.set(true);
  }

  openEdit(role: Role): void {
    this.editingId.set(role.id);
    this.form = {
      name:        role.name,
      description: role.description ?? '',
      permissions: [...role.permissions],
    };
    this.formSubmitted.set(false);
    this.formError.set('');
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  togglePerm(key: string): void {
    const perms = this.form.permissions;
    this.form.permissions = perms.includes(key)
      ? perms.filter(p => p !== key)
      : [...perms, key];
  }

  selectAll(): void {
    this.form.permissions = ALL_PERMISSIONS.map(p => p.key);
  }

  clearAll(): void {
    this.form.permissions = [];
  }

  async saveRole(): Promise<void> {
    this.formSubmitted.set(true);
    this.formError.set('');

    if (!this.form.name.trim() || !this.form.permissions.length) return;

    const payload: CreateRolePayload = {
      name:        this.form.name.trim(),
      permissions: this.form.permissions,
    };

    this.saving.set(true);
    try {
      if (this.editingId()) {
        const updated = await firstValueFrom(
          this.usersApi.updateRole(this.editingId()!, payload)
        );
        this.roles.update(list => list.map(r => r.id === updated.id ? updated : r));
        this.toast.success('Perfil atualizado!');
      } else {
        const created = await firstValueFrom(this.usersApi.createRole(payload));
        this.roles.update(list => [...list, created]);
        this.toast.success('Perfil criado!');
      }
      this.closeModal();
    } catch (err: any) {
      this.formError.set(err?.message ?? 'Erro ao salvar perfil.');
    } finally {
      this.saving.set(false);
    }
  }

  /* ── Delete ─────────────────────────────────────────────── */
  confirmDelete(role: Role): void {
    this.deleteTarget.set(role);
  }

  async deleteRole(): Promise<void> {
    const target = this.deleteTarget();
    if (!target) return;

    this.deleting.set(true);
    try {
      await firstValueFrom(this.usersApi.removeRole(target.id));
      this.roles.update(list => list.filter(r => r.id !== target.id));
      this.toast.success('Perfil excluído.');
      this.deleteTarget.set(null);
    } catch {
      this.toast.error('Erro ao excluir perfil.');
    } finally {
      this.deleting.set(false);
    }
  }
}
