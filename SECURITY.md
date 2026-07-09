# Segurança — Sua Vaga IA

Este documento registra o modelo de segurança da plataforma e a auditoria
realizada em **2026-07-09**. Serve de referência para futuras mudanças.

> Escopo do produto: app em `app.suavagaia.com.br` (este repositório) + backend
> Supabase (projeto `lxteajwzovoeclbytdrp`) com Postgres/RLS e Edge Functions.
> A landing page (`suavagaia.com.br`) vive em repositório separado, sem acesso a
> service-role/Stripe.

---

## Modelo de segurança (princípios)

- **O frontend é cosmético para segurança.** Guardas de rota, checagens de
  `role`/plano e limites no cliente melhoram a UX, mas **não** protegem dados. A
  chave `anon` é pública; qualquer usuário pode chamar o PostgREST/Edge direto.
- **A autorização real é servidor:** RLS do Postgres + validações nas Edge
  Functions (`execute-prompt`, `stripe-webhook`, etc.).
- **Entitlement é controlado só pelo servidor.** Colunas de assinatura/plano/saldo
  **nunca** devem ser escritas pelo cliente — apenas por `stripe-webhook` e
  `execute-prompt` (service-role) ou por admin.
- **Admin exige 2FA.** Privilégio de admin (`has_role('admin')`) só é concedido a
  sessões com nível de autenticação **AAL2** (segundo fator verificado).

---

## Auditoria 2026-07-09 — resultado

Legenda: 🔴 Crítico · 🟠 Alto · 🟡 Médio · 🔵 Baixo

### Corrigido e verificado

| # | Sev. | Problema | Correção |
|---|------|----------|----------|
| 1 | 🔴 | Usuário autenticado podia **editar as próprias colunas de cobrança** (`users.subscription_tier`, `stripe_subscription_status`, `contest_id`) e o **próprio saldo** (`user_token_balances`), forjando assinatura ativa, tokens ilimitados e furando a trava de concurso. O `execute-prompt` confiava nessas colunas. | Migração `harden_entitlement_write_access` |
| 3 | 🟠 | Função `increment_first_week_cost_brl` executável por `anon`/`authenticated`, sem checagem, com parâmetros livres (inclusive `delta` negativo). | idem migração acima (`REVOKE EXECUTE`) |
| 2 | 🟠 | 2FA **decorativo**: após senha, a sessão (AAL1) já era autorizada; nem rotas, nem RLS, nem Edge checavam AAL2. | Migração `require_aal2_for_admin_has_role` |
| — | 🟡 | **XSS** no "Imprimir/Baixar PDF" do chat: `m.role` entrava sem escape em HTML aberto via `document.write` na mesma origem. | PR #3 (whitelist de `m.role` + escape de aspas em `escHtml`) |
| 7a | 🔵 | Telas admin liam o token só de `sessionStorage` → quebravam no app nativo (token em `localStorage`). | PR #4 |
| 7b | 🔵 | `system_prompts` sem policy de escrita → edição de prompts pela UI admin era bloqueada silenciosamente pelo RLS. | Migração `system_prompts_admin_write_policy` |

### Avaliado e mantido (com justificativa)

| Item | Decisão |
|------|---------|
| Catálogo (nomes de concursos/agentes) enumerável por usuário de 1 concurso | **Deixar público.** É só metadado; com o item 1 corrigido, não há uso fora do plano (o `execute-prompt` bloqueia via `PLAN_CONTEST_FORBIDDEN`). |
| Gating de usuário grátis no cliente | **Resolvido pelo item 1**: o `execute-prompt` deixou de confiar em coluna forjável. |
| View `user_monthly_cost` (`SECURITY DEFINER`, advisor ERROR) | **Segura hoje** (só admin lê; `anon` sem grant). Migrar para `security_invoker` é opcional e arriscava o dashboard. |
| Funções `SECURITY DEFINER` no advisor (`has_role`, `get_my_role`, `agent_in_contest`, `set_user_role`) | **Seguras** (leitura ou com checagem interna de admin). `has_role` precisa continuar executável por `authenticated` — as Edge Functions o chamam via RPC. |
| Extensão `unaccent` no schema `public` | Cosmético, risco desprezível. |
| Proteção contra senha vazada (HaveIBeenPwned) desligada + força de senha só no cliente | Fora do escopo desta rodada (decisão do time). Recomenda-se ativar no painel Auth. |

### Confirmado OK

- **Nenhum segredo no frontend** (`service_role`, chaves Stripe/OpenAI, `whsec`):
  apenas URL do Supabase e a chave **anon** (pública por design).
- `react-markdown` sem `rehype-raw` → HTML de mensagens vira texto (sem XSS).
- Redirects de checkout usam apenas URLs vindas do próprio backend.
- Mutações de admin (papéis, agentes, áreas, concursos, matérias) protegidas por
  RLS admin-only; `set_user_role` tem checagem interna de admin.

---

## Migrações aplicadas

1. **`harden_entitlement_write_access`**
   - `users`: `authenticated` só pode `UPDATE (full_name)`; colunas de cobrança
     revogadas.
   - `user_token_balances`: escrita só para admin/service-role.
   - `increment_first_week_cost_brl`: `REVOKE EXECUTE` de `anon`/`authenticated`.
2. **`require_aal2_for_admin_has_role`**
   - `has_role(_user_id, 'admin')` passa a exigir AAL2 **apenas** para sessões de
     usuário (`authenticated`). `service_role`/`anon`/contextos internos e papéis
     não-admin permanecem inalterados (não quebra Edge/webhook).
3. **`system_prompts_admin_write_policy`**
   - Policy de escrita admin-only (com AAL2 via `has_role`) + revoga escrita de `anon`.

---

## Regras para novas alterações

- **Nunca** dê `GRANT`/policy de escrita de colunas de assinatura/plano/saldo a
  `authenticated`/`anon`. Entitlement só muda via `stripe-webhook`/`execute-prompt`
  (service-role) ou admin.
- Ao criar RPC/função `SECURITY DEFINER`, avalie `REVOKE EXECUTE` de `anon`/
  `authenticated` se não for para uso público, e cheque o chamador dentro da função.
- Ao adicionar tabela nova: habilite RLS e crie policies explícitas (o default é
  negar). Rode o advisor de segurança após mudanças de schema.
- Enforcement de admin deve passar por `has_role('admin')` (que já garante AAL2).

## Recomendações em aberto (painel Supabase)

- Ativar **Leaked Password Protection** e política de força de senha.
- Considerar **exigir MFA** no projeto para novos admins.
