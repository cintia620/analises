# Radar do Cartão

Projeto web para análise de gastos de cartão com classificação por categoria, filtros e sincronização opcional com Supabase.

## Funcionalidades
- Importação de CSV (`data,descricao,valor`).
- Classificação manual por categoria para cada lançamento.
- Sugestão automática de categoria por descrição.
- Filtros por mês e por categoria.
- Indicadores: total gasto, ticket médio, maior categoria e entradas.
- Ranking de estabelecimentos com maior gasto.
- Gráficos por categoria e evolução mensal.
- Exportação de CSV já categorizado.
- Persistência local das categorias (`localStorage`).
- Sincronização opcional com Supabase.

## Rodando localmente
```bash
python3 -m http.server 4173
```
Depois abra `http://127.0.0.1:4173`.

## Conectando no Supabase
1. Crie um projeto no Supabase.
2. Rode este SQL no **SQL Editor**:

```sql
create table if not exists public.transaction_categories (
  user_id uuid not null,
  transaction_id text not null,
  category text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, transaction_id)
);
```

3. Na tela do app, preencha:
   - `Supabase URL`
   - `Supabase anon key`
   - `user_id` (UUID do usuário dono dos dados)
4. Clique em **Conectar** e depois **Sincronizar agora**.

## Subir para GitHub
Eu não consigo autenticar na sua conta automaticamente, mas deixei tudo pronto. No seu terminal, execute:

```bash
git init
git add .
git commit -m "feat: radar do cartao com supabase"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```

Se você usar GitHub CLI:
```bash
gh auth login
gh repo create SEU_REPO --public --source=. --remote=origin --push
```
