const API_BASE = 'http://localhost:5000/api/measurements';

const fieldSelect = document.getElementById('fieldSelect');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');
const loadBtn = document.getElementById('loadBtn');
const statusText = document.getElementById('statusText');

const avgValue = document.getElementById('avgValue');
const minValue = document.getElementById('minValue');
const maxValue = document.getElementById('maxValue');
const stdValue = document.getElementById('stdValue');

let chart;

function setStatus(msg) {
  statusText.textContent = msg;
}

function fmt(x) {
  if (x === null || x === undefined) return '—';
  // красиво: до 3 знаков после запятой, но без мусора
  const n = Number(x);
  if (Number.isNaN(n)) return String(x);
  return n.toFixed(3).replace(/\.?0+$/, '');
}

async function fetchJson(url) {
  const res = await fetch(url);
  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = body?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return body;
}

function buildChart(labels, values, field) {
  if (chart) chart.destroy();

  chart = new Chart(document.getElementById('chart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: field,
        data: values,
        borderWidth: 2,
        pointRadius: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true }
      },
      scales: {
        x: {
          ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 }
        }
      }
    }
  });
}

async function load() {
  const field = fieldSelect.value;
  const start = startDate.value;
  const end = endDate.value;

  if (!start || !end) {
    setStatus('Please select start and end dates.');
    return;
  }

  setStatus('Loading data...');

  try {
    const dataUrl = `${API_BASE}?field=${field}&start_date=${start}&end_date=${end}`;
    const metricsUrl = `${API_BASE}/metrics?field=${field}&start_date=${start}&end_date=${end}`;

    const [data, metrics] = await Promise.all([
      fetchJson(dataUrl),
      fetchJson(metricsUrl)
    ]);

    const labels = data.map(d => new Date(d.timestamp).toLocaleString());
    const values = data.map(d => d[field]);

    avgValue.textContent = fmt(metrics.avg);
    minValue.textContent = fmt(metrics.min);
    maxValue.textContent = fmt(metrics.max);
    stdValue.textContent = fmt(metrics.stdDev);

    buildChart(labels, values, field);

    setStatus(`Loaded ${data.length} points.`);
  } catch (err) {
    setStatus(`Error: ${err.message}`);
    avgValue.textContent = '—';
    minValue.textContent = '—';
    maxValue.textContent = '—';
    stdValue.textContent = '—';
    if (chart) chart.destroy();
  }
}

loadBtn.addEventListener('click', load);

// авто-загрузка при открытии
window.addEventListener('load', load);
