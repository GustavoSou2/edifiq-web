/**
 * Edifiq — Button Factory
 *
 * Centraliza toda a lógica de derivação de classes CSS e atributos
 * do componente Button. Mantém o componente limpo e testável.
 */

import { ButtonSize, ButtonVariant } from '../types/ui.types';

export interface ButtonConfig {
  hostClass: string;
  ariaDisabled: boolean;
}

/**
 * Mapeia variante → classes CSS do botão.
 */
const VARIANT_CLASS_MAP: Record<ButtonVariant, string> = {
  primary:   'edq-btn--primary',
  secondary: 'edq-btn--secondary',
  ghost:     'edq-btn--ghost',
  danger:    'edq-btn--danger',
  success:   'edq-btn--success',
};

/**
 * Mapeia tamanho → classe CSS do botão.
 */
const SIZE_CLASS_MAP: Record<ButtonSize, string> = {
  sm: 'edq-btn--sm',
  md: 'edq-btn--md',
  lg: 'edq-btn--lg',
};

/**
 * Cria a configuração derivada para o componente Button.
 *
 * @param variant  - Variante visual do botão
 * @param size     - Tamanho do botão
 * @param disabled - Se o botão está desabilitado
 * @param loading  - Se o botão está em estado de carregamento
 * @param fullWidth - Se o botão ocupa 100% da largura
 * @param iconOnly  - Se o botão contém apenas ícone (ajusta padding)
 */
export function createButtonConfig(
  variant: ButtonVariant,
  size: ButtonSize,
  disabled: boolean,
  loading: boolean,
  fullWidth: boolean,
  iconOnly: boolean,
): ButtonConfig {
  const isDisabled = disabled || loading;

  const classes = [
    'edq-btn',
    VARIANT_CLASS_MAP[variant],
    SIZE_CLASS_MAP[size],
    isDisabled  ? 'edq-btn--disabled'    : '',
    loading     ? 'edq-btn--loading'     : '',
    fullWidth   ? 'edq-btn--full-width'  : '',
    iconOnly    ? 'edq-btn--icon-only'   : '',
  ]
    .filter(Boolean)
    .join(' ');

  return {
    hostClass:    classes,
    ariaDisabled: isDisabled,
  };
}
