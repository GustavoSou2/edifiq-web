# Edifiq — Componentes UI

## Componentes Base

### Button

```tsx
// Variantes: primary | secondary | ghost | danger
// Tamanhos: sm | md | lg

// Primary — CTA principal (laranja)
<button class="btn btn-primary">Criar Pedido</button>

// Secondary — ações secundárias
<button class="btn btn-secondary">Cancelar</button>

// Danger — ações destrutivas
<button class="btn btn-danger">Excluir</button>
```

```css
.btn {
  font-family: var(--font-body);
  font-weight: 600;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}
.btn-primary {
  background: var(--color-primary);
  color: white;
  padding: var(--space-3) var(--space-6);
}
.btn-primary:hover { background: var(--color-primary-dark); }
.btn-secondary {
  background: transparent;
  color: var(--color-text-primary);
  border: 1.5px solid var(--color-border-strong);
  padding: var(--space-3) var(--space-6);
}
.btn-danger {
  background: var(--color-danger);
  color: white;
  padding: var(--space-3) var(--space-6);
}
```

---

### Card de Pedido (OrderCard)

Usado na listagem de pedidos e no dashboard.

```tsx
interface OrderCardProps {
  order: {
    reference_code: string;
    status: OrderStatus;
    is_urgent: boolean;
    expires_at: string | null;
    items: OrderItem[];
    delivery_city: string;
    created_at: string;
  };
  proposalCount?: number;
}
```

```html
<div class="order-card">
  <div class="order-card__header">
    <span class="order-ref">#EDQ-2024-0042</span>
    <div class="order-card__badges">
      <!-- Se is_urgent -->
      <span class="badge-urgent">URGENTE</span>
      <span class="badge-status badge-status--in_auction">Em Leilão</span>
    </div>
  </div>

  <div class="order-card__items">
    <p class="order-item-summary">20x Saco de Cimento CP-II, 50 sacos de areia…</p>
  </div>

  <div class="order-card__footer">
    <span class="order-city">📍 Indaiatuba, SP</span>
    <span class="order-proposals">3 propostas</span>
    <!-- Timer se in_auction -->
    <div class="auction-timer">⏱ 42:15</div>
  </div>
</div>
```

```css
.order-card {
  background: white;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  transition: box-shadow 0.2s, border-color 0.2s;
}
.order-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}
/* Destaque para urgente */
.order-card.urgent {
  border-left: 4px solid var(--color-urgent-badge);
}
.order-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}
.order-ref {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}
```

---

### Card de Proposta (ProposalCard)

Usado na tela de comparação de propostas.

```html
<div class="proposal-card proposal-card--best">
  <!-- Badge de melhor oferta -->
  <div class="proposal-best-badge">⭐ Melhor Oferta</div>

  <div class="proposal-supplier">
    <div class="supplier-name">Depósito Central Ltda</div>
    <div class="supplier-reputation">
      <span class="rep-stars">★★★★★</span>
      <span class="rep-score">4.8</span>
      <span class="rep-count">(203)</span>
    </div>
  </div>

  <div class="proposal-metrics">
    <div class="metric">
      <span class="metric-label">Preço Total</span>
      <span class="metric-value metric-value--price">R$ 1.250,00</span>
    </div>
    <div class="metric">
      <span class="metric-label">Prazo de Entrega</span>
      <span class="metric-value">2 horas</span>
    </div>
  </div>

  <button class="btn btn-primary" style="width: 100%">
    Escolher Esta Proposta
  </button>
</div>
```

```css
.proposal-card {
  background: white;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  position: relative;
}
.proposal-card--best {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}
.proposal-best-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-primary);
  color: white;
  font-size: var(--text-xs);
  font-weight: 700;
  padding: 3px 12px;
  border-radius: var(--radius-full);
}
.metric-value--price {
  font-family: var(--font-mono);
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text-primary);
}
```

---

### Tabela de Propostas (ProposalTable)

Para comparação lado a lado no detalhe do pedido:

```html
<table class="proposals-table">
  <thead>
    <tr>
      <th>Fornecedor</th>
      <th>Reputação</th>
      <th>Preço Total</th>
      <th>Prazo</th>
      <th>Status</th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr class="proposal-row proposal-row--best">
      <td class="supplier-cell">Depósito Central</td>
      <td><span class="rep-score rep-score--high">4.8 ★</span></td>
      <td class="price-cell">R$ 1.250,00</td>
      <td>2h</td>
      <td><span class="badge-status badge-status--submitted">Enviada</span></td>
      <td><button class="btn btn-primary btn-sm">Escolher</button></td>
    </tr>
  </tbody>
</table>
```

```css
.proposals-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-body);
}
.proposals-table th {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  text-align: left;
  padding: var(--space-3) var(--space-4);
  border-bottom: 2px solid var(--color-border);
}
.proposals-table td {
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--text-base);
}
.proposal-row--best td {
  background: var(--color-primary-light);
}
.price-cell {
  font-family: var(--font-mono);
  font-weight: 600;
}
.rep-score--high { color: var(--color-success); }
.rep-score--mid  { color: var(--color-warning); }
.rep-score--low  { color: var(--color-danger); }
```

---

### Status Badge

```tsx
// Uso: <StatusBadge status="in_auction" />

const STATUS_MAP = {
  draft:       { label: 'Rascunho',         className: 'badge--muted' },
  open:        { label: 'Aberto',            className: 'badge--info' },
  in_auction:  { label: 'Em Leilão',         className: 'badge--auction' },
  selected:    { label: 'Proposta Escolhida',className: 'badge--warning' },
  confirmed:   { label: 'Confirmado',        className: 'badge--success' },
  cancelled:   { label: 'Cancelado',         className: 'badge--danger' },
  expired:     { label: 'Expirado',          className: 'badge--muted' },
};
```

```css
.badge-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  white-space: nowrap;
}
.badge--info    { background: var(--color-info-bg);    color: var(--color-info); }
.badge--success { background: var(--color-success-bg); color: var(--color-success); }
.badge--warning { background: var(--color-warning-bg); color: var(--color-warning); }
.badge--danger  { background: var(--color-danger-bg);  color: var(--color-danger); }
.badge--muted   { background: var(--color-surface-alt);color: var(--color-text-secondary); }
.badge--auction {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  animation: pulse-urgent 2s infinite;
}
```

---

### Skeleton Loader

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface-alt) 25%,
    var(--color-border) 50%,
    var(--color-surface-alt) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Uso */
.skeleton-text { height: 16px; width: 60%; }
.skeleton-card { height: 120px; width: 100%; }
```

---

### Empty State

```html
<div class="empty-state">
  <div class="empty-state__icon">📦</div>
  <h3 class="empty-state__title">Nenhum pedido ainda</h3>
  <p class="empty-state__desc">
    Crie seu primeiro pedido e receba propostas de fornecedores em minutos.
  </p>
  <button class="btn btn-primary">Criar Pedido</button>
</div>
```

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-16) var(--space-8);
  text-align: center;
}
.empty-state__icon { font-size: 3rem; }
.empty-state__title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  color: var(--color-text-primary);
}
.empty-state__desc {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  max-width: 320px;
}
```

---

### Sidebar de Navegação

```html
<aside class="sidebar">
  <div class="sidebar__logo">
    <span class="logo-mark">⬛</span>
    <span class="logo-text">Edifiq</span>
  </div>

  <nav class="sidebar__nav">
    <a class="nav-item nav-item--active" href="/dashboard">
      📊 Dashboard
    </a>
    <a class="nav-item" href="/orders">
      📋 Pedidos
    </a>
    <a class="nav-item" href="/suppliers">
      🏭 Fornecedores
    </a>
    <a class="nav-item" href="/deliveries">
      🚛 Entregas
    </a>
    <a class="nav-item" href="/settings">
      ⚙️ Configurações
    </a>
  </nav>

  <div class="sidebar__footer">
    <div class="plan-badge">Plano Pro</div>
    <div class="user-info">
      <span class="user-avatar">JM</span>
      <span class="user-name">João Melo</span>
    </div>
  </div>
</aside>
```

```css
.sidebar {
  width: 240px;
  min-height: 100vh;
  background: var(--color-text-primary);
  display: flex;
  flex-direction: column;
  padding: var(--space-6);
  gap: var(--space-8);
  position: fixed;
  left: 0; top: 0;
}
.sidebar__logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.logo-text {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 800;
  color: white;
  letter-spacing: -0.02em;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: var(--text-sm);
  font-weight: 500;
  transition: all 0.15s;
}
.nav-item:hover {
  background: rgba(255,255,255,0.08);
  color: white;
}
.nav-item--active {
  background: var(--color-primary);
  color: white;
}
.plan-badge {
  background: rgba(232,82,26,0.2);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  font-size: var(--text-xs);
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  text-align: center;
}
```

---

### Formulário Multi-Step (Criar Pedido)

```html
<!-- Step indicator -->
<div class="step-indicator">
  <div class="step step--done">
    <div class="step-circle">✓</div>
    <span class="step-label">Itens</span>
  </div>
  <div class="step-line step-line--done"></div>
  <div class="step step--active">
    <div class="step-circle">2</div>
    <span class="step-label">Entrega</span>
  </div>
  <div class="step-line"></div>
  <div class="step">
    <div class="step-circle">3</div>
    <span class="step-label">Configurar</span>
  </div>
</div>
```

```css
.step-indicator {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: var(--space-8);
}
.step { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); }
.step-circle {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: var(--color-surface-alt);
  color: var(--color-text-secondary);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: var(--text-sm);
  border: 2px solid var(--color-border);
}
.step--active .step-circle {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}
.step--done .step-circle {
  background: var(--color-success);
  color: white;
  border-color: var(--color-success);
}
.step-line {
  flex: 1;
  height: 2px;
  background: var(--color-border);
}
.step-line--done { background: var(--color-success); }
```
