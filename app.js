const categories = ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Compras', 'Assinaturas', 'Outros'];
const storageKey = 'radar-cartao-categorias-v1';
const supabaseConfigKey = 'radar-cartao-supabase-config-v1';

const csvInput = document.getElementById('csvInput');
const loadSampleBtn = document.getElementById('loadSampleBtn');
const downloadBtn = document.getElementById('downloadBtn');
const dashboard = document.getElementById('dashboard');
const transactionsBody = document.getElementById('transactionsBody');
const insightsCards = document.getElementById('insightsCards');
const merchantList = document.getElementById('merchantList');
const monthFilter = document.getElementById('monthFilter');
const categoryFilter = document.getElementById('categoryFilter');

const supabaseUrlInput = document.getElementById('supabaseUrl');
const supabaseAnonKeyInput = document.getElementById('supabaseAnonKey');
const supabaseUserIdInput = document.getElementById('supabaseUserId');
const connectSupabaseBtn = document.getElementById('connectSupabaseBtn');
const syncSupabaseBtn = document.getElementById('syncSupabaseBtn');
const supabaseStatus = document.getElementById('supabaseStatus');

let transactions = [];
let categoryChart;
let monthlyChart;
let supabaseClient = null;
let supabaseUserId = '';

bootstrapSupabaseConfig();

csvInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  loadTransactions(await file.text());
});

loadSampleBtn.addEventListener('click', () => {
  const sample = `data,descricao,valor
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
2026-02-15,Cinema,-47.00
2026-03-02,Supermercado Central,-356.70
2026-03-04,Conta de Luz,-240.11
2026-03-14,Spotify,-21.90
2026-03-21,Restaurante Sabor,-101.80`;
  loadTransactions(sample);
});

downloadBtn.addEventListener('click', () => {
  const lines = ['data,descricao,valor,categoria', ...transactions.map((t) => [t.date, escapeCsv(t.description), t.value, t.category].join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fatura-categorizada.csv';
  a.click();
  URL.revokeObjectURL(url);
});

connectSupabaseBtn.addEventListener('click', async () => {
  const url = supabaseUrlInput.value.trim();
  const key = supabaseAnonKeyInput.value.trim();
  const userId = supabaseUserIdInput.value.trim();

  if (!url || !key || !userId) {
    setSupabaseStatus('Preencha URL, anon key e user_id para conectar.', true);
    return;
  }

  try {
    supabaseClient = window.supabase.createClient(url, key);
    supabaseUserId = userId;
    persistSupabaseConfig(url, key, userId);
    syncSupabaseBtn.disabled = false;
    setSupabaseStatus('Conectado ao Supabase. Você já pode sincronizar.', false);
    await pullCategoriesFromSupabase();
    renderDashboard();
  } catch {
    setSupabaseStatus('Falha ao criar cliente Supabase. Verifique as credenciais.', true);
  }
});

syncSupabaseBtn.addEventListener('click', async () => {
  await syncCategoriesToSupabase();
});

monthFilter.addEventListener('change', renderDashboard);
categoryFilter.addEventListener('change', renderDashboard);

function loadTransactions(csvText) {
  const savedCategories = loadSavedCategories();
  transactions = parseCsv(csvText).map((t) => ({ ...t, category: savedCategories[t.id] || guessCategory(t.description) }));
  populateFilters();
  dashboard.hidden = false;
  downloadBtn.disabled = false;
  renderDashboard();
}

function parseCsv(text) {
  const rows = splitCsvRows(text).slice(1);
  return rows
    .map((row) => row.map((c) => c.trim()))
    .filter((row) => row.length >= 3)
    .map(([date, description, value]) => ({
      id: `${date}|${description}|${value}`,
      date,
      description,
      value: Number(String(value).replace(',', '.'))
    }))
    .filter((t) => t.date && t.description && Number.isFinite(t.value));
}

function splitCsvRows(text) {
  const rows = [];
  let current = '';
  let row = [];
  let inQuotes = false;
  for (const char of text.trim()) {
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
    } else if (char === '\n' && !inQuotes) {
      row.push(current);
      rows.push(row);
      row = [];
      current = '';
    } else current += char;
  }
  row.push(current);
  rows.push(row);
  return rows;
}

function guessCategory(description) {
  const d = description.toLowerCase();
  if (/aluguel|condominio|luz|agua|internet/.test(d)) return 'Moradia';
  if (/supermercado|restaurante|ifood|padaria/.test(d)) return 'Alimentação';
  if (/uber|99|posto|combustivel/.test(d)) return 'Transporte';
  if (/farmacia|hospital|clinica/.test(d)) return 'Saúde';
  if (/curso|faculdade|escola/.test(d)) return 'Educação';
  if (/netflix|spotify|cinema|show/.test(d)) return 'Lazer';
  if (/amazon|mercado livre|loja/.test(d)) return 'Compras';
  if (/assinatura/.test(d)) return 'Assinaturas';
  return 'Outros';
}

function populateFilters() {
  const months = [...new Set(transactions.map((t) => t.date.slice(0, 7)))].sort();
  monthFilter.innerHTML = ['<option value="all">Todos</option>', ...months.map((m) => `<option value="${m}">${m}</option>`)].join('');
  categoryFilter.innerHTML = ['<option value="all">Todas</option>', ...categories.map((c) => `<option value="${c}">${c}</option>`)].join('');
}

function renderDashboard() {
  const view = filterTransactions();
  renderTable(view);
  renderInsights(view);
  renderMerchants(view);
}

function filterTransactions() {
  return transactions.filter((t) => {
    const monthOk = monthFilter.value === 'all' || t.date.startsWith(monthFilter.value);
    const categoryOk = categoryFilter.value === 'all' || t.category === categoryFilter.value;
    return monthOk && categoryOk;
  });
}

function renderTable(view) {
  transactionsBody.innerHTML = '';
  view.forEach((item) => {
    const tr = document.createElement('tr');
    const categorySelect = document.createElement('select');
    categories.forEach((c) => {
      const option = document.createElement('option');
      option.value = c;
      option.textContent = c;
      option.selected = c === item.category;
      categorySelect.appendChild(option);
    });
    categorySelect.addEventListener('change', async (e) => {
      const tx = transactions.find((t) => t.id === item.id);
      tx.category = e.target.value;
      persistCategories();
      renderDashboard();
      if (supabaseClient && supabaseUserId) {
        await upsertCategoryToSupabase(tx);
      }
    });

    tr.innerHTML = `<td>${formatDate(item.date)}</td><td>${item.description}</td><td class="${item.value < 0 ? 'negative' : 'positive'}">${formatCurrency(item.value)}</td><td></td>`;
    tr.children[3].appendChild(categorySelect);
    transactionsBody.appendChild(tr);
  });
}

function renderInsights(view) {
  const expenses = view.filter((t) => t.value < 0);
  const income = view.filter((t) => t.value > 0).reduce((acc, t) => acc + t.value, 0);
  const totalSpent = expenses.reduce((acc, t) => acc + Math.abs(t.value), 0);
  const byCategory = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Math.abs(t.value);
    return acc;
  }, {});
  const byMonth = transactions.filter((t) => t.value < 0).reduce((acc, t) => {
    const month = t.date.slice(0, 7);
    acc[month] = (acc[month] || 0) + Math.abs(t.value);
    return acc;
  }, {});

  const top = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0] || ['-', 0];
  const ticket = expenses.length ? totalSpent / expenses.length : 0;

  insightsCards.innerHTML = `
    <article class="card"><span>Total gasto</span><strong>${formatCurrency(totalSpent)}</strong></article>
    <article class="card"><span>Ticket médio</span><strong>${formatCurrency(ticket)}</strong></article>
    <article class="card"><span>Maior categoria</span><strong>${top[0]}</strong></article>
    <article class="card"><span>Entradas no período</span><strong>${formatCurrency(income)}</strong></article>
  `;

  drawCategoryChart(byCategory);
  drawMonthlyChart(byMonth);
}

function renderMerchants(view) {
  const ranking = view
    .filter((t) => t.value < 0)
    .reduce((acc, t) => {
      acc[t.description] = (acc[t.description] || 0) + Math.abs(t.value);
      return acc;
    }, {});

  const topMerchants = Object.entries(ranking).sort((a, b) => b[1] - a[1]).slice(0, 5);
  merchantList.innerHTML = topMerchants.length
    ? topMerchants.map(([name, amount]) => `<li><strong>${name}</strong> — ${formatCurrency(amount)}</li>`).join('')
    : '<li>Sem despesas no filtro selecionado.</li>';
}

function drawCategoryChart(values) {
  const ctx = document.getElementById('categoryChart');
  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: Object.keys(values), datasets: [{ data: Object.values(values) }] },
    options: { plugins: { legend: { position: 'bottom' } } }
  });
}

function drawMonthlyChart(values) {
  const ctx = document.getElementById('monthlyChart');
  if (monthlyChart) monthlyChart.destroy();
  monthlyChart = new Chart(ctx, {
    type: 'bar',
    data: { labels: Object.keys(values), datasets: [{ label: 'Gasto mensal (R$)', data: Object.values(values), backgroundColor: '#2563eb' }] },
    options: { scales: { y: { beginAtZero: true } } }
  });
}

function persistCategories() {
  const map = transactions.reduce((acc, t) => {
    acc[t.id] = t.category;
    return acc;
  }, {});
  localStorage.setItem(storageKey, JSON.stringify(map));
}

function loadSavedCategories() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '{}');
  } catch {
    return {};
  }
}

async function upsertCategoryToSupabase(tx) {
  const { error } = await supabaseClient.from('transaction_categories').upsert({
    user_id: supabaseUserId,
    transaction_id: tx.id,
    category: tx.category,
    updated_at: new Date().toISOString()
  });

  if (error) {
    setSupabaseStatus(`Erro ao salvar categoria no Supabase: ${error.message}`, true);
    return;
  }

  setSupabaseStatus('Categoria sincronizada com Supabase.', false);
}

async function pullCategoriesFromSupabase() {
  if (!supabaseClient || !supabaseUserId || !transactions.length) return;

  const ids = transactions.map((t) => t.id);
  const { data, error } = await supabaseClient
    .from('transaction_categories')
    .select('transaction_id, category')
    .eq('user_id', supabaseUserId)
    .in('transaction_id', ids);

  if (error) {
    setSupabaseStatus(`Erro ao ler categorias do Supabase: ${error.message}`, true);
    return;
  }

  const map = Object.fromEntries((data || []).map((item) => [item.transaction_id, item.category]));
  transactions = transactions.map((t) => ({ ...t, category: map[t.id] || t.category }));
  persistCategories();
  setSupabaseStatus('Categorias remotas carregadas com sucesso.', false);
}

async function syncCategoriesToSupabase() {
  if (!supabaseClient || !supabaseUserId) {
    setSupabaseStatus('Conecte ao Supabase antes de sincronizar.', true);
    return;
  }

  if (!transactions.length) {
    setSupabaseStatus('Carregue uma fatura antes de sincronizar.', true);
    return;
  }

  const payload = transactions.map((t) => ({
    user_id: supabaseUserId,
    transaction_id: t.id,
    category: t.category,
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabaseClient.from('transaction_categories').upsert(payload);

  if (error) {
    setSupabaseStatus(`Erro ao sincronizar: ${error.message}`, true);
    return;
  }

  setSupabaseStatus('Sincronização concluída com sucesso.', false);
}

function bootstrapSupabaseConfig() {
  try {
    const config = JSON.parse(localStorage.getItem(supabaseConfigKey) || '{}');
    if (config.url) supabaseUrlInput.value = config.url;
    if (config.key) supabaseAnonKeyInput.value = config.key;
    if (config.userId) supabaseUserIdInput.value = config.userId;
  } catch {
    setSupabaseStatus('Não foi possível carregar configuração local do Supabase.', true);
  }
}

function persistSupabaseConfig(url, key, userId) {
  localStorage.setItem(supabaseConfigKey, JSON.stringify({ url, key, userId }));
}

function setSupabaseStatus(message, isError) {
  supabaseStatus.textContent = message;
  supabaseStatus.classList.toggle('error', isError);
}

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR');
}

function escapeCsv(text) {
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
