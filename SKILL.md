---
name: edifiq-design-system
description: >
  Design system e guia de desenvolvimento front-end para a plataforma Edifiq — 
  plataforma SaaS de leilão reverso de materiais de construção. Use esta skill 
  SEMPRE que for criar, modificar ou revisar qualquer tela, componente, página 
  ou elemento visual da plataforma Edifiq. Isso inclui: dashboards, listagens de 
  pedidos, telas de proposta, painéis de fornecedor, formulários de criação de 
  pedido, comparação de ofertas, tela de seleção de proposta, acompanhamento de 
  entrega, avaliações, autenticação, onboarding de tenant, configurações de conta 
  e qualquer outro elemento de UI/UX do produto. Também use ao criar protótipos, 
  apresentações visuais ou artefatos interativos relacionados ao Edifiq.
---

# Edifiq — Design System & Frontend Guide

## 🧠 Contexto do Produto

O **Edifiq** é uma plataforma SaaS B2B de **leilão reverso de materiais de construção**.

**Quem usa:**
- **Compradores** — engenheiros, mestres de obra, construtoras que precisam de materiais
- **Fornecedores** — depósitos e lojas de materiais que competem para atender pedidos
- **Admins de tenant** — gestores que controlam equipe, fornecedores e relatórios

**Fluxo central:**
1. Comprador cria um pedido (ex: "20 sacos de cimento — urgente")
2. Sistema distribui para fornecedores compatíveis via SQS/SNS
3. Fornecedores enviam propostas com preço e prazo
4. Sistema ranqueia e exibe as melhores opções
5. Comprador escolhe → fornecedor confirmado → entrega iniciada

**Modelo de negócio:** Multi-tenant SaaS com planos (free → starter → pro → enterprise).

---

## 🎨 Identidade Visual

### Direção Estética

**Industrial refinado com urgência controlada.** A construção civil é um setor de decisões rápidas, materiais pesados e confiança. O design deve comunicar:
- **Solidez e confiança** — tipografia firme, hierarquia clara
- **Urgência sem ansiedade** — cores que agilizam sem estressar
- **Precisão operacional** — dados limpos, tabelas legíveis, status visíveis

Evitar: visual genérico de SaaS (roxo + branco + Inter), ou estética "obra suja". O ponto certo é entre um **ERP moderno** e um **marketplace premium**.

### Paleta de Cores

```css
/* Tokens de cor — use SEMPRE via variáveis CSS */
:root {
  /* Primárias */
  --color-primary:        #E8521A;  /* Laranja construção — CTAs, ações principais */
  --color-primary-dark:   #C4400E;  /* Hover/active de primário */
  --color-primary-light:  #FDF0EA;  /* Backgrounds de destaque suave */

  /* Neutros (base da UI) */
  --color-surface:        #FAFAF8;  /* Background de página */
  --color-surface-alt:    #F3F2EF;  /* Cards, painéis secundários */
  --color-border:         #E2E0DA;  /* Divisores, inputs */
  --color-border-strong:  #C8C5BC;  /* Bordas com ênfase */

  /* Texto */
  --color-text-primary:   #1C1A17;  /* Corpo, títulos */
  --color-text-secondary: #6B6760;  /* Labels, meta-info */
  --color-text-muted:     #A09D97;  /* Placeholders, desabilitados */
  --color-text-inverse:   #FAFAF8;  /* Texto sobre fundos escuros */

  /* Semânticas */
  --color-success:        #2D7D46;  /* Proposta aceita, entregue */
  --color-success-bg:     #EBF5EE;
  --color-warning:        #A35C00;  /* Urgente, expirando */
  --color-warning-bg:     #FEF3E2;
  --color-danger:         #C0392B;  /* Cancelado, erro, recusado */
  --color-danger-bg:      #FDEDEC;
  --color-info:           #1A6B9E;  /* Em andamento, informativo */
  --color-info-bg:        #EAF4FB;

  /* Leilão / Status de pedido */
  --color-auction-live:   #E8521A;  /* Leilão ativo */
  --color-auction-ended:  #6B6760;  /* Leilão encerrado */
  --color-urgent-badge:   #C0392B;  /* Badge "URGENTE" */
}
```

### Tipografia

```css
/* Fontes — importar via Google Fonts */
/* Display/Títulos: Sora — geométrica, firme, moderna */
/* Corpo: DM Sans — neutro, altamente legível */
/* Mono/Dados: JetBrains Mono — tabelas, preços, códigos */

@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --font-display: 'Sora', sans-serif;
  --font-body:    'DM Sans', sans-serif;
  --font-mono:    'JetBrains Mono', monospace;

  /* Escala tipográfica */
  --text-xs:   0.75rem;   /* 12px — badges, labels */
  --text-sm:   0.875rem;  /* 14px — meta, helper text */
  --text-base: 1rem;      /* 16px — corpo */
  --text-lg:   1.125rem;  /* 18px — subtítulos */
  --text-xl:   1.25rem;   /* 20px — títulos de seção */
  --text-2xl:  1.5rem;    /* 24px — títulos de página */
  --text-3xl:  1.875rem;  /* 30px — headings principais */
  --text-4xl:  2.25rem;   /* 36px — hero/dashboard */
}
```

### Espaçamento e Grid

```css
:root {
  /* Espaçamento base: múltiplos de 4px */
  --space-1:  0.25rem;   /*  4px */
  --space-2:  0.5rem;    /*  8px */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px */
  --space-5:  1.25rem;   /* 20px */
  --space-6:  1.5rem;    /* 24px */
  --space-8:  2rem;      /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Sombras */
  --shadow-sm:  0 1px 3px rgba(28,26,23,0.08);
  --shadow-md:  0 4px 12px rgba(28,26,23,0.10);
  --shadow-lg:  0 8px 24px rgba(28,26,23,0.12);
  --shadow-xl:  0 16px 40px rgba(28,26,23,0.14);
}
```

---

## 🧩 Componentes Core

Veja referências detalhadas em:
- `references/components.md` — todos os componentes com código
- `references/screens.md` — layouts de tela por fluxo
- `references/status-system.md` — sistema de status e badges

### Status de Pedido (`orders.status`)

| Status        | Label            | Cor              | Ícone sugerido |
|---------------|------------------|------------------|----------------|
| `draft`       | Rascunho         | `--color-muted`  | pencil         |
| `open`        | Aberto           | `--color-info`   | clock          |
| `in_auction`  | Em Leilão 🔴     | `--color-auction-live` | gavel   |
| `selected`    | Proposta Escolhida | `--color-warning` | check-circle |
| `confirmed`   | Confirmado       | `--color-success`| shield-check   |
| `cancelled`   | Cancelado        | `--color-danger` | x-circle       |
| `expired`     | Expirado         | `--color-muted`  | clock-x        |

### Status de Proposta (`proposals.status`)

| Status      | Label       | Cor              |
|-------------|-------------|------------------|
| `pending`   | Aguardando  | `--color-info`   |
| `submitted` | Enviada     | `--color-warning`|
| `accepted`  | Aceita ✓    | `--color-success`|
| `rejected`  | Recusada    | `--color-danger` |
| `expired`   | Expirada    | `--color-muted`  |
| `withdrawn` | Retirada    | `--color-muted`  |

### Componente Badge de Urgência

Pedidos com `is_urgent = 1` devem exibir badge visível:
```html
<span class="badge-urgent">URGENTE</span>
```
```css
.badge-urgent {
  background: var(--color-urgent-badge);
  color: white;
  font-family: var(--font-display);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  animation: pulse-urgent 2s infinite;
}
@keyframes pulse-urgent {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

### Timer de Leilão

Pedidos `in_auction` com `expires_at` devem exibir contador regressivo:
```css
.auction-timer {
  font-family: var(--font-mono);
  font-size: var(--text-lg);
  font-weight: 500;
  color: var(--color-auction-live);
  background: var(--color-primary-light);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-primary);
}
/* Quando < 10min restantes */
.auction-timer.ending-soon {
  color: var(--color-danger);
  background: var(--color-danger-bg);
  border-color: var(--color-danger);
  animation: pulse-urgent 1s infinite;
}
```

### Reputation Score

Score de reputação do fornecedor (`reputation_score` 0–5):
```html
<div class="reputation">
  <span class="reputation-stars">★★★★☆</span>
  <span class="reputation-value">4.3</span>
  <span class="reputation-count">(127 avaliações)</span>
</div>
```
- 4.5–5.0 → verde (`--color-success`)
- 3.0–4.4 → laranja (`--color-warning`)
- 0–2.9  → vermelho (`--color-danger`)

---

## 📐 Layouts de Tela

Para detalhes de cada tela, consulte `references/screens.md`.

### Estrutura Global

```
┌─────────────────────────────────────────────┐
│  Sidebar (240px fixed)  │  Main Content      │
│                         │                    │
│  Logo Edifiq            │  Topbar            │
│  ─────────────          │  ─────────────     │
│  Nav links              │  Page content      │
│                         │                    │
│  [Plano atual]          │                    │
│  [Usuário]              │                    │
└─────────────────────────────────────────────┘
```

### Telas principais:

1. **Dashboard** — métricas, pedidos recentes, atividade de leilão
2. **Lista de Pedidos** — filtros por status, urgência, data
3. **Criar Pedido** — formulário multi-step (itens → entrega → configuração)
4. **Detalhe do Pedido** — timeline, propostas ranqueadas, timer
5. **Comparar Propostas** — tabela lado a lado (preço, prazo, reputação)
6. **Painel do Fornecedor** — propostas pendentes, histórico, reputação
7. **Acompanhar Entrega** — status, tracking, proof
8. **Configurações** — usuários, roles, fornecedores, webhooks, plano

---

## ⚙️ Padrões de Desenvolvimento

### Stack recomendada

- **Framework:** React (Next.js) ou Vue 3
- **Styling:** CSS Modules ou Tailwind com CSS variables sobrescritas
- **Componentes base:** Shadcn/ui ou Radix UI (acessibilidade pronta)
- **Ícones:** Lucide React
- **Tabelas de dados:** TanStack Table
- **Gráficos:** Recharts
- **Tempo real:** Socket.io ou SSE para atualizações de proposta
- **Forms:** React Hook Form + Zod

### Princípios de implementação

**1. Multi-tenant first**
Toda UI deve considerar que os dados são isolados por `tenant_id`. O usuário logado sempre pertence a um tenant. Breadcrumbs e contexto devem deixar claro o escopo.

**2. Estados de carregamento**
Toda lista, tabela ou card com dados assíncronos deve ter:
- Loading skeleton (não spinner genérico)
- Empty state descritivo (o que fazer quando vazio)
- Error state com ação de retry

**3. Tempo real no leilão**
Telas com leilão ativo (`in_auction`) devem atualizar propostas sem refresh. Use polling de 5s como fallback ou WebSocket/SSE.

**4. Responsividade**
- Desktop first (produto B2B)
- Breakpoints: `md: 768px`, `lg: 1024px`, `xl: 1280px`
- Sidebar colapsa em mobile via drawer

**5. Acessibilidade**
- Contraste mínimo WCAG AA
- Todos os CTAs com `aria-label` descritivo
- Tabelas com `scope` nos headers
- Focus visible em todos os elementos interativos

### Convenções de código

```tsx
// Nomenclatura de componentes
OrderStatusBadge       // componente
useOrderProposals      // hook
formatCurrency         // util
ORDER_STATUS           // constante enum

// Formatação de dados
// Preço: sempre R$ com 2 casas
const price = new Intl.NumberFormat(' ', {
  style: 'currency',
  currency: 'BRL'
}).format(value);

// Data: dd/mm/yyyy HH:mm
const date = new Intl.DateTimeFormat(' ', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit'
}).format(new Date(value));
```

---

## 🔑 Entidades e Campos-Chave

Baseado no schema `V1__schema.sql`:

| Entidade | Campos críticos para UI |
|----------|------------------------|
| `orders` | `status`, `is_urgent`, `expires_at`, `auction_duration_min`, `reference_code` |
| `proposals` | `status`, `total_price`, `delivery_min`, `submitted_at` |
| `suppliers` | `reputation_score`, `total_ratings`, `total_deliveries`, `response_sla_min` |
| `order_items` | `description`, `quantity`, `unit`, `category_id` |
| `deliveries` | `status`, `tracking_code`, `scheduled_at`, `delivered_at` |
| `ratings` | `score` (1–5), `comment`, `response` |

### Planos e limites (para UI de plano/upgrade)
| Plano      | Preço       | Usuários | Fornecedores | Pedidos/mês |
|------------|-------------|----------|--------------|-------------|
| Free       | Grátis      | 3        | 20           | 30          |
| Starter    | R$ 199,90   | 10       | 100          | 200         |
| Pro        | R$ 599,90   | 30       | 500          | 1.000       |
| Enterprise | R$ 1.999,90 | ilimitado| ilimitado    | ilimitado   |

---

## 📋 Checklist por Componente

Antes de entregar qualquer componente, verificar:

- [ ] Usa variáveis CSS do design system (não valores hardcoded)
- [ ] Tem estado de loading com skeleton
- [ ] Tem empty state com mensagem útil
- [ ] Tem tratamento de erro
- [ ] Textos em  
- [ ] Preços formatados como R$
- [ ] Datas no formato brasileiro
- [ ] Responsivo em mobile (mínimo 360px)
- [ ] Acessível (contraste, aria, focus)
- [ ] Status badges usando as cores semânticas corretas

---

## 📚 Referências

- `references/components.md` — Código completo dos componentes UI
- `references/screens.md` — Wireframes e layouts de cada tela
- `references/status-system.md` — Sistema completo de status e transições
