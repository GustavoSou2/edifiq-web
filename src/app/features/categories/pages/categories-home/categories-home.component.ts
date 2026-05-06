import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { PageHeaderComponent }  from '../../../../shared/components/page-header/page-header.component';
import { ButtonComponent }      from '../../../../shared/components/button/button.component';
import { InputComponent }       from '../../../../shared/components/input/input.component';
import { ToastService }         from '../../../../shared/services/toast.service';
import { CategoriesApiService } from '../../../../core/services/api/categories-api.service';
import { Category }             from '../../../../shared/types/domain.types';

@Component({
  selector: 'edq-categories-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PageHeaderComponent, ButtonComponent, InputComponent],
  template: `
    <edq-page-header
      title="Categorias"
      subtitle="Organize os materiais por categoria para facilitar a busca dos fornecedores"
    >
      <edq-button slot="actions" variant="primary" size="sm" (clicked)="openCreate()">
        + Nova Categoria
      </edq-button>
    </edq-page-header>

    @if (isLoading()) {
      <div class="loading-state" aria-live="polite">Carregando categorias...</div>
    } @else if (error()) {
      <div class="error-state" role="alert">{{ error() }}</div>
    } @else {
      <div class="toolbar">
        <edq-input
          type="search"
          placeholder="Buscar categoria..."
          size="sm"
          [(value)]="searchQuery"
        >
          <span slot="prefix">🔍</span>
        </edq-input>
        <span class="count-badge">{{ categories().length }} categorias</span>
      </div>

      <div class="categories-tree">
        @for (cat of filteredRoots(); track cat.id) {
          <div class="cat-group">
            <div class="cat-row cat-row--root">
              <div class="cat-row__info">
                <button
                  class="cat-expand-btn"
                  type="button"
                  [attr.aria-expanded]="isExpanded(cat.id)"
                  (click)="toggleExpand(cat.id)"
                  [attr.aria-label]="(isExpanded(cat.id) ? 'Recolher ' : 'Expandir ') + cat.name"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <path [attr.d]="isExpanded(cat.id) ? 'M19 9l-7 7-7-7' : 'M9 5l7 7-7 7'"/>
                  </svg>
                </button>
                <span class="cat-icon">📁</span>
                <span class="cat-name">{{ cat.name }}</span>
                <span class="cat-slug">{{ cat.slug }}</span>
                @if (cat.children?.length) {
                  <span class="cat-count">{{ cat.children!.length }} sub</span>
                }
              </div>
              <div class="cat-row__actions">
                <edq-button variant="ghost" size="sm" (clicked)="openCreateChild(cat)">+ Sub</edq-button>
                <edq-button variant="ghost" size="sm" (clicked)="openEdit(cat)">Editar</edq-button>
                <edq-button variant="danger" size="sm" (clicked)="confirmDelete(cat)">Excluir</edq-button>
              </div>
            </div>

            @if (isExpanded(cat.id) && cat.children?.length) {
              <div class="cat-children">
                @for (child of cat.children!; track child.id) {
                  <div class="cat-row cat-row--child">
                    <div class="cat-row__info">
                      <span class="cat-icon">📄</span>
                      <span class="cat-name">{{ child.name }}</span>
                      <span class="cat-slug">{{ child.slug }}</span>
                    </div>
                    <div class="cat-row__actions">
                      <edq-button variant="ghost" size="sm" (clicked)="openEdit(child)">Editar</edq-button>
                      <edq-button variant="danger" size="sm" (clicked)="confirmDelete(child)">Excluir</edq-button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        } @empty {
          <div class="empty-state">
            <span>🗂️</span>
            <p>Nenhuma categoria encontrada.</p>
            <edq-button variant="primary" size="sm" (clicked)="openCreate()">Criar primeira categoria</edq-button>
          </div>
        }
      </div>
    }

    <!-- ── Modal Criar/Editar ─────────────────────────────── -->
    @if (modalOpen()) {
      <div class="modal-backdrop" role="dialog" aria-modal="true" [attr.aria-label]="modalTitle()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal__header">
            <h3 class="modal__title">{{ modalTitle() }}</h3>
            <button class="modal__close" type="button" aria-label="Fechar" (click)="closeModal()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="modal__body">
            @if (parentCategory()) {
              <div class="parent-info">
                <span class="parent-info__label">Subcategoria de</span>
                <span class="parent-info__name">{{ parentCategory()!.name }}</span>
              </div>
            }

            <edq-input
              label="Nome da categoria"
              placeholder="Ex: Cimento, Ferragens, Tintas..."
              [variant]="formError() ? 'error' : 'default'"
              [hint]="formError()"
              [(value)]="form.name"
            />

            <edq-input
              label="Slug (identificador único)"
              placeholder="Gerado automaticamente"
              [(value)]="form.slug"
            />
            <p class="field-hint">Deixe em branco para gerar automaticamente. Use apenas letras minúsculas, números e hífens.</p>
          </div>

          <div class="modal__footer">
            <edq-button variant="secondary" (clicked)="closeModal()">Cancelar</edq-button>
            <edq-button variant="primary" [loading]="saving()" (clicked)="saveCategory()">
              {{ editingId() ? 'Salvar Alterações' : 'Criar Categoria' }}
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
            <h3 class="modal__title">Excluir categoria</h3>
          </div>
          <div class="modal__body">
            <p class="delete-confirm-text">
              Tem certeza que deseja excluir <strong>{{ deleteTarget()!.name }}</strong>?
              Esta ação não pode ser desfeita.
            </p>
          </div>
          <div class="modal__footer">
            <edq-button variant="secondary" (clicked)="deleteTarget.set(null)">Cancelar</edq-button>
            <edq-button variant="danger" [loading]="deleting()" (clicked)="deleteCategory()">Excluir</edq-button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './categories-home.component.scss',
})
export class CategoriesHomeComponent implements OnInit {
  private readonly categoriesApi = inject(CategoriesApiService);
  private readonly toast         = inject(ToastService);

  protected readonly categories = signal<Category[]>([]);
  protected readonly isLoading  = signal(false);
  protected readonly error      = signal<string | null>(null);
  protected searchQuery         = '';

  private readonly expanded = signal<Set<string>>(new Set());

  protected readonly modalOpen      = signal(false);
  protected readonly editingId      = signal<string | null>(null);
  protected readonly parentCategory = signal<Category | null>(null);
  protected readonly saving         = signal(false);
  protected readonly formError      = signal('');
  protected form = { name: '', slug: '' };

  protected readonly deleteTarget = signal<Category | null>(null);
  protected readonly deleting     = signal(false);

  protected readonly modalTitle = computed(() =>
    this.editingId() ? 'Editar Categoria'
    : this.parentCategory() ? 'Nova Subcategoria'
    : 'Nova Categoria'
  );

  protected readonly filteredRoots = computed(() => {
    const q = this.searchQuery.toLowerCase();
    if (!q) return this.categories();
    return this.categories().filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.children?.some(ch => ch.name.toLowerCase().includes(q))
    );
  });

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.isLoading.set(true);
    this.categoriesApi.listAll().subscribe({
      next:  cats => { this.categories.set(cats); this.isLoading.set(false); },
      error: ()   => { this.error.set('Erro ao carregar categorias.'); this.isLoading.set(false); },
    });
  }

  isExpanded(id: string): boolean { return this.expanded().has(id); }

  toggleExpand(id: string): void {
    this.expanded.update(s => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.parentCategory.set(null);
    this.form = { name: '', slug: '' };
    this.formError.set('');
    this.modalOpen.set(true);
  }

  openCreateChild(parent: Category): void {
    this.editingId.set(null);
    this.parentCategory.set(parent);
    this.form = { name: '', slug: '' };
    this.formError.set('');
    this.modalOpen.set(true);
  }

  openEdit(cat: Category): void {
    this.editingId.set(cat.id);
    this.parentCategory.set(null);
    this.form = { name: cat.name, slug: cat.slug };
    this.formError.set('');
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  async saveCategory(): Promise<void> {
    if (!this.form.name.trim()) {
      this.formError.set('O nome é obrigatório.');
      return;
    }
    if (!this.form.slug.trim()) {
      this.form.slug = this.form.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    this.saving.set(true);
    this.formError.set('');
    try {
      if (this.editingId()) {
        await firstValueFrom(this.categoriesApi.update(this.editingId()!, { name: this.form.name, slug: this.form.slug }));
        this.toast.success('Categoria atualizada!');
      } else {
        await firstValueFrom(this.categoriesApi.create({ name: this.form.name, slug: this.form.slug, parentId: this.parentCategory()?.id ?? null }));
        this.toast.success('Categoria criada!');
      }
      this.closeModal();
      this.load();
    } catch (err: any) {
      this.formError.set(err?.message ?? 'Erro ao salvar categoria.');
    } finally {
      this.saving.set(false);
    }
  }

  confirmDelete(cat: Category): void { this.deleteTarget.set(cat); }

  async deleteCategory(): Promise<void> {
    const target = this.deleteTarget();
    if (!target) return;
    this.deleting.set(true);
    try {
      await firstValueFrom(this.categoriesApi.remove(target.id));
      this.toast.success('Categoria excluída.');
      this.deleteTarget.set(null);
      this.load();
    } catch {
      this.toast.error('Erro ao excluir categoria.');
    } finally {
      this.deleting.set(false);
    }
  }
}
