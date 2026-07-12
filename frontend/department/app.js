/* Department Portal app logic */

(function guard() {
  const profile = getProfile();
  if (!getToken() || !profile || profile.role !== 'department') {
    window.location.href = 'login.html';
  }
})();

const profile = getProfile();
document.getElementById('whoBox').innerHTML = `${escapeHtml(profile.name || 'Department')}<small>Code: ${escapeHtml(profile.code || '')}</small>`;

document.getElementById('logoutBtn').addEventListener('click', () => {
  clearToken();
  window.location.href = 'login.html';
});

const sectionTitles = {
  overview: 'Dashboard', carbon: 'Carbon Transactions', goals: 'Environmental Goals', employees: 'Employees'
};
document.querySelectorAll('.nav button').forEach((btn) => {
  btn.addEventListener('click', () => showSection(btn.dataset.section));
});
function showSection(name) {
  document.querySelectorAll('.nav button').forEach((b) => b.classList.toggle('active', b.dataset.section === name));
  document.querySelectorAll('.section').forEach((s) => s.classList.toggle('active', s.id === `section-${name}`));
  document.getElementById('pageTitle').textContent = sectionTitles[name];
  loaders[name] && loaders[name]();
}

function openModal(html) {
  const root = document.getElementById('modalRoot');
  root.innerHTML = `<div class="modal-overlay" id="modalOverlay"><div class="modal">${html}</div></div>`;
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') closeModal();
  });
}
function closeModal() { document.getElementById('modalRoot').innerHTML = ''; }

let cachedDashboard = null;

// ---- Overview ----
async function loadOverview() {
  try {
    const data = await api.get('/department/dashboard');
    cachedDashboard = data;
    document.getElementById('statEnv').textContent = fmtNum(data.scores.environmental);
    document.getElementById('statSoc').textContent = fmtNum(data.scores.social);
    document.getElementById('statGov').textContent = fmtNum(data.scores.governance);
    document.getElementById('statTotal').textContent = fmtNum(data.scores.total);
    document.getElementById('statRank').textContent = `Rank #${data.rank ?? '—'} of ${data.totalDepartments ?? '—'}`;

    const body = document.getElementById('empScoreBody');
    if (!data.employees || data.employees.length === 0) {
      body.innerHTML = '<tr><td colspan="3" class="empty">No employees found.</td></tr>';
    } else {
      body.innerHTML = data.employees.map((e) => `
        <tr>
          <td>${escapeHtml(e.employee.name)}</td>
          <td>${escapeHtml(e.employee.email)}</td>
          <td>${fmtNum(e.socialScore)}</td>
        </tr>`).join('');
    }
  } catch (err) { toast(err.message, 'error'); }
}

// ---- Carbon Transactions ----
async function loadCarbon() {
  const tbody = document.getElementById('carbonTableBody');
  tbody.innerHTML = `<tr><td colspan="5" class="empty">Loading…</td></tr>`;
  try {
    const txns = await api.get('/department/carbon-transactions');
    if (txns.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty">No submissions yet. Click "New Submission" to add one.</td></tr>`;
      return;
    }
    tbody.innerHTML = txns.map((t) => `
      <tr>
        <td>${fmtDate(t.date)}</td>
        <td>${escapeHtml(t.emissionFactor?.activity || t.emissionFactor)}</td>
        <td>${t.quantity}</td>
        <td>${escapeHtml(t.sourceDescription || '—')}</td>
        <td>${fmtNum(t.co2eCalculated, 2)}</td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty">${escapeHtml(err.message)}</td></tr>`;
  }
}

async function openNewTransactionModal() {
  let factors = [];
  try {
    factors = await api.get('/admin/environmental/emission-factors');
  } catch (err) {
    toast('Could not load emission factors: ' + err.message, 'error');
  }
  const options = factors.map((f) => `<option value="${f._id}">${escapeHtml(f.activity)} (${escapeHtml(f.unit || '')})</option>`).join('');
  openModal(`
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>New Carbon Transaction</h3>
    <div class="form-grid one">
      <div>
        <label>Emission Factor</label>
        <select id="txnFactor">${options || '<option value="">No emission factors available</option>'}</select>
      </div>
      <div><label>Quantity</label><input type="number" id="txnQuantity" step="any"></div>
      <div><label>Source Description</label><input type="text" id="txnSource" placeholder="e.g. Fleet diesel — March"></div>
    </div>
    <div class="actions-row">
      <button class="btn primary" onclick="submitTransaction()">Submit</button>
      <button class="btn" onclick="closeModal()">Cancel</button>
    </div>
  `);
}
window.openNewTransactionModal = openNewTransactionModal;

async function submitTransaction() {
  const emissionFactor = document.getElementById('txnFactor').value;
  const quantity = Number(document.getElementById('txnQuantity').value);
  const sourceDescription = document.getElementById('txnSource').value.trim();
  if (!emissionFactor) { toast('Please select an emission factor', 'error'); return; }
  if (!quantity || quantity <= 0) { toast('Please enter a valid quantity', 'error'); return; }
  try {
    await api.post('/department/carbon-transactions', { emissionFactor, quantity, sourceDescription });
    toast('Carbon transaction submitted', 'success');
    closeModal();
    loadCarbon();
  } catch (err) { toast(err.message, 'error'); }
}
window.submitTransaction = submitTransaction;

// ---- Goals ----
async function loadGoals() {
  const tbody = document.getElementById('goalsTableBody');
  tbody.innerHTML = `<tr><td colspan="7" class="empty">Loading…</td></tr>`;
  try {
    const goals = await api.get('/department/goals');
    if (goals.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty">No environmental goals set for this department.</td></tr>`;
      return;
    }
    tbody.innerHTML = goals.map((g) => `
      <tr>
        <td>${escapeHtml(g.name)}</td>
        <td>${escapeHtml(g.metric || '—')}</td>
        <td>${g.baseline}</td>
        <td>${g.current}</td>
        <td>${g.target}</td>
        <td>${fmtDate(g.dueDate)}</td>
        <td><span class="badge ${badgeForStatus(g.status)}">${escapeHtml(g.status)}</span></td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty">${escapeHtml(err.message)}</td></tr>`;
  }
}

// ---- Employees ----
async function loadEmployees() {
  const tbody = document.getElementById('employeesTableBody');
  tbody.innerHTML = `<tr><td colspan="4" class="empty">Loading…</td></tr>`;
  try {
    const data = cachedDashboard || await api.get('/department/dashboard');
    if (!data.employees || data.employees.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="empty">No employees found.</td></tr>`;
      return;
    }
    tbody.innerHTML = data.employees.map((e) => `
      <tr>
        <td>${escapeHtml(e.employee.name)}</td>
        <td>${escapeHtml(e.employee.email)}</td>
        <td>—</td>
        <td>${fmtNum(e.socialScore)}</td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty">${escapeHtml(err.message)}</td></tr>`;
  }
}

const loaders = { overview: loadOverview, carbon: loadCarbon, goals: loadGoals, employees: loadEmployees };

loadOverview();
