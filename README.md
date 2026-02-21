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

## Rodar no Windows (sem terminal)
Como o projeto é estático, você pode abrir o `index.html` com duplo clique.

Se o navegador bloquear algo, use uma opção sem terminal:
- **VS Code + extensão Live Server** (botão "Go Live").
- **Python Launcher no Windows** (opcional): `py -m http.server 4173` no PowerShell.

## Conectando no Supabase (sem terminal)
1. Crie um projeto no Supabase.
2. Vá em **SQL Editor** e execute:

```sql
create table if not exists public.transaction_categories (
  user_id uuid not null,
  transaction_id text not null,
  category text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, transaction_id)
);
```

3. Vá em **Project Settings > API** e copie:
   - `Project URL`
   - `anon public key`
4. No app, preencha:
   - `Supabase URL`
   - `Supabase anon key`
   - `user_id` (UUID do usuário)
5. Clique em **Conectar** e depois em **Sincronizar agora**.

## Subir para GitHub no Windows (sem terminal)
### Opção 1 — GitHub Desktop (recomendado)
1. Instale e abra o **GitHub Desktop**.
2. Clique em **Add an Existing Repository from your Hard Drive** e selecione esta pasta.
3. Faça o primeiro commit pela interface.
4. Clique em **Publish repository**.
5. Marque público/privado e confirme.

### Opção 2 — Pelo site do GitHub
1. Crie um repositório novo no site do GitHub.
2. Clique em **uploading an existing file**.
3. Arraste os arquivos (`index.html`, `styles.css`, `app.js`, `README.md`).
4. Confirme com **Commit changes**.

> Se quiser, no próximo passo eu te guio com cliques tela a tela (GitHub Desktop + Supabase).
