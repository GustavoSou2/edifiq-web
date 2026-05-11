import {
  Directive,
  Input,
  OnInit,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
} from '@angular/core';
import { PermissionService } from '../services/permission.service';

/**
 * HasPermissionDirective — diretiva estrutural que exibe ou oculta
 * elementos do template com base nas permissões do usuário logado.
 *
 * Uso:
 * ```html
 * <!-- Exibe apenas se o usuário tiver a permissão -->
 * <button *appHasPermission="'users.manage'">Gerenciar Usuários</button>
 *
 * <!-- Aceita múltiplas permissões (OR — basta ter uma) -->
 * <div *appHasPermission="['orders.create', 'orders.view']">...</div>
 * ```
 *
 * Reage reativamente: se as permissões mudarem (ex: após carregar),
 * o elemento é adicionado/removido automaticamente.
 */
@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective implements OnInit {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly vcr         = inject(ViewContainerRef);
  private readonly permissions = inject(PermissionService);

  @Input('appHasPermission') requiredPermissions: string | string[] = [];

  ngOnInit(): void {
    // Usa effect para reagir reativamente às mudanças de permissão
    effect(() => {
      // Acessa o signal para registrar a dependência reativa
      this.permissions.permissions;

      const keys = Array.isArray(this.requiredPermissions)
        ? this.requiredPermissions
        : [this.requiredPermissions];

      const allowed = this.permissions.hasAnyPermission(...keys);

      this.vcr.clear();
      if (allowed) {
        this.vcr.createEmbeddedView(this.templateRef);
      }
    }, { injector: this.vcr.injector });
  }
}
