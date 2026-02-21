const categories = ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Compras', 'Assinaturas', 'Outros'];
const state = { transactions: [], filter: '' };

const els = {
  form: document.getElementById('transactionForm'),
  date: document.getElementById('date'),
  description: document.getElementById('description'),
  amount: document.getElementById('amount'),
  category: document.getElementById('category'),
  csvInput: document.getElementById('csvInput'),
  loadSampleBtn: document.getElementById('loadSampleBtn'),
  clearBtn: document.getElementById('clearBtn'),
  filter: document.getElementById('filter'),
  body: document.getElementById('transactionsBody'),
  kpis: document.getElementById('kpis'),
  bars: document.getElementById('categoryBars')
};

bootstrap();

function bootstrap() {
  categories.forEach((cat) => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    els.category.appendChild(option);
  });

  state.transactions = loadStorage();
  wireEvents();
  render();
}

function wireEvents() {
  els.form.addEventListener('submit', (event) => {
    event.preventDefault();
    const tx = {
      id: crypto.randomUUID(),
      date: els.date.value,
      description: els.description.value.trim(),
      amount: Number(els.amount.value),
      category: els.category.value || 'Outros'
    };

    if (!tx.date || !tx.description || !Number.isFinite(tx.amount)) return;

    state.transactions.unshift(tx);
    persist();
    els.form.reset();
    render();
  });

  els.csvInput.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const content = await file.text();
    const imported = parseCsv(content);
    state.transactions = [...imported, ...state.transactions];
    persist();
    render();
    els.csvInput.value = '';
  });

  els.loadSampleBtn.addEventListener('click', () => {
    const sample = `data,descricao,valor,categoria
2026-02-01,Aluguel,-1900,Moradia
2026-02-02,Supermercado Bom Preço,-384.95,Alimentação
2026-02-03,Uber,-27.50,Transporte
2026-02-05,Cinema,-48.00,Lazer
2026-02-10,Curso de inglês,-230,Educação
2026-02-15,Farmácia,-80.34,Saúde`;
    state.transactions = [...parseCsv(sample), ...state.transactions];
    persist();
    render();
  });

  els.clearBtn.addEventListener('click', () => {
    state.transactions = [];
    persist();
    render();
  });

  els.filter.addEventListener('input', () => {
    state.filter = els.filter.value.trim().toLowerCase();
    renderTable();
  });
}

function parseCsv(text) {
  return text.trim().split('\n').slice(1).map((line) => {
    const [date = '', description = '', amount = '0', category = 'Outros'] = line.split(',');
    return {
      id: crypto.randomUUID(),
      date: date.trim(),
      description: description.trim(),
      amount: Number(amount.trim()),
      category: categories.includes(category.trim()) ? category.trim() : suggestCategory(description.trim())
    };
  }).filter((item) => item.date && item.description && Number.isFinite(item.amount));
}

function suggestCategory(description) {
  const value = description.toLowerCase();
  if (/mercado|restaurante/.test(value)) return 'Alimentação';
  if (/uber|99|posto/.test(value)) return 'Transporte';
  if (/aluguel|condominio/.test(value)) return 'Moradia';
  if (/farmacia|hospital/.test(value)) return 'Saúde';
  if (/curso|faculdade/.test(value)) return 'Educação';
  if (/cinema|show|streaming|netflix/.test(value)) return 'Lazer';
  return 'Outros';
}

function render() {
  renderTable();
  renderKpis();
  renderCategoryBars();
}

function renderTable() {
  const rows = state.transactions.filter((tx) => {
    if (!state.filter) return true;
    return `${tx.description} ${tx.category}`.toLowerCase().includes(state.filter);
  });

  els.body.innerHTML = '';

  rows.forEach((tx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(tx.date)}</td>
      <td>${tx.description}</td>
      <td class="${tx.amount < 0 ? 'amount-negative' : ''}">${formatCurrency(tx.amount)}</td>
      <td></td>
      <td><button class="secondary" data-id="${tx.id}">Excluir</button></td>
    `;

    const select = document.createElement('select');
    categories.forEach((cat) => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      option.selected = tx.category === cat;
      select.appendChild(option);
    });

    select.addEventListener('change', (event) => {
      tx.category = event.target.value;
      persist();
      renderKpis();
      renderCategoryBars();
    });

    tr.querySelector('button').addEventListener('click', () => {
      state.transactions = state.transactions.filter((item) => item.id !== tx.id);
      persist();
      render();
    });

    tr.children[3].appendChild(select);
    els.body.appendChild(tr);
  });
}

function renderKpis() {
  const spent = state.transactions.filter((tx) => tx.amount < 0);
  const total = spent.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const avg = spent.length ? total / spent.length : 0;

  const monthMap = spent.reduce((acc, tx) => {
    const month = tx.date.slice(0, 7);
    acc[month] = (acc[month] || 0) + Math.abs(tx.amount);
    return acc;
  }, {});

  const bestMonth = Object.entries(monthMap).sort((a, b) => b[1] - a[1])[0] || ['-', 0];

  els.kpis.innerHTML = `
    <article class="kpi"><span>Total gasto</span><strong>${formatCurrency(total)}</strong></article>
    <article class="kpi"><span>Qtd. de gastos</span><strong>${spent.length}</strong></article>
    <article class="kpi"><span>Ticket médio</span><strong>${formatCurrency(avg)}</strong></article>
    <article class="kpi"><span>Mês com maior gasto</span><strong>${bestMonth[0]} · ${formatCurrency(bestMonth[1])}</strong></article>
  `;
}

function renderCategoryBars() {
  const spent = state.transactions.filter((tx) => tx.amount < 0);
  const byCat = spent.reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] || 0) + Math.abs(tx.amount);
    return acc;
  }, {});

  const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const maxValue = entries[0]?.[1] || 1;

  els.bars.innerHTML = entries.length
    ? entries.map(([category, value]) => `
      <article class="bar-row">
        <strong>${category} · ${formatCurrency(value)}</strong>
        <div class="bar-track"><div class="bar-fill" style="width:${(value / maxValue) * 100}%"></div></div>
      </article>
    `).join('')
    : '<p class="hint">Sem gastos para analisar ainda.</p>';
}

function persist() {
  localStorage.setItem('financartao_transactions', JSON.stringify(state.transactions));
}

function loadStorage() {
  try {
    const raw = localStorage.getItem('financartao_transactions');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR');
}
