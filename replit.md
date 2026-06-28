# GOAT-PAY

Plataforma premium brasileira de pagamentos digitais e sistema operacional de negócios. Permite criadores venderem produtos digitais, gerenciarem afiliados, saques e métricas de vendas.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server (porta 5000)
- `pnpm --filter @workspace/goat-pay run dev` — Frontend React/Vite
- `pnpm run typecheck` — typecheck completo
- `pnpm run build` — build de todos os pacotes
- `pnpm --filter @workspace/api-spec run codegen` — regenerar hooks e schemas do OpenAPI
- `pnpm --filter @workspace/db run push` — push do schema para o DB (dev only)
- Env necessário: `DATABASE_URL` — connection string Postgres

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validação: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (do OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + TailwindCSS v4

## Where things live

- `artifacts/goat-pay/` — frontend React/Vite (GOAT-PAY app)
  - `src/contexts/ThemeContext.tsx` — dark/light theme provider + hook
  - `src/index.css` — sistema de tema dual com CSS variables
  - `src/components/layout/AppLayout.tsx` — sidebar + topbar completos
  - `src/pages/login.tsx` — login premium (login/cadastro/forgot/verify/2FA)
  - `src/pages/dashboard.tsx` — dashboard limpo com KPIs e gráficos
  - `src/pages/products.tsx` — gestão de produtos
  - `src/pages/sales.tsx` — pedidos e vendas
  - `src/pages/wallet.tsx` — carteira e extrato
  - `src/pages/withdrawals.tsx` — saques
  - `src/pages/affiliates.tsx` — afiliados
  - `src/pages/settings.tsx` — configurações com tabs
- `artifacts/api-server/` — backend Express
- `lib/api-client-react/` — hooks React Query gerados pelo Orval
- `lib/api-spec/` — especificação OpenAPI

## Architecture decisions

- **Tema dual via CSS variables**: `.dark` e `.light` no `<html>`, todas as cores via `var(--neon)`, `var(--text-primary)`, etc. Toggle instantâneo sem re-render da árvore.
- **Identidade exclusiva GOAT-PAY**: nenhuma referência a Hotmart, EscalePay, Cakto, Kiwify ou Eduzz em qualquer parte do sistema.
- **Responsividade mobile-first**: sidebar fixa no desktop (240px), slide overlay no mobile com hamburger button.
- **Watermark discreta**: logo GOAT-PAY com `position: fixed`, `opacity: 0.025` no dark / `0.04` no light, no canto inferior direito.
- **Neon verde dual**: `#00e676` no dark mode, `#00a84f` no light mode — variável `neon` em todos os componentes.

## Product

- Login premium com todos os modos (login, cadastro, recuperação, verificação email, 2FA) + social auth (Google, Apple, Facebook)
- Dashboard com 5 KPIs, gráfico de receita (Recharts), fontes de tráfego (SVG donut), localização, dispositivos, top produtos, carteira
- Sidebar com 4 grupos: Principal / Crescimento / Financeiro / Sistema (17 itens no total)
- Topbar com: pesquisa, "Criar Produto", toggle tema, idioma, notificações com dropdown, perfil com dropdown
- Gestão completa: Produtos, Pedidos, Carteira, Saques, Afiliados, Configurações

## User preferences

- Identidade exclusiva GOAT-PAY — NUNCA usar logos/nomes de Hotmart, EscalePay, Cakto, Kiwify, Eduzz
- Interfaces minimalistas — nunca poluir telas com excesso de informação
- Dark/Light mode obrigatório com troca instantânea
- 100% responsivo: mobile, tablet, desktop, TV, ultrawide
- Marca d'água do logo GOAT discreta em todas as páginas

## Gotchas

- CSS classes: usar `gp-card` (não `glow-card`), `gp-btn` (não `glow-btn`)
- Tema: acessar via `useTheme()` de `@/contexts/ThemeContext`
- neon color: `isDark ? "#00e676" : "#00a84f"` pattern em todos os componentes
- API types: `Sale.customerName` (não `buyerName`), `Affiliate.totalSales` (não `sales`), `AffiliateStats.totalCommissionPaid` (não `totalCommissions`)
- `WithdrawalInput` requer campo `pixKey: string` obrigatório

## Pointers

- Ver skill `pnpm-workspace` para estrutura do workspace, setup TypeScript e detalhes dos pacotes
