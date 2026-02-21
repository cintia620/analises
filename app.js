const categories = [
  'Moradia',
  'Alimentação',
  'Transporte',
  'Saúde',
  'Educação',
  'Lazer',
  'Compras',
  'Assinaturas',
  'Outros'
];

const csvInput = document.getElementById('csvInput');
const loadSampleBtn = document.getElementById('loadSampleBtn');
const transactionsPanel = document.getElementById('transactionsPanel');
const insightsPanel = document.getElementById('insightsPanel');
const transactionsBody = document.getElementById('transactionsBody');
const insightsCards = document.getElementById('insightsCards');

let transactions = [];
let categoryChart;
let monthlyChart;

csvInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const text = await file.text();
  transactions = parseCsv(text);
  initializeCategories();
  renderAll();
});

loadSampleBtn.addEventListener('click', () => {
  const sampleCsv = `data,descricao,valor
2026-01-02,Supermercado Central,-320.89
2026-01-03,Uber,-24.90
2026-01-05,Netflix,-39.90
2026-01-06,Farmácia Vida,-82.50
2026-02-01,Aluguel,-1800.00
2026-02-02,Restaurante Sabor,-85.20
2026-02-03,Posto Avenida,-210.43
2026-02-05,Loja Online,-450.00
2026-02-10,Academia,-129.90
2026-02-12,Curso Online,-199.00
2026-02-15,Cinema,-47.00`;

  transactions = parseCsv(sampleCsv);
  initializeCategories();
  renderAll();
});

function parseCsv(text) {
  const lines = text.trim().split('\n');
  const rows = lines.slice(1);

  return rows
    .map((line) => line.split(','))
    .filter((fields) => fields.length >= 3)
    .map(([date, description, value]) => ({
      date: date.trim(),
      description: description.trim(),
      value: Number(value.trim()),
      category: 'Outros'
    }))
    .filter((item) => Number.isFinite(item.value));
}

function initializeCategories() {
  transactions = transactions.map((item) => {
    const normalized = item.description.toLowerCase();

    if (normalized.includes('supermercado') || normalized.includes('restaurante')) {
      item.category = 'Alimentação';
    } else if (normalized.includes('uber') || normalized.includes('posto')) {
      item.category = 'Transporte';
    } else if (normalized.includes('farmácia')) {
      item.category = 'Saúde';
    } else if (normalized.includes('netflix') || normalized.includes('cinema')) {
      item.category = 'Lazer';
    } else if (normalized.includes('aluguel')) {
      item.category = 'Moradia';
    } else if (normalized.includes('curso')) {
      item.category = 'Educação';
    }

    return item;
  });
}

function renderAll() {
  transactionsPanel.hidden = false;
  insightsPanel.hidden = false;
  renderTable();
  renderInsights();
}

function renderTable() {
  transactionsBody.innerHTML = '';

  transactions.forEach((item, index) => {
    const row = document.createElement('tr');

    const select = document.createElement('select');
    categories.forEach((cat) => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      option.selected = cat === item.category;
      select.appendChild(option);
    });

    select.addEventListener('change', (event) => {
      transactions[index].category = event.target.value;
      renderInsights();
    });

    row.innerHTML = `
      <td>${formatDate(item.date)}</td>
      <td>${item.description}</td>
      <td class="${item.value < 0 ? 'value-negative' : ''}">${formatCurrency(item.value)}</td>
      <td></td>
    `;

    row.children[3].appendChild(select);
    transactionsBody.appendChild(row);
  });
}

function renderInsights() {
  const spent = transactions.filter((item) => item.value < 0);
  const totalSpent = spent.reduce((sum, item) => sum + Math.abs(item.value), 0);

  const byCategory = spent.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + Math.abs(item.value);
    return acc;
  }, {});

  const byMonth = spent.reduce((acc, item) => {
    const month = item.date.slice(0, 7);
    acc[month] = (acc[month] || 0) + Math.abs(item.value);
    return acc;
  }, {});

  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0] || ['-', 0];

  insightsCards.innerHTML = `
    <article class="card">
      <span>Total gasto</span>
      <strong>${formatCurrency(totalSpent)}</strong>
    </article>
    <article class="card">
      <span>Quantidade de lançamentos</span>
      <strong>${spent.length}</strong>
    </article>
    <article class="card">
      <span>Maior área de gasto</span>
      <strong>${topCategory[0]}</strong>
    </article>
    <article class="card">
      <span>Valor na maior área</span>
      <strong>${formatCurrency(topCategory[1])}</strong>
    </article>
  `;

  drawCategoryChart(byCategory);
  drawMonthlyChart(byMonth);
}

function drawCategoryChart(values) {
  const ctx = document.getElementById('categoryChart');
  if (categoryChart) categoryChart.destroy();

  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(values),
      datasets: [{
        data: Object.values(values),
        backgroundColor: ['#2155cd', '#3b82f6', '#60a5fa', '#93c5fd', '#a78bfa', '#34d399', '#fbbf24', '#f87171', '#9ca3af']
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Distribuição de gastos por área'
        }
      }
    }
  });
}

function drawMonthlyChart(values) {
  const ctx = document.getElementById('monthlyChart');
  if (monthlyChart) monthlyChart.destroy();

  monthlyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(values),
      datasets: [{
        label: 'Total gasto por mês (R$)',
        data: Object.values(values),
        backgroundColor: '#2155cd'
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR');
}
