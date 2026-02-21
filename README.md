# Análise de Gastos no Cartão

Aplicativo web estático para apoiar uma análise mais profunda dos gastos de cartão de crédito.

## O que o app faz

- Importa uma fatura simples em CSV (`data,descricao,valor`).
- Permite classificar cada compra por área (alimentação, transporte, lazer etc.).
- Calcula insights principais (total gasto, maior área e quantidade de lançamentos).
- Exibe gráficos de distribuição por categoria e por mês.

## Como usar

1. Abra o arquivo `index.html` no navegador.
2. Clique em **Carregar exemplo** para ver uma demonstração rápida, ou importe seu CSV.
3. Ajuste a área de cada gasto na tabela.
4. Veja os insights e gráficos sendo atualizados automaticamente.

## Próximos passos sugeridos

- Salvar categorias em `localStorage` para não perder classificações.
- Permitir importar extratos de múltiplos bancos com mapeamento de colunas.
- Adicionar metas por categoria e alertas de estouro.
