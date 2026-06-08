import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RolePanelService } from '../../services/role-panel.service';

/**
 * Tela de loading fullscreen exibida durante a transição entre painéis.
 * Animação de construção com guindaste SVG animado.
 */
@Component({
  selector: 'edq-panel-transition',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="transition-screen"
      [class.transition-screen--supplier]="rolePanel.isSupplier()"
      [class.transition-screen--visible]="rolePanel.isTransitioning()"
      role="status"
      aria-live="polite"
      [attr.aria-label]="'Carregando painel ' + rolePanel.currentConfig().label"
    >
      <div class="transition-content">

        <!-- Animação de construção -->
        <div class="crane-scene" aria-hidden="true">
          <svg class="crane-svg" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">

            <!-- Prédio em construção (andares aparecem progressivamente) -->
            <g class="building">
              <!-- Base -->
              <rect x="60" y="120" width="80" height="8" rx="1" fill="currentColor" opacity="0.3"/>
              <!-- Andar 1 -->
              <rect class="floor floor-1" x="65" y="100" width="70" height="20" rx="1" fill="currentColor" opacity="0.2"/>
              <line x1="65" y1="110" x2="135" y2="110" stroke="currentColor" stroke-width="0.5" opacity="0.4"/>
              <rect x="75" y="103" width="12" height="14" rx="1" fill="currentColor" opacity="0.3"/>
              <rect x="95" y="103" width="12" height="14" rx="1" fill="currentColor" opacity="0.3"/>
              <rect x="115" y="103" width="12" height="14" rx="1" fill="currentColor" opacity="0.3"/>
              <!-- Andar 2 -->
              <rect class="floor floor-2" x="65" y="80" width="70" height="20" rx="1" fill="currentColor" opacity="0.2"/>
              <line x1="65" y1="90" x2="135" y2="90" stroke="currentColor" stroke-width="0.5" opacity="0.4"/>
              <rect x="75" y="83" width="12" height="14" rx="1" fill="currentColor" opacity="0.3"/>
              <rect x="95" y="83" width="12" height="14" rx="1" fill="currentColor" opacity="0.3"/>
              <rect x="115" y="83" width="12" height="14" rx="1" fill="currentColor" opacity="0.3"/>
              <!-- Andar 3 (em construção) -->
              <rect class="floor floor-3" x="65" y="60" width="70" height="20" rx="1" fill="currentColor" opacity="0.15" stroke="currentColor" stroke-width="0.5" stroke-dasharray="4 2"/>
            </g>

            <!-- Torre do guindaste -->
            <rect class="crane-tower" x="148" y="30" width="6" height="98" rx="1" fill="currentColor" opacity="0.6"/>
            <!-- Treliça da torre -->
            <line x1="148" y1="40" x2="154" y2="50" stroke="currentColor" stroke-width="0.8" opacity="0.4"/>
            <line x1="154" y1="40" x2="148" y2="50" stroke="currentColor" stroke-width="0.8" opacity="0.4"/>
            <line x1="148" y1="55" x2="154" y2="65" stroke="currentColor" stroke-width="0.8" opacity="0.4"/>
            <line x1="154" y1="55" x2="148" y2="65" stroke="currentColor" stroke-width="0.8" opacity="0.4"/>
            <line x1="148" y1="70" x2="154" y2="80" stroke="currentColor" stroke-width="0.8" opacity="0.4"/>
            <line x1="154" y1="70" x2="148" y2="80" stroke="currentColor" stroke-width="0.8" opacity="0.4"/>

            <!-- Lança horizontal do guindaste -->
            <rect class="crane-boom" x="90" y="28" width="64" height="4" rx="1" fill="currentColor" opacity="0.7"/>
            <!-- Contrapeso -->
            <rect x="148" y="28" width="16" height="8" rx="1" fill="currentColor" opacity="0.5"/>
            <!-- Cabo do guindaste (animado) -->
            <line class="crane-cable" x1="110" y1="32" x2="110" y2="58" stroke="currentColor" stroke-width="1.5" opacity="0.8"/>
            <!-- Gancho -->
            <circle class="crane-hook" cx="110" cy="60" r="3" fill="currentColor" opacity="0.9"/>
            <!-- Carga (bloco) -->
            <rect class="crane-load" x="103" y="63" width="14" height="10" rx="2" fill="currentColor" opacity="0.8"/>

            <!-- Capacete de segurança (detalhe) -->
            <ellipse cx="30" cy="138" rx="12" ry="6" fill="currentColor" opacity="0.4"/>
            <rect x="22" y="132" width="16" height="6" rx="3" fill="currentColor" opacity="0.5"/>

            <!-- Partículas de poeira -->
            <circle class="dust dust-1" cx="70" cy="75" r="2" fill="currentColor" opacity="0.3"/>
            <circle class="dust dust-2" cx="130" cy="72" r="1.5" fill="currentColor" opacity="0.2"/>
            <circle class="dust dust-3" cx="100" cy="78" r="1" fill="currentColor" opacity="0.25"/>
          </svg>
        </div>

        <!-- Texto -->
        <div class="transition-text">
          <div class="transition-badge" [style.background]="rolePanel.currentConfig().color + '22'" [style.color]="rolePanel.currentConfig().color">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path [attr.d]="rolePanel.currentConfig().icon"/>
            </svg>
            Painel {{ rolePanel.currentConfig().label }}
          </div>
          <h2 class="transition-title">Preparando seu painel</h2>
          <p class="transition-sub">{{ rolePanel.currentConfig().description }}</p>
        </div>

        <!-- Barra de progresso -->
        <div class="progress-bar" aria-hidden="true">
          <div class="progress-bar__fill" [style.background]="rolePanel.currentConfig().color"></div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .transition-screen {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f172a;
      opacity: 0;
      pointer-events: none;
      transition: opacity .3s ease;
    }
    .transition-screen--visible {
      opacity: 1;
      pointer-events: all;
    }

    /* Tema por painel */
    .transition-screen--supplier { background: #022c22; }
    .transition-screen:not(.transition-screen--supplier) { background: #0f0e2e; }

    .transition-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 28px;
      text-align: center;
      padding: 32px;
    }

    /* ── Crane scene ─────────────────────────────────────── */
    .crane-scene {
      width: 200px;
      height: 160px;
    }
    .crane-svg {
      width: 100%;
      height: 100%;
      color: #fff;
    }

    /* Guindaste oscila levemente */
    .crane-boom {
      transform-origin: 154px 30px;
      animation: crane-sway 3s ease-in-out infinite;
    }
    @keyframes crane-sway {
      0%, 100% { transform: rotate(0deg); }
      30%       { transform: rotate(-2deg); }
      70%       { transform: rotate(1deg); }
    }

    /* Cabo e carga sobem e descem */
    .crane-cable, .crane-hook, .crane-load {
      animation: crane-lift 2.4s ease-in-out infinite;
    }
    @keyframes crane-lift {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-18px); }
    }

    /* Andares aparecem progressivamente */
    .floor-1 { animation: floor-appear 2.4s ease-out infinite; }
    .floor-2 { animation: floor-appear 2.4s ease-out .4s infinite; }
    .floor-3 { animation: floor-appear 2.4s ease-out .8s infinite; }
    @keyframes floor-appear {
      0%   { opacity: 0; transform: scaleY(0); transform-origin: bottom; }
      20%  { opacity: 0.2; transform: scaleY(1); }
      100% { opacity: 0.2; }
    }

    /* Partículas de poeira */
    .dust-1 { animation: dust-float 2s ease-out .2s infinite; }
    .dust-2 { animation: dust-float 2s ease-out .6s infinite; }
    .dust-3 { animation: dust-float 2s ease-out 1s infinite; }
    @keyframes dust-float {
      0%   { opacity: .3; transform: translate(0, 0); }
      100% { opacity: 0;  transform: translate(-8px, -12px); }
    }

    /* ── Texto ───────────────────────────────────────────── */
    .transition-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 14px;
      border-radius: 99px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: .04em;
    }
    .transition-title {
      font-size: 22px;
      font-weight: 800;
      color: #fff;
      margin: 0;
      letter-spacing: -.02em;
    }
    .transition-sub {
      font-size: 14px;
      color: rgba(255,255,255,.5);
      margin: 0;
    }

    /* ── Progress bar ────────────────────────────────────── */
    .progress-bar {
      width: 200px;
      height: 3px;
      background: rgba(255,255,255,.1);
      border-radius: 99px;
      overflow: hidden;
    }
    .progress-bar__fill {
      height: 100%;
      border-radius: 99px;
      animation: progress-fill 1.8s ease-in-out forwards;
    }
    @keyframes progress-fill {
      0%   { width: 0%; }
      60%  { width: 80%; }
      100% { width: 100%; }
    }
  `],
})
export class PanelTransitionComponent {
  protected readonly rolePanel = inject(RolePanelService);
}
