import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'edq-landing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <!-- ── Navbar ──────────────────────────────────────────── -->
    <nav class="lp-nav">
      <div class="lp-nav__inner">
        <div class="lp-nav__logo">
          <div class="lp-logo-mark">🏗️</div>
          <span class="lp-logo-text">Edifiq</span>
        </div>
        <div class="lp-nav__links">
          <a href="#features">Funcionalidades</a>
          <a href="#how">Como funciona</a>
          <a href="#pricing">Planos</a>
        </div>
        <div class="lp-nav__cta">
          <a class="lp-btn lp-btn--ghost" routerLink="/auth/login">Entrar</a>
          <a class="lp-btn lp-btn--primary" routerLink="/auth/register">Começar grátis</a>
        </div>
      </div>
    </nav>

    <!-- ── Hero ────────────────────────────────────────────── -->
    <section class="lp-hero">
      <div class="lp-hero__inner">
        <div class="lp-hero__badge">
          <span class="lp-badge-dot"></span>
          Plataforma SaaS B2B para construção civil
        </div>

        <h1 class="lp-hero__title">
          Materiais certos,<br>
          <span class="lp-hero__title--accent">no menor preço.</span>
        </h1>

        <p class="lp-hero__desc">
          O Edifiq conecta compradores de materiais de construção a fornecedores
          via leilão reverso inteligente. Receba propostas competitivas em minutos,
          compare e escolha a melhor oferta.
        </p>

        <div class="lp-hero__actions">
          <a class="lp-btn lp-btn--primary lp-btn--lg" routerLink="/auth/register">
            Criar conta grátis
          </a>
          <a class="lp-btn lp-btn--outline lp-btn--lg" routerLink="/app/dashboard">
            Ver demonstração →
          </a>
        </div>

        <div class="lp-hero__social-proof">
          <div class="sp-avatars">
            <div class="sp-avatar" style="background:#6C5CE7">JM</div>
            <div class="sp-avatar" style="background:#00C875">AS</div>
            <div class="sp-avatar" style="background:#E2445C">CL</div>
            <div class="sp-avatar" style="background:#0086C0">RF</div>
          </div>
          <span>+2.400 fornecedores ativos na plataforma</span>
        </div>
      </div>

      <!-- Hero visual -->
      <div class="lp-hero__visual">
        <div class="hero-board">
          <div class="hero-board__header">
            <span class="hero-board__title">Pedidos em andamento</span>
            <span class="hero-board__count">6 pedidos</span>
          </div>
          <div class="hero-board__rows">
            <div class="hero-row">
              <div class="hero-row__bar" style="background:var(--mn-red)"></div>
              <span class="hero-row__ref">#EDQ-0042</span>
              <span class="hero-row__desc">20 sacos cimento CP-II</span>
              <span class="hero-row__status" style="background:var(--mn-red-bg);color:var(--mn-red)">Em Leilão</span>
              <span class="hero-row__proposals">3 propostas</span>
            </div>
            <div class="hero-row">
              <div class="hero-row__bar" style="background:var(--mn-green)"></div>
              <span class="hero-row__ref">#EDQ-0041</span>
              <span class="hero-row__desc">100m² piso cerâmico</span>
              <span class="hero-row__status" style="background:var(--mn-green-bg);color:var(--mn-green)">Confirmado</span>
              <span class="hero-row__proposals">5 propostas</span>
            </div>
            <div class="hero-row">
              <div class="hero-row__bar" style="background:var(--mn-blue)"></div>
              <span class="hero-row__ref">#EDQ-0040</span>
              <span class="hero-row__desc">Ferragens estruturais</span>
              <span class="hero-row__status" style="background:var(--mn-blue-bg);color:var(--mn-blue)">Aberto</span>
              <span class="hero-row__proposals">0 propostas</span>
            </div>
            <div class="hero-row">
              <div class="hero-row__bar" style="background:var(--mn-yellow)"></div>
              <span class="hero-row__ref">#EDQ-0039</span>
              <span class="hero-row__desc">Tintas e massa corrida</span>
              <span class="hero-row__status" style="background:var(--mn-yellow-bg);color:#8B6000">Selecionado</span>
              <span class="hero-row__proposals">4 propostas</span>
            </div>
          </div>
          <!-- Floating card -->
          <div class="hero-float-card">
            <span class="hero-float-card__icon">⚡</span>
            <div>
              <strong>Proposta recebida!</strong>
              <span>R$ 1.250,00 · 2h entrega</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Stats ────────────────────────────────────────────── -->
    <section class="lp-stats">
      <div class="lp-container">
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-item__value">+2.400</span>
            <span class="stat-item__label">Fornecedores ativos</span>
          </div>
          <div class="stat-item">
            <span class="stat-item__value">4 min</span>
            <span class="stat-item__label">Tempo médio de proposta</span>
          </div>
          <div class="stat-item">
            <span class="stat-item__value">98%</span>
            <span class="stat-item__label">Taxa de resposta</span>
          </div>
          <div class="stat-item">
            <span class="stat-item__value">R$ 2,1M</span>
            <span class="stat-item__label">Economia gerada/mês</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Features ─────────────────────────────────────────── -->
    <section class="lp-features" id="features">
      <div class="lp-container">
        <div class="lp-section-header">
          <span class="lp-eyebrow">Funcionalidades</span>
          <h2>Tudo que você precisa para comprar melhor</h2>
          <p>Do pedido à entrega, o Edifiq automatiza e otimiza cada etapa do processo de compra de materiais.</p>
        </div>

        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-card__icon" style="background:var(--mn-purple-light);color:var(--mn-purple)">🔨</div>
            <h3>Leilão Reverso</h3>
            <p>Publique um pedido e receba propostas competitivas de fornecedores em minutos. O sistema ranqueia automaticamente pela melhor relação preço/prazo/reputação.</p>
          </div>
          <div class="feature-card">
            <div class="feature-card__icon" style="background:var(--mn-green-bg);color:var(--mn-green)">📊</div>
            <h3>Comparador de Propostas</h3>
            <p>Visualize todas as propostas lado a lado com preço por item, prazo de entrega e score de reputação do fornecedor. Decisão em segundos.</p>
          </div>
          <div class="feature-card">
            <div class="feature-card__icon" style="background:var(--mn-blue-bg);color:var(--mn-blue)">🗺️</div>
            <h3>Mapa em Tempo Real</h3>
            <p>Acompanhe todos os seus pedidos no mapa. Veja onde estão os fornecedores, calcule distâncias e monitore entregas em andamento.</p>
          </div>
          <div class="feature-card">
            <div class="feature-card__icon" style="background:var(--mn-yellow-bg);color:#8B6000">⭐</div>
            <h3>Sistema de Reputação</h3>
            <p>Avalie fornecedores após cada entrega. O score de reputação é atualizado automaticamente e influencia o ranqueamento nas próximas propostas.</p>
          </div>
          <div class="feature-card">
            <div class="feature-card__icon" style="background:var(--mn-teal-bg);color:var(--mn-teal)">🔔</div>
            <h3>Notificações Inteligentes</h3>
            <p>Fornecedores são notificados por e-mail, SMS ou push conforme sua área de atuação e categorias de materiais. Zero spam, máxima relevância.</p>
          </div>
          <div class="feature-card">
            <div class="feature-card__icon" style="background:var(--mn-red-bg);color:var(--mn-red)">🔗</div>
            <h3>Webhooks & API</h3>
            <p>Integre o Edifiq com seu ERP, sistema de compras ou qualquer ferramenta via webhooks e API REST. Disponível nos planos Pro e Enterprise.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── How it works ──────────────────────────────────────── -->
    <section class="lp-how" id="how">
      <div class="lp-container">
        <div class="lp-section-header">
          <span class="lp-eyebrow">Como funciona</span>
          <h2>Do pedido à entrega em 4 passos</h2>
        </div>

        <div class="how-steps">
          <div class="how-step">
            <div class="how-step__num">1</div>
            <div class="how-step__content">
              <h3>Crie o pedido</h3>
              <p>Descreva os materiais, quantidade, endereço de entrega e configure a duração do leilão.</p>
            </div>
          </div>
          <div class="how-step__arrow">→</div>
          <div class="how-step">
            <div class="how-step__num">2</div>
            <div class="how-step__content">
              <h3>Fornecedores competem</h3>
              <p>O sistema notifica automaticamente os fornecedores mais próximos e qualificados.</p>
            </div>
          </div>
          <div class="how-step__arrow">→</div>
          <div class="how-step">
            <div class="how-step__num">3</div>
            <div class="how-step__content">
              <h3>Compare e escolha</h3>
              <p>Analise as propostas no comparador e selecione a melhor oferta com um clique.</p>
            </div>
          </div>
          <div class="how-step__arrow">→</div>
          <div class="how-step">
            <div class="how-step__num">4</div>
            <div class="how-step__content">
              <h3>Acompanhe a entrega</h3>
              <p>Monitore o status da entrega em tempo real e avalie o fornecedor ao final.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Pricing ───────────────────────────────────────────── -->
    <section class="lp-pricing" id="pricing">
      <div class="lp-container">
        <div class="lp-section-header">
          <span class="lp-eyebrow">Planos</span>
          <h2>Comece grátis, escale conforme cresce</h2>
        </div>

        <div class="pricing-grid">
          <div class="pricing-card">
            <div class="pricing-card__header">
              <span class="pricing-card__name">Free</span>
              <div class="pricing-card__price"><span class="price-value">R$ 0</span><span class="price-period">/mês</span></div>
            </div>
            <ul class="pricing-card__features">
              <li>✓ 3 usuários</li>
              <li>✓ 20 fornecedores</li>
              <li>✓ 30 pedidos/mês</li>
              <li class="disabled">✗ Analytics</li>
              <li class="disabled">✗ API & Webhooks</li>
            </ul>
            <a class="lp-btn lp-btn--outline lp-btn--full" routerLink="/auth/register">Começar grátis</a>
          </div>

          <div class="pricing-card pricing-card--featured">
            <div class="pricing-card__badge">Mais popular</div>
            <div class="pricing-card__header">
              <span class="pricing-card__name">Pro</span>
              <div class="pricing-card__price"><span class="price-value">R$ 599</span><span class="price-period">/mês</span></div>
            </div>
            <ul class="pricing-card__features">
              <li>✓ 30 usuários</li>
              <li>✓ 500 fornecedores</li>
              <li>✓ 1.000 pedidos/mês</li>
              <li>✓ Analytics completo</li>
              <li>✓ API & Webhooks</li>
            </ul>
            <a class="lp-btn lp-btn--primary lp-btn--full" routerLink="/auth/register">Assinar Pro</a>
          </div>

          <div class="pricing-card">
            <div class="pricing-card__header">
              <span class="pricing-card__name">Enterprise</span>
              <div class="pricing-card__price"><span class="price-value">R$ 1.999</span><span class="price-period">/mês</span></div>
            </div>
            <ul class="pricing-card__features">
              <li>✓ Usuários ilimitados</li>
              <li>✓ Fornecedores ilimitados</li>
              <li>✓ Pedidos ilimitados</li>
              <li>✓ Analytics + BI</li>
              <li>✓ SLA dedicado</li>
            </ul>
            <a class="lp-btn lp-btn--outline lp-btn--full" routerLink="/auth/register">Falar com vendas</a>
          </div>
        </div>
      </div>
    </section>

    <!-- ── CTA Final ─────────────────────────────────────────── -->
    <section class="lp-cta">
      <div class="lp-container">
        <div class="lp-cta__inner">
          <h2>Pronto para comprar materiais com inteligência?</h2>
          <p>Junte-se a centenas de construtoras que já economizam com o Edifiq.</p>
          <div class="lp-cta__actions">
            <a class="lp-btn lp-btn--white lp-btn--lg" routerLink="/auth/register">Criar conta grátis</a>
            <a class="lp-btn lp-btn--outline-white lp-btn--lg" routerLink="/app/dashboard">Ver demo</a>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Footer ────────────────────────────────────────────── -->
    <footer class="lp-footer">
      <div class="lp-container">
        <div class="lp-footer__inner">
          <div class="lp-footer__brand">
            <div class="lp-nav__logo">
              <div class="lp-logo-mark">🏗️</div>
              <span class="lp-logo-text">Edifiq</span>
            </div>
            <p>Plataforma SaaS de leilão reverso para materiais de construção civil.</p>
          </div>
          <div class="lp-footer__links">
            <div class="footer-col">
              <span class="footer-col__title">Produto</span>
              <a href="#features">Funcionalidades</a>
              <a href="#pricing">Planos</a>
              <a href="#how">Como funciona</a>
            </div>
            <div class="footer-col">
              <span class="footer-col__title">Empresa</span>
              <a href="#">Sobre nós</a>
              <a href="#">Blog</a>
              <a href="#">Contato</a>
            </div>
            <div class="footer-col">
              <span class="footer-col__title">Legal</span>
              <a href="#">Termos de uso</a>
              <a href="#">Privacidade</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
        <div class="lp-footer__bottom">
          <span>© 2024 Edifiq. Todos os direitos reservados.</span>
        </div>
      </div>
    </footer>
  `,
  styleUrl: './landing.component.scss',
})
export class LandingComponent {}
