import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, fromEvent, takeUntil } from 'rxjs';

import { InputVariant, InputSize } from '../../types/ui.types';

export interface SearchSelectOption {
  value:     string;
  label:     string;
  sublabel?: string;
}

@Component({
  selector: 'edq-search-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  providers: [
    {
      provide:     NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchSelectComponent),
      multi:       true,
    },
  ],
  template: `
    <div [class]="wrapperClass()" #triggerRef>

      <!-- Label -->
      @if (label()) {
        <label class="ss-label" [for]="inputId()">
          {{ label() }}
          @if (required()) {
            <span class="ss-label__required" aria-hidden="true">*</span>
          }
        </label>
      }

      <!-- Trigger button -->
      <div
        class="ss-trigger"
        [class.ss-trigger--open]="isOpen()"
        [class.ss-trigger--disabled]="isDisabled()"
        (click)="!isDisabled() && toggle()"
        [attr.aria-haspopup]="'listbox'"
        [attr.aria-expanded]="isOpen()"
        role="combobox"
      >
        <div class="ss-trigger__content">
          @if (selectedOption()) {
            <span class="ss-trigger__selected">{{ selectedOption()!.label }}</span>
          } @else {
            <span class="ss-trigger__placeholder">{{ placeholder() }}</span>
          }
        </div>
        <div class="ss-trigger__icons">
          @if (selectedOption() && !isDisabled()) {
            <button
              type="button"
              class="ss-clear-btn"
              aria-label="Limpar seleção"
              (click)="clear($event)"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          }
          <svg
            class="ss-chevron"
            [class.ss-chevron--open]="isOpen()"
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      <!-- Hint text -->
      @if (hint()) {
        <span class="ss-hint-text" [class.ss-hint-text--error]="variant() === 'error'">
          {{ hint() }}
        </span>
      }
    </div>
  `,
  styleUrl: './search-select.component.scss',
})
export class SearchSelectComponent implements ControlValueAccessor, OnInit, OnDestroy {
  /* ── Inputs ─────────────────────────────────────────────── */
  readonly label             = input<string>('');
  readonly placeholder       = input<string>('Selecione...');
  readonly searchPlaceholder = input<string>('Buscar...');
  readonly hint              = input<string>('');
  readonly variant           = input<InputVariant>('default');
  readonly size              = input<InputSize>('md');
  readonly required          = input<boolean>(false);
  readonly disabled          = input<boolean>(false);
  readonly options           = input<SearchSelectOption[]>([]);
  readonly loading           = input<boolean>(false);
  readonly minChars          = input<number>(1);
  readonly debounce          = input<number>(300);

  readonly value = model<string>('');

  /* ── Outputs ────────────────────────────────────────────── */
  readonly search         = output<string>();
  readonly optionSelected = output<SearchSelectOption>();

  /* ── Internal ───────────────────────────────────────────── */
  protected readonly isOpen       = signal(false);
  protected readonly query        = signal('');
  protected readonly focusedIndex = signal(-1);
  protected readonly isDisabled   = signal(false);
  protected readonly skeletonItems = [1, 2, 3, 4];

  protected readonly inputId = computed(() =>
    `edq-ss-${Math.random().toString(36).slice(2, 8)}`
  );

  protected readonly selectedOption = computed(() =>
    this.options().find(o => o.value === this.value()) ?? null
  );

  protected readonly wrapperClass = computed(() => {
    const c = ['ss-wrapper'];
    if (this.variant() !== 'default') c.push(`ss-wrapper--${this.variant()}`);
    if (this.isDisabled()) c.push('ss-wrapper--disabled');
    return c.join(' ');
  });

  /* ── Portal ─────────────────────────────────────────────── */
  private dropdownEl: HTMLElement | null = null;

  private readonly triggerRef = viewChild<ElementRef<HTMLElement>>('triggerRef');
  private readonly doc        = inject(DOCUMENT);
  private readonly host       = inject(ElementRef);

  private readonly searchSubject = new Subject<string>();
  private readonly destroy$      = new Subject<void>();

  private onChange:  (v: string) => void = () => {};
  private onTouched: () => void          = () => {};

  constructor() {
    // Atualiza o dropdown sempre que options ou loading mudam
    effect(() => {
      // Lê os signals para registrar dependência
      this.options();
      this.loading();
      if (this.isOpen() && this.dropdownEl) {
        this.updateDropdownContent();
      }
    });
  }

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(this.debounce()),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(q => {
      if (q.length >= this.minChars()) this.search.emit(q);
      this.updateDropdownContent();
    });

    // Fecha ao clicar fora
    fromEvent<MouseEvent>(this.doc, 'click')
      .pipe(takeUntil(this.destroy$))
      .subscribe(e => {
        const target = e.target as Node;
        const inHost     = this.host.nativeElement.contains(target);
        const inDropdown = this.dropdownEl?.contains(target);
        if (!inHost && !inDropdown) this.close();
      });

    // Fecha ao rolar a página
    fromEvent(this.doc, 'scroll', { capture: true, passive: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { if (this.isOpen()) this.positionDropdown(); });
  }

  ngOnDestroy(): void {
    this.removeDropdown();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* ── CVA ────────────────────────────────────────────────── */
  writeValue(v: string): void        { this.value.set(v ?? ''); }
  registerOnChange(fn: any): void    { this.onChange = fn; }
  registerOnTouched(fn: any): void   { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.isDisabled.set(d); }

  /* ── Toggle ─────────────────────────────────────────────── */
  toggle(): void {
    this.isOpen() ? this.close() : this.open();
  }

  open(): void {
    this.isOpen.set(true);
    this.query.set('');
    this.focusedIndex.set(-1);
    this.createDropdown();
    setTimeout(() => {
      this.dropdownEl?.querySelector<HTMLInputElement>('.ss-search__input')?.focus();
    }, 30);
  }

  close(): void {
    this.isOpen.set(false);
    this.removeDropdown();
    this.onTouched();
  }

  select(opt: SearchSelectOption): void {
    this.value.set(opt.value);
    this.onChange(opt.value);
    this.optionSelected.emit(opt);
    this.close();
  }

  clear(event: MouseEvent): void {
    event.stopPropagation();
    this.value.set('');
    this.onChange('');
    this.optionSelected.emit({ value: '', label: '' });
  }

  /* ── Portal: criar dropdown no body ─────────────────────── */
  private createDropdown(): void {
    this.removeDropdown();

    const el = this.doc.createElement('div');
    el.className = 'ss-portal-dropdown';
    el.setAttribute('role', 'listbox');
    el.setAttribute('aria-label', this.label() || 'Opções');

    el.innerHTML = this.buildDropdownHTML();
    this.doc.body.appendChild(el);
    this.dropdownEl = el;

    this.positionDropdown();
    this.bindDropdownEvents();
  }

  private removeDropdown(): void {
    if (this.dropdownEl) {
      this.dropdownEl.remove();
      this.dropdownEl = null;
    }
  }

  private positionDropdown(): void {
    if (!this.dropdownEl) return;
    const trigger = this.triggerRef()?.nativeElement;
    if (!trigger) return;

    const rect   = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropH  = Math.min(320, window.innerHeight * 0.4);

    const openUp = spaceBelow < dropH && spaceAbove > spaceBelow;

    Object.assign(this.dropdownEl.style, {
      position:  'fixed',
      width:     `${rect.width}px`,
      left:      `${rect.left}px`,
      zIndex:    '99999',
      maxHeight: `${dropH}px`,
      ...(openUp
        ? { bottom: `${window.innerHeight - rect.top + 4}px`, top: 'auto' }
        : { top: `${rect.bottom + 4}px`, bottom: 'auto' }
      ),
    });
  }

  private buildDropdownHTML(): string {
    const searchIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
    const spinnerIcon = `<svg class="ss-search__spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`;

    return `
      <div class="ss-search">
        ${searchIcon}
        <input
          class="ss-search__input"
          type="text"
          placeholder="${this.searchPlaceholder()}"
          value="${this.query()}"
          autocomplete="off"
        />
        ${this.loading() ? spinnerIcon : ''}
      </div>
      <div class="ss-options">
        ${this.buildOptionsHTML()}
      </div>
    `;
  }

  private buildOptionsHTML(): string {
    if (this.loading()) {
      return this.skeletonItems.map(() => `
        <div class="ss-skeleton">
          <div class="ss-skeleton__line ss-skeleton__line--main"></div>
          <div class="ss-skeleton__line ss-skeleton__line--sub"></div>
        </div>
      `).join('');
    }

    const opts = this.options();
    if (opts.length) {
      return opts.map((opt, i) => {
        const isSelected = opt.value === this.value();
        const isFocused  = i === this.focusedIndex();
        const checkIcon  = isSelected
          ? `<svg class="ss-option__check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`
          : '';
        const sublabel = opt.sublabel
          ? `<span class="ss-option__sublabel">${opt.sublabel}</span>`
          : '';
        return `
          <div
            class="ss-option${isSelected ? ' ss-option--selected' : ''}${isFocused ? ' ss-option--focused' : ''}"
            role="option"
            aria-selected="${isSelected}"
            data-value="${opt.value}"
          >
            <div class="ss-option__content">
              <span class="ss-option__label">${this.highlight(opt.label)}</span>
              ${sublabel}
            </div>
            ${checkIcon}
          </div>
        `;
      }).join('');
    }

    if (this.query().length >= this.minChars()) {
      return `<div class="ss-empty">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <span>Nenhum resultado para "<strong>${this.query()}</strong>"</span>
      </div>`;
    }

    return `<div class="ss-hint">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span>Digite ${this.minChars() > 1 ? 'ao menos ' + this.minChars() + ' caracteres' : 'para buscar'}</span>
    </div>`;
  }

  private bindDropdownEvents(): void {
    if (!this.dropdownEl) return;

    // Input de busca
    const input = this.dropdownEl.querySelector<HTMLInputElement>('.ss-search__input');
    input?.addEventListener('input', (e) => {
      const q = (e.target as HTMLInputElement).value;
      this.query.set(q);
      this.focusedIndex.set(-1);
      this.searchSubject.next(q);
    });

    input?.addEventListener('keydown', (e) => this.onKeydown(e as KeyboardEvent));

    // Clique nas opções
    this.dropdownEl.addEventListener('click', (e) => {
      const optEl = (e.target as HTMLElement).closest<HTMLElement>('[data-value]');
      if (!optEl) return;
      const val = optEl.dataset['value']!;
      const opt = this.options().find(o => o.value === val);
      if (opt) this.select(opt);
    });

    // Hover nas opções
    this.dropdownEl.addEventListener('mouseover', (e) => {
      const optEl = (e.target as HTMLElement).closest<HTMLElement>('[data-value]');
      if (!optEl) return;
      const idx = Array.from(this.dropdownEl!.querySelectorAll('[data-value]')).indexOf(optEl);
      this.focusedIndex.set(idx);
    });
  }

  /* Atualiza o conteúdo do dropdown sem recriar o elemento */
  private updateDropdownContent(): void {
    if (!this.dropdownEl) return;
    const optionsEl = this.dropdownEl.querySelector('.ss-options');
    const searchEl  = this.dropdownEl.querySelector('.ss-search');
    if (optionsEl) optionsEl.innerHTML = this.buildOptionsHTML();
    if (searchEl) {
      const spinner = searchEl.querySelector('.ss-search__spinner');
      if (this.loading() && !spinner) {
        searchEl.insertAdjacentHTML('beforeend', `<svg class="ss-search__spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`);
      } else if (!this.loading() && spinner) {
        spinner.remove();
      }
    }
  }

  /* ── Keyboard ───────────────────────────────────────────── */
  onKeydown(event: KeyboardEvent): void {
    const opts = this.options();
    const idx  = this.focusedIndex();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusedIndex.set(Math.min(idx + 1, opts.length - 1));
        this.updateDropdownContent();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex.set(Math.max(idx - 1, 0));
        this.updateDropdownContent();
        break;
      case 'Enter':
        event.preventDefault();
        if (idx >= 0 && opts[idx]) this.select(opts[idx]);
        break;
      case 'Escape':
        this.close();
        break;
    }
  }

  /* ── Highlight ──────────────────────────────────────────── */
  protected highlight(text: string): string {
    const q = this.query().trim();
    if (!q) return text;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(
      new RegExp(`(${escaped})`, 'gi'),
      '<mark class="ss-highlight">$1</mark>',
    );
  }
}
