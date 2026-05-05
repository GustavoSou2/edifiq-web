/**
 * Edifiq — Shared UI Types
 * Tipos base reutilizados por todos os componentes de UI.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize    = 'sm' | 'md' | 'lg';
export type ButtonType    = 'button' | 'submit' | 'reset';

export type InputVariant = 'default' | 'error' | 'success' | 'warning';
export type InputSize    = 'sm' | 'md' | 'lg';
export type InputType    =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'date'
  | 'time'
  | 'datetime-local';
