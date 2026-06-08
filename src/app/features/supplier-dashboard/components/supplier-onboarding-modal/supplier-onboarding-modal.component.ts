import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent }  from '../../../../shared/components/input/input.component';
import {
  SupplierProfileApiService,
  SupplierProfile,
  CreateSupplierProfilePayload,
} from '../../../../core/services/api/supplier-profile-api.service';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'edq-supplier-onboarding-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ButtonComponent, InputComponent],
  template: `
    <!-- Backdrop -->
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">

      <div class="modal">

        <!-- Header -->
        <div class="modal__header">
          <div class="modal__icon" aria-hidden="true">🏭</div>
          <div>
            <h2 class="modal__title" id="onboarding-title">Ative seu perfil de fornecedor</h2>
            <p class="modal__sub">
              Preencha os dados da sua empresa para começar a receber pedidos de outros compradores.
            </p>
          </div>
        </div>

        <!-- Form -->
        <form (ngSubmit)="submit()" novalidate>

          <div class="form-section">
            <edq-input
              label="Nome da empresa *"
              [placeholder]="defaultName()"
              [(value)]="form.companyName"
              [required]="true"
            />
          </div>

          <div class="form-row">
            <edq-input
              label="E-mail de contato"
              type="email"
              placeholder="contato@empresa.com"
              [(value)]="form.email"
            />
            <edq-input
              label="Telefone"
              type="tel"
              placeholder="(11) 99999-9999"
              [(value)]="form.phone"
            />
          </div>

          <div class="form-section">
            <edq-input
              label="Endereço"
              placeholder="Rua, número, bairro"
              [(value)]="form.address"
            />
          </div>

          <div class="form-row form-row--3col">
            <edq-input
              label="Cidade *"
              placeholder="São Paulo"
              [(value)]="form.city"
              [required]="true"
            />
            <edq-input
              label="Estado *"
              placeholder="SP"
              [(value)]="form.state"
              [required]="true"
            />
            <edq-input
              label="CEP"
              placeholder="00000-000"
              [(value)]="form.postalCode"
            />
          </div>

          <div class="form-section radius-section">
            <label class="radius-label">
              Raio de entrega
              <span class="radius-value">{{ form.maxDeliveryKm }} km</span>
            </label>
            <input
              type="range"
              class="radius-slider"
              min="5"
              max="200"
              step="5"
              [(ngModel)]="form.maxDeliveryKm"
              name="maxDeliveryKm"
              aria-label="Raio de entrega em quilômetros"
            />
            <div class="radius-hints">
              <span>5 km</span>
              <span>200 km</span>
            </div>
          </div>

          @if (error()) {
            <div class="form-error" role="alert">{{ error() }}</div>
          }

          <div class="modal__actions">
            <edq-button
              variant="secondary"
              type="button"
              (click)="dismissed.emit()"
              [disabled]="isSaving()"
            >
              Agora não
            </edq-button>
            <edq-button
              variant="primary"
              type="submit"
              [disabled]="!isValid() || isSaving()"
            >
              {{ isSaving() ? 'Ativando...' : 'Ativar como Fornecedor' }}
            </edq-button>
          </div>

        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
      animation: fade-in .15s ease;
    }
    @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }

    .modal {
      background: var(--surface, #fff);
      border-radius: 16px;
      padding: 32px;
      width: 100%;
      max-width: 520px;
      box-shadow: 0 20px 60px rgba(0,0,0,.18);
      animation: slide-up .2s ease;
    }
    @keyframes slide-up { from { transform: translateY(16px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }

    .modal__header {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      margin-bottom: 28px;
    }
    .modal__icon {
      font-size: 32px;
      flex-shrink: 0;
      line-height: 1;
    }
    .modal__title {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-primary, #111827);
      margin: 0 0 4px;
    }
    .modal__sub {
      font-size: 13px;
      color: var(--text-secondary, #6b7280);
      margin: 0;
      line-height: 1.5;
    }

    .form-section { margin-bottom: 16px; }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }
    .form-row--3col { grid-template-columns: 2fr 1fr 1fr; }

    .radius-section { margin-bottom: 24px; }
    .radius-label {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary, #111827);
      margin-bottom: 10px;
    }
    .radius-value {
      font-weight: 700;
      color: #059669;
    }
    .radius-slider {
      width: 100%;
      accent-color: #059669;
      cursor: pointer;
    }
    .radius-hints {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-secondary, #9ca3af);
      margin-top: 4px;
    }

    .form-error {
      padding: 10px 14px;
      background: #fef2f2;
      color: #dc2626;
      border-radius: 8px;
      font-size: 13px;
      margin-bottom: 16px;
    }

    .modal__actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding-top: 20px;
      border-top: 1px solid var(--border, #e5e7eb);
    }

    @media (max-width: 480px) {
      .modal { padding: 20px; }
      .form-row, .form-row--3col { grid-template-columns: 1fr; }
    }
  `],
})
export class SupplierOnboardingModalComponent {
  private readonly profileApi = inject(SupplierProfileApiService);
  private readonly authService = inject(AuthService);

  /** Emitido quando o perfil é criado com sucesso */
  readonly completed = output<SupplierProfile>();

  /** Emitido quando o usuário fecha o modal sem completar */
  readonly dismissed = output<void>();

  protected readonly isSaving = signal(false);
  protected readonly error    = signal<string | null>(null);

  protected readonly defaultName = () =>
    this.authService.user()?.tenant?.name ?? '';

  protected form = {
    companyName:   this.authService.user()?.tenant?.name ?? '',
    email:         this.authService.user()?.email ?? '',
    phone:         '',
    address:       '',
    city:          '',
    state:         '',
    postalCode:    '',
    maxDeliveryKm: 10,
  };

  protected isValid(): boolean {
    return !!this.form.companyName?.trim()
        && !!this.form.city?.trim()
        && !!this.form.state?.trim();
  }

  protected submit(): void {
    if (!this.isValid()) return;

    this.isSaving.set(true);
    this.error.set(null);

    const payload: CreateSupplierProfilePayload = {
      companyName:   this.form.companyName.trim(),
      email:         this.form.email || null,
      phone:         this.form.phone || null,
      address:       this.form.address || null,
      city:          this.form.city.trim(),
      state:         this.form.state.trim().toUpperCase().slice(0, 2),
      postalCode:    this.form.postalCode || null,
      maxDeliveryKm: this.form.maxDeliveryKm,
    };

    this.profileApi.create(payload).subscribe({
      next: profile => {
        this.isSaving.set(false);
        this.completed.emit(profile);
      },
      error: () => {
        this.error.set('Erro ao criar perfil. Verifique os dados e tente novamente.');
        this.isSaving.set(false);
      },
    });
  }
}
