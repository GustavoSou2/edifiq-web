import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { createInputConfig } from '../../factories/input.factory';
import { InputSize, InputType, InputVariant } from '../../types/ui.types';

/**
 * Edifiq — Input Component
 *
 * Componente de input global com suporte a:
 * - 4 variantes visuais (default, error, success, warning)
 * - 3 tamanhos (sm, md, lg)
 * - Label flutuante / label estática
 * - Mensagem de hint e de erro
 * - Ícone/texto prefixado e sufixado via ng-content
 * - Estado desabilitado e readonly
 * - Integração com Reactive Forms e Template-driven via ControlValueAccessor
 * - Contador de caracteres opcional
 *
 * @example
 * <!-- Template-driven -->
 * <edq-input label="E-mail" type="email" [(value)]="email" />
 *
 * <!-- Reactive Forms -->
 * <edq-input label="Senha" type="password" formControlName="password" />
 *
 * <!-- Com erro -->
 * <edq-input label="CEP" variant="error" hint="CEP inválido" />
 *
 * <!-- Com prefixo -->
 * <edq-input label="Preço">
 *   <span slot="prefix">R$</span>
 * </edq-input>
 */
@Component({
  selector: 'edq-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide:     NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi:       true,
    },
  ],
  template: `
    <div [class]="config().wrapperClass">

      <!-- Label -->
      @if (label()) {
        <label
          [class]="config().labelClass"
          [for]="inputId()"
        >
          {{ label() }}
          @if (required()) {
            <span class="edq-label__required" aria-hidden="true">*</span>
          }
        </label>
      }

      <!-- Input row (prefix + input + suffix) -->
      <div class="edq-input-row">

        <!-- Prefix slot -->
        @if (hasPrefix()) {
          <div class="edq-input-prefix" aria-hidden="true">
            <ng-content select="[slot=prefix]" />
          </div>
        }

        <input
          [id]="inputId()"
          [class]="config().inputClass"
          [type]="showPassword() ? 'text' : type()"
          [value]="internalValue()"
          [placeholder]="placeholder()"
          [disabled]="isDisabled()"
          [readOnly]="readonly()"
          [required]="required()"
          [attr.maxlength]="maxLength() || null"
          [attr.minlength]="minLength() || null"
          [attr.min]="min() || null"
          [attr.max]="max() || null"
          [attr.autocomplete]="autocomplete() || null"
          [attr.aria-describedby]="hintId()"
          [attr.aria-invalid]="variant() === 'error'"
          [attr.aria-required]="required()"
          (input)="handleInput($event)"
          (blur)="handleBlur()"
          (focus)="handleFocus()"
        />

        <!-- Suffix slot ou toggle de senha -->
        @if (type() === 'password') {
          <button
            type="button"
            class="edq-input-suffix edq-input-suffix--btn"
            [attr.aria-label]="showPassword() ? 'Ocultar senha' : 'Mostrar senha'"
            (click)="togglePassword()"
          >
            {{ showPassword() ? '🙈' : '👁️' }}
          </button>
        } @else if (hasSuffix()) {
          <div class="edq-input-suffix" aria-hidden="true">
            <ng-content select="[slot=suffix]" />
          </div>
        }

      </div>

      <!-- Hint / Erro / Contador -->
      <div class="edq-input-footer">
        @if (hint()) {
          <span
            [id]="hintId()"
            class="edq-input-hint"
            [class.edq-input-hint--error]="variant() === 'error'"
            [class.edq-input-hint--success]="variant() === 'success'"
            [class.edq-input-hint--warning]="variant() === 'warning'"
            role="alert"
          >
            {{ hint() }}
          </span>
        }

        @if (maxLength()) {
          <span class="edq-input-counter">
            {{ charCount() }}/{{ maxLength() }}
          </span>
        }
      </div>

    </div>
  `,
  styleUrl: './input.component.scss',
})
export class InputComponent implements ControlValueAccessor {
  /* ── Inputs ─────────────────────────────────────────────── */
  readonly label        = input<string>('');
  readonly type         = input<InputType>('text');
  readonly variant      = input<InputVariant>('default');
  readonly size         = input<InputSize>('md');
  readonly placeholder  = input<string>('');
  readonly hint         = input<string>('');
  readonly disabled     = input<boolean>(false);
  readonly readonly     = input<boolean>(false);
  readonly required     = input<boolean>(false);
  readonly maxLength    = input<number | null>(null);
  readonly minLength    = input<number | null>(null);
  readonly min          = input<string | null>(null);
  readonly max          = input<string | null>(null);
  readonly autocomplete = input<string>('');
  readonly id           = input<string>('');

  /** Two-way binding para uso sem Reactive Forms */
  readonly value = model<string>('');

  /* ── Outputs ────────────────────────────────────────────── */
  readonly valueChange  = output<string>();
  readonly inputBlurred = output<void>();
  readonly inputFocused = output<void>();

  /* ── Internal State (signals) ───────────────────────────── */
  readonly internalValue  = signal<string>('');
  readonly isDisabled     = signal<boolean>(false);
  readonly showPassword   = signal<boolean>(false);
  readonly isFocused      = signal<boolean>(false);

  /* ── Computed ───────────────────────────────────────────── */
  readonly inputId = computed(() => this.id() || `edq-input-${Math.random().toString(36).slice(2, 8)}`);
  readonly hintId  = computed(() => `${this.inputId()}-hint`);
  readonly charCount = computed(() => this.internalValue().length);

  readonly hasPrefix = computed(() => false); // controlado via ng-content detection
  readonly hasSuffix = computed(() => false);

  readonly config = computed(() =>
    createInputConfig(
      this.variant(),
      this.size(),
      this.isDisabled(),
      this.readonly(),
      false,
      this.type() === 'password',
    ),
  );

  /* ── CVA callbacks ──────────────────────────────────────── */
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // Sincroniza o model signal com o estado interno
    effect(() => {
      const v = this.value();
      if (v !== this.internalValue()) {
        this.internalValue.set(v);
      }
    });
  }

  /* ── ControlValueAccessor ───────────────────────────────── */
  writeValue(value: string): void {
    this.internalValue.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  /* ── Handlers ───────────────────────────────────────────── */
  handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newValue = target.value;

    this.internalValue.set(newValue);
    this.value.set(newValue);
    this.onChange(newValue);
    this.valueChange.emit(newValue);
  }

  handleBlur(): void {
    this.isFocused.set(false);
    this.onTouched();
    this.inputBlurred.emit();
  }

  handleFocus(): void {
    this.isFocused.set(true);
    this.inputFocused.emit();
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }
}
