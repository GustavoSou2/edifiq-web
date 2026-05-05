/**
 * Edifiq — Input Factory
 *
 * Centraliza a lógica de derivação de classes CSS e atributos
 * do componente Input. Mantém o componente limpo e testável.
 */

import { InputSize, InputVariant } from '../types/ui.types';

export interface InputConfig {
  wrapperClass: string;
  inputClass: string;
  labelClass: string;
}

/**
 * Mapeia variante → classe CSS do wrapper do input.
 */
const VARIANT_CLASS_MAP: Record<InputVariant, string> = {
  default: '',
  error:   'edq-input-wrapper--error',
  success: 'edq-input-wrapper--success',
  warning: 'edq-input-wrapper--warning',
};

/**
 * Mapeia tamanho → classe CSS do input.
 */
const SIZE_CLASS_MAP: Record<InputSize, string> = {
  sm: 'edq-input--sm',
  md: 'edq-input--md',
  lg: 'edq-input--lg',
};

/**
 * Cria a configuração derivada para o componente Input.
 *
 * @param variant   - Estado visual do input
 * @param size      - Tamanho do input
 * @param disabled  - Se o input está desabilitado
 * @param readonly  - Se o input é somente leitura
 * @param hasPrefix - Se há ícone/texto prefixado
 * @param hasSuffix - Se há ícone/texto sufixado
 */
export function createInputConfig(
  variant: InputVariant,
  size: InputSize,
  disabled: boolean,
  readonly: boolean,
  hasPrefix: boolean,
  hasSuffix: boolean,
): InputConfig {
  const wrapperClasses = [
    'edq-input-wrapper',
    VARIANT_CLASS_MAP[variant],
    disabled ? 'edq-input-wrapper--disabled' : '',
    readonly ? 'edq-input-wrapper--readonly' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const inputClasses = [
    'edq-input',
    SIZE_CLASS_MAP[size],
    hasPrefix ? 'edq-input--has-prefix' : '',
    hasSuffix ? 'edq-input--has-suffix' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const labelClasses = [
    'edq-label',
    disabled ? 'edq-label--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return { wrapperClass: wrapperClasses, inputClass: inputClasses, labelClass: labelClasses };
}
