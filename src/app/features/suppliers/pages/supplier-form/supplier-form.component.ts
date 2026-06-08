import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ButtonComponent }     from '../../../../shared/components/button/button.component';
import { InputComponent }      from '../../../../shared/components/input/input.component';
import { SuppliersApiService, CreateSupplierPayload } from '../../../../core/services/api/suppliers-api.service';
import { ToastService }        from '../../../../shared/services/toast.service';

@Component({
  selector: 'edq-supplier-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule, PageHeaderComponent, ButtonComponent, InputComponent],
  template: `
    <edq-page-header
      [title]="isEdit() ? 'Editar Fornecedor' : 'Novo Fornecedor'"
      [subtitle]="isEdit() ? 'Atualize os dados do fornecedor' : 'Cadastre um fornecedor na sua rede'"
    >
      <edq-button slot="actions" variant="secondary" size="sm" routerLink="../">← Voltar</edq-button>
    </edq-page-header>

    <div class="form-card">
      <form (ngSubmit)="save()" #f="ngForm" novalidate>

        <!-- Dados básicos -->
        <section class="form-section">
          <h3 class="form-section__title">Dados do Fornecedor</h3>

          <div class="form-row">
            <edq-input
              label="Nome / Razão Social *"
              placeholder="Ex.: Depósito Central Ltda"
              [(value)]="form.name"
              [required]="true"
            />
          </div>

          <div class="form-row form-row--2col">
            <edq-input
              label="E-mail"
              type="email"
              placeholder="contato@fornecedor.com"
              [(value)]="form.email"
            />
            <edq-input
              label="Telefone"
              type="tel"
              placeholder="(11) 99999-9999"
              [(value)]="form.phone"
            />
          </div>
        </section>

        <!-- Localização -->
        <section class="form-section">
          <h3 class="form-section__title">Localização</h3>

          <div class="form-row">
            <edq-input
              label="Endereço"
              placeholder="Rua, número, bairro"
              [(value)]="form.address"
            />
          </div>

          <div class="form-row form-row--3col">
            <edq-input
              label="Cidade"
              placeholder="São Paulo"
              [(value)]="form.city"
            />
            <edq-input
              label="Estado"
              placeholder="SP"
              [(value)]="form.state"
            />
            <edq-input
              label="CEP"
              placeholder="00000-000"
              [(value)]="form.postalCode"
            />
          </div>
        </section>

        <!-- Vínculo com plataforma -->
        <section class="form-section">
          <h3 class="form-section__title">Vínculo com a Plataforma</h3>
          <p class="form-section__desc">
            Se este fornecedor também usa o Edifiq, informe o ID do tenant dele.
            Isso permite que ele receba seus pedidos diretamente pelo painel de fornecedor.
          </p>

          <div class="form-row">
            <edq-input
              label="ID do Tenant na Plataforma (opcional)"
              placeholder="Ex.: 550e8400-e29b-41d4-a716-446655440000"
              [(value)]="form.linkedTenantId"
            />
          </div>

          @if (form.linkedTenantId) {
            <div class="platform-hint">
              🔗 Este fornecedor receberá pedidos no painel de fornecedor do Edifiq.
            </div>
          }
        </section>

        <!-- Status -->
        <section class="form-section">
          <h3 class="form-section__title">Status</h3>
          <label class="toggle-label">
            <input
              type="checkbox"
              class="toggle-input"
              [(ngModel)]="form.active"
              name="active"
            />
            <span class="toggle-track"></span>
            <span class="toggle-text">{{ form.active ? 'Ativo' : 'Inativo' }}</span>
          </label>
        </section>

        @if (error()) {
          <div class="form-error" role="alert">{{ error() }}</div>
        }

        <div class="form-actions">
          <edq-button variant="secondary" type="button" routerLink="../">Cancelar</edq-button>
          <edq-button variant="primary" type="submit" [disabled]="isSaving()">
            {{ isSaving() ? 'Salvando...' : (isEdit() ? 'Salvar Alterações' : 'Cadastrar Fornecedor') }}
          </edq-button>
        </div>

      </form>
    </div>
  `,
  styles: [`
    .form-card {
      background: var(--surface, #fff);
      border: 1px solid var(--border, #e5e7eb);
      border-radius: 12px;
      padding: 32px;
      max-width: 720px;
    }
    .form-section { margin-bottom: 32px; }
    .form-section__title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary, #111827);
      margin: 0 0 4px;
    }
    .form-section__desc {
      font-size: 13px;
      color: var(--text-secondary, #6b7280);
      margin: 0 0 16px;
    }
    .form-row { margin-bottom: 16px; }
    .form-row--2col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-row--3col { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 16px; }
    .platform-hint {
      margin-top: 8px;
      padding: 10px 14px;
      background: #ede9fe;
      color: #6d28d9;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
    }
    .toggle-label {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
    }
    .toggle-input { display: none; }
    .toggle-track {
      width: 40px;
      height: 22px;
      background: #d1d5db;
      border-radius: 11px;
      position: relative;
      transition: background 0.2s;
    }
    .toggle-track::after {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 16px;
      height: 16px;
      background: #fff;
      border-radius: 50%;
      transition: transform 0.2s;
    }
    .toggle-input:checked + .toggle-track { background: #4f46e5; }
    .toggle-input:checked + .toggle-track::after { transform: translateX(18px); }
    .toggle-text { font-size: 14px; color: var(--text-primary, #111827); }
    .form-error {
      padding: 12px 16px;
      background: #fef2f2;
      color: #dc2626;
      border-radius: 8px;
      font-size: 13px;
      margin-bottom: 16px;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid var(--border, #e5e7eb);
    }
    @media (max-width: 600px) {
      .form-row--2col, .form-row--3col { grid-template-columns: 1fr; }
      .form-card { padding: 20px; }
    }
  `],
})
export class SupplierFormComponent implements OnInit {
  readonly id = input<string>('');

  private readonly suppliersApi = inject(SuppliersApiService);
  private readonly router        = inject(Router);
  private readonly toast         = inject(ToastService);

  protected readonly isSaving = signal(false);
  protected readonly error    = signal<string | null>(null);

  protected readonly isEdit = () => !!this.id() && this.id() !== 'new';

  // Formulário com strings puras para compatibilidade com InputComponent
  protected form = {
    name:           '',
    email:          '',
    phone:          '',
    address:        '',
    city:           '',
    state:          '',
    postalCode:     '',
    active:         true,
    linkedTenantId: '',
  };

  ngOnInit(): void {
    if (this.isEdit()) {
      this.suppliersApi.findById(this.id()).subscribe({
        next: supplier => {
          this.form = {
            name:           supplier.name,
            email:          supplier.email ?? '',
            phone:          supplier.phone ?? '',
            address:        supplier.address ?? '',
            city:           supplier.city ?? '',
            state:          supplier.state ?? '',
            postalCode:     supplier.postalCode ?? '',
            active:         supplier.active,
            linkedTenantId: supplier.linkedTenantId ?? '',
          };
        },        error: () => this.error.set('Erro ao carregar fornecedor.'),
      });
    }
  }

  protected save(): void {
    if (!this.form.name?.trim()) {
      this.error.set('O nome do fornecedor é obrigatório.');
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);

    const payload: CreateSupplierPayload = {
      name:           this.form.name.trim(),
      email:          this.form.email || null,
      phone:          this.form.phone || null,
      address:        this.form.address || null,
      city:           this.form.city || null,
      state:          this.form.state || null,
      postalCode:     this.form.postalCode || null,
      active:         this.form.active,
      linkedTenantId: this.form.linkedTenantId?.trim() || null,
    };

    const request$ = this.isEdit()
      ? this.suppliersApi.update(this.id(), payload)
      : this.suppliersApi.create(payload);

    request$.subscribe({
      next: () => {
        this.toast.success(
          this.isEdit() ? 'Fornecedor atualizado.' : 'Fornecedor cadastrado.',
        );
        this.router.navigate(['/app/suppliers']);
      },
      error: () => {
        this.error.set('Erro ao salvar fornecedor. Verifique os dados e tente novamente.');
        this.isSaving.set(false);
      },
    });
  }
}
