# FinanCartão

Projeto inicial de um aplicativo para análise aprofundada de gastos no cartão de crédito.

## Status do projeto

Base pronta para evoluir com foco em:
- classificação de gastos por área;
- visão consolidada por mês e por categoria;
- persistência local para não perder o trabalho.

## Funcionalidades atuais

- Cadastro manual de lançamento (data, descrição, valor e área).
- Importação de CSV no formato `data,descricao,valor,categoria` (categoria opcional).
- Sugestão automática de categoria por descrição quando a categoria não vier no CSV.
- Edição de categoria por linha e exclusão de lançamentos.
- Filtro rápido por descrição/categoria.
- KPIs de análise: total gasto, quantidade, ticket médio e mês com maior gasto.
- Barras comparativas de gasto por categoria.
- Salvamento em `localStorage`.

## Como rodar

Como é um projeto estático, basta abrir `index.html` no navegador.

Se preferir servidor local:

```bash
python3 -m http.server 4173
```

Depois acesse `http://127.0.0.1:4173`.

## Próximos passos

- Adicionar autenticação e sincronização em nuvem.
- Criar metas por categoria com alertas.
- Incluir upload de OFX/PDF com parser dedicado.
