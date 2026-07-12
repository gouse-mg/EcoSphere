/* Admin Console app logic — no auth per spec (Section 1 of build doc) */

// ---------- Navigation ----------
const sectionTitles = {
  dashboard: 'Dashboard', departments: 'Departments', employees: 'Employees', categories: 'Categories',
  environmental: 'Environmental', social: 'Social', governance: 'Governance',
  gamification: 'Gamification', reports: 'Reports', settings: 'Settings'
};
document.querySelectorAll('#navList button').forEach((btn) => {
  btn.addEventListener('click', () => showSection(btn.dataset.section));
});
function showSection(name) {
  document.querySelectorAll('#navList button').forEach((b) => b.classList.toggle('active', b.dataset.section === name));
  document.querySelectorAll('.main > .section').forEach((s) => s.classList.toggle('active', s.id === `section-${name}`));
  document.getElementById('pageTitle').textContent = sectionTitles[name];
  sectionLoaders[name] && sectionLoaders[name]();
}

// sub-tabs within a section
document.querySelectorAll('.tabs').forEach((tabBar) => {
  tabBar.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-tab]');
    if (!btn) return;
    const tab = btn.dataset.tab;
    tabBar.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
    tabBar.parentElement.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('hidden', p.id !== `panel-${tab}`));
    tabLoaders[tab] && tabLoaders[tab]();
  });
});

function openModal(html) {
  const root = document.getElementById('modalRoot');
  root.innerHTML = `<div class="modal-overlay" id="modalOverlay"><div class="modal">${html}</div></div>`;
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') closeModal();
  });
}
function closeModal() { document.getElementById('modalRoot').innerHTML = ''; }
window.closeModal = closeModal;

// ---------- Reference data loaders (for selects) ----------
async function loadDepartments() { return api.get('/admin/departments'); }
async function loadCategories() { return api.get('/admin/categories'); }
async function loadEmissionFactors() { return api.get('/admin/environmental/emission-factors'); }
async function loadAudits() { return api.get('/admin/governance/audits'); }

function optList(items, valueKey, labelFn, selected) {
  return items.map((i) => `<option value="${i[valueKey]}" ${String(selected) === String(i[valueKey]) ? 'selected' : ''}>${escapeHtml(labelFn(i))}</option>`).join('');
}

// ---------- Generic CRUD engine ----------
const entityConfigs = {
  departments: {
    endpoint: '/admin/departments',
    tbody: 'tbl-departments',
    columns: (d) => [d.name, d.code, d.head || '—', d.employeeCount ?? 0, `<span class="badge ${badgeForStatus(d.status)}">${d.status}</span>`],
    fields: async (item) => [
      { key: 'name', label: 'Name', type: 'text', value: item?.name, required: true },
      { key: 'code', label: 'Code', type: 'text', value: item?.code, required: true },
      { key: 'head', label: 'Head', type: 'text', value: item?.head },
      { key: 'employeeCount', label: 'Employee Count', type: 'number', value: item?.employeeCount ?? 0 },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], value: item?.status || 'Active' },
      { key: 'password', label: item ? 'Reset Password (leave blank to keep)' : 'Password', type: 'password', value: '', required: !item },
    ],
  },
  employees: {
    endpoint: '/admin/employees',
    tbody: 'tbl-employees',
    columns: (e) => [e.name, e.email, e.department?.name || e.department || '—', e.xp ?? 0, `<span class="badge ${badgeForStatus(e.status)}">${e.status}</span>`],
    fields: async (item) => {
      const depts = await loadDepartments();
      return [
        { key: 'name', label: 'Name', type: 'text', value: item?.name, required: true },
        { key: 'email', label: 'Email', type: 'text', value: item?.email, required: true },
        { key: 'department', label: 'Department', type: 'select', optionsHtml: optList(depts, '_id', (d) => d.name, item?.department?._id || item?.department), required: true },
        { key: 'xp', label: 'XP', type: 'number', value: item?.xp ?? 0 },
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], value: item?.status || 'Active' },
        { key: 'password', label: item ? 'Reset Password (leave blank to keep)' : 'Password', type: 'password', value: '', required: !item },
      ];
    },
  },
  categories: {
    endpoint: '/admin/categories',
    tbody: 'tbl-categories',
    columns: (c) => [c.name, c.type, `<span class="badge ${badgeForStatus(c.status)}">${c.status}</span>`],
    fields: async (item) => [
      { key: 'name', label: 'Name', type: 'text', value: item?.name, required: true },
      { key: 'type', label: 'Type', type: 'select', options: ['CSR Activity', 'Challenge'], value: item?.type || 'CSR Activity' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], value: item?.status || 'Active' },
    ],
  },
  emissionFactors: {
    endpoint: '/admin/environmental/emission-factors',
    tbody: 'tbl-emissionFactors',
    columns: (f) => [f.activity, f.scope || '—', f.unit || '—', f.co2ePerUnit, f.source || '—', `<span class="badge ${badgeForStatus(f.status)}">${f.status}</span>`],
    fields: async (item) => [
      { key: 'activity', label: 'Activity', type: 'text', value: item?.activity, required: true },
      { key: 'scope', label: 'Scope', type: 'select', options: ['Scope 1', 'Scope 2', 'Scope 3'], value: item?.scope },
      { key: 'unit', label: 'Unit', type: 'text', value: item?.unit },
      { key: 'co2ePerUnit', label: 'CO2e Per Unit', type: 'number', value: item?.co2ePerUnit, required: true },
      { key: 'source', label: 'Source', type: 'text', value: item?.source },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Draft', 'Inactive'], value: item?.status || 'Active' },
    ],
  },
  goals: {
    endpoint: '/admin/environmental/goals',
    tbody: 'tbl-goals',
    columns: (g) => [g.name, g.department?.name || g.department, g.metric || '—', g.baseline, g.current, g.target, fmtDate(g.dueDate), `<span class="badge ${badgeForStatus(g.status)}">${g.status}</span>`],
    fields: async (item) => {
      const depts = await loadDepartments();
      return [
        { key: 'name', label: 'Name', type: 'text', value: item?.name, required: true },
        { key: 'department', label: 'Department', type: 'select', optionsHtml: optList(depts, '_id', (d) => d.name, item?.department?._id || item?.department), required: true },
        { key: 'metric', label: 'Metric', type: 'text', value: item?.metric },
        { key: 'baseline', label: 'Baseline', type: 'number', value: item?.baseline, required: true },
        { key: 'target', label: 'Target', type: 'number', value: item?.target, required: true },
        { key: 'current', label: 'Current', type: 'number', value: item?.current },
        { key: 'dueDate', label: 'Due Date', type: 'date', value: item?.dueDate ? item.dueDate.substring(0, 10) : '' },
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'On Track', 'At Risk', 'Completed'], value: item?.status || 'Active' },
      ];
    },
  },
  productProfiles: {
    endpoint: '/admin/environmental/product-profiles',
    tbody: 'tbl-productProfiles',
    columns: (p) => [p.productName, p.linkedEmissionFactor?.activity || p.linkedEmissionFactor || '—', p.notes || '—'],
    fields: async (item) => {
      const factors = await loadEmissionFactors();
      return [
        { key: 'productName', label: 'Product Name', type: 'text', value: item?.productName, required: true },
        { key: 'linkedEmissionFactor', label: 'Linked Emission Factor', type: 'select', optionsHtml: `<option value="">—</option>` + optList(factors, '_id', (f) => f.activity, item?.linkedEmissionFactor?._id || item?.linkedEmissionFactor) },
        { key: 'notes', label: 'Notes', type: 'textarea', value: item?.notes },
      ];
    },
  },
  csrActivities: {
    endpoint: '/admin/social/csr-activities',
    tbody: 'tbl-csrActivities',
    columns: (a) => [a.title, a.category?.name || a.category, a.department?.name || 'All', fmtDate(a.date), a.evidenceRequired ? 'Yes' : 'No', `<span class="badge ${badgeForStatus(a.status)}">${a.status}</span>`],
    fields: async (item) => {
      const [cats, depts] = await Promise.all([loadCategories(), loadDepartments()]);
      const csrCats = cats.filter((c) => c.type === 'CSR Activity');
      return [
        { key: 'title', label: 'Title', type: 'text', value: item?.title, required: true },
        { key: 'category', label: 'Category', type: 'select', optionsHtml: optList(csrCats, '_id', (c) => c.name, item?.category?._id || item?.category), required: true },
        { key: 'description', label: 'Description', type: 'textarea', value: item?.description },
        { key: 'date', label: 'Date', type: 'date', value: item?.date ? item.date.substring(0, 10) : '' },
        { key: 'department', label: 'Department (blank = all)', type: 'select', optionsHtml: `<option value="">All Departments</option>` + optList(depts, '_id', (d) => d.name, item?.department?._id || item?.department) },
        { key: 'evidenceRequired', label: 'Evidence Required', type: 'checkbox', checked: item?.evidenceRequired ?? true },
        { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Active', 'Completed'], value: item?.status || 'Draft' },
      ];
    },
  },
  diversity: {
    endpoint: '/admin/social/diversity',
    tbody: 'tbl-diversity',
    columns: (d) => [d.label, d.value, d.target ?? '—'],
    fields: async (item) => [
      { key: 'label', label: 'Label', type: 'text', value: item?.label, required: true },
      { key: 'value', label: 'Value', type: 'number', value: item?.value, required: true },
      { key: 'target', label: 'Target', type: 'number', value: item?.target },
    ],
  },
  policies: {
    endpoint: '/admin/governance/policies',
    tbody: 'tbl-policies',
    columns: (p) => [p.title, p.category || '—', p.version || '—', fmtDate(p.effectiveDate), `<span class="badge ${badgeForStatus(p.status)}">${p.status}</span>`],
    fields: async (item) => [
      { key: 'title', label: 'Title', type: 'text', value: item?.title, required: true },
      { key: 'category', label: 'Category', type: 'select', options: ['Environmental', 'Social', 'Governance'], value: item?.category },
      { key: 'version', label: 'Version', type: 'text', value: item?.version },
      { key: 'effectiveDate', label: 'Effective Date', type: 'date', value: item?.effectiveDate ? item.effectiveDate.substring(0, 10) : '' },
      { key: 'documentUrl', label: 'Document URL', type: 'text', value: item?.documentUrl },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Draft', 'Archived'], value: item?.status || 'Active' },
    ],
  },
  audits: {
    endpoint: '/admin/governance/audits',
    tbody: 'tbl-audits',
    columns: (a) => [a.title, a.department?.name || a.department, a.auditor || '—', fmtDate(a.date), `<span class="badge ${badgeForStatus(a.status)}">${a.status}</span>`],
    fields: async (item) => {
      const depts = await loadDepartments();
      return [
        { key: 'title', label: 'Title', type: 'text', value: item?.title, required: true },
        { key: 'department', label: 'Department', type: 'select', optionsHtml: optList(depts, '_id', (d) => d.name, item?.department?._id || item?.department), required: true },
        { key: 'auditor', label: 'Auditor', type: 'text', value: item?.auditor },
        { key: 'date', label: 'Date', type: 'date', value: item?.date ? item.date.substring(0, 10) : '' },
        { key: 'findings', label: 'Findings', type: 'textarea', value: item?.findings },
        { key: 'status', label: 'Status', type: 'select', options: ['Scheduled', 'Under Review', 'Completed'], value: item?.status || 'Scheduled' },
      ];
    },
  },
  challenges: {
    endpoint: '/admin/gamification/challenges',
    tbody: 'tbl-challenges',
    columns: (c) => [c.title, c.category?.name || c.category, c.xp, c.difficulty || '—', fmtDate(c.deadline), `<span class="badge ${badgeForStatus(c.status)}">${c.status}</span>`],
    fields: async (item) => {
      const cats = await loadCategories();
      const challengeCats = cats.filter((c) => c.type === 'Challenge');
      return [
        { key: 'title', label: 'Title', type: 'text', value: item?.title, required: true },
        { key: 'category', label: 'Category', type: 'select', optionsHtml: optList(challengeCats, '_id', (c) => c.name, item?.category?._id || item?.category), required: true },
        { key: 'description', label: 'Description', type: 'textarea', value: item?.description },
        { key: 'xp', label: 'XP', type: 'number', value: item?.xp, required: true },
        { key: 'difficulty', label: 'Difficulty', type: 'select', options: ['Easy', 'Medium', 'Hard'], value: item?.difficulty },
        { key: 'evidenceRequired', label: 'Evidence Required', type: 'checkbox', checked: item?.evidenceRequired ?? true },
        { key: 'deadline', label: 'Deadline', type: 'date', value: item?.deadline ? item.deadline.substring(0, 10) : '' },
        { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Active', 'Under Review', 'Completed', 'Archived'], value: item?.status || 'Draft' },
      ];
    },
  },
  badges: {
    endpoint: '/admin/gamification/badges',
    tbody: 'tbl-badges',
    columns: (b) => [b.name, b.description || '—', b.icon || '🏅', b.unlockRule ? `${b.unlockRule.type} ≥ ${b.unlockRule.min}` : '—'],
    fields: async (item) => [
      { key: 'name', label: 'Name', type: 'text', value: item?.name, required: true },
      { key: 'description', label: 'Description', type: 'textarea', value: item?.description },
      { key: 'icon', label: 'Icon (emoji)', type: 'text', value: item?.icon },
      { key: 'unlockType', label: 'Unlock Rule Type', type: 'select', options: ['xp', 'challenges', 'csr', 'policies'], value: item?.unlockRule?.type },
      { key: 'unlockMin', label: 'Unlock Rule Minimum', type: 'number', value: item?.unlockRule?.min },
    ],
    transformSubmit: (payload) => ({
      name: payload.name, description: payload.description, icon: payload.icon,
      unlockRule: { type: payload.unlockType, min: Number(payload.unlockMin) || 0 },
    }),
  },
  rewards: {
    endpoint: '/admin/gamification/rewards',
    tbody: 'tbl-rewards',
    columns: (r) => [r.name, r.description || '—', r.pointsRequired, r.stock, `<span class="badge ${badgeForStatus(r.status)}">${r.status}</span>`],
    fields: async (item) => [
      { key: 'name', label: 'Name', type: 'text', value: item?.name, required: true },
      { key: 'description', label: 'Description', type: 'textarea', value: item?.description },
      { key: 'pointsRequired', label: 'Points Required', type: 'number', value: item?.pointsRequired, required: true },
      { key: 'stock', label: 'Stock', type: 'number', value: item?.stock, required: true },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], value: item?.status || 'Active' },
    ],
  },
};

function buildFieldHtml(f) {
  const id = `field_${f.key}`;
  const req = f.required ? 'required' : '';
  if (f.type === 'select') {
    const opts = f.optionsHtml || (f.options || []).map((o) => `<option value="${o}" ${o === f.value ? 'selected' : ''}>${o}</option>`).join('');
    return `<div><label>${f.label}</label><select id="${id}" ${req}><option value="">—</option>${opts}</select></div>`;
  }
  if (f.type === 'textarea') {
    return `<div><label>${f.label}</label><textarea id="${id}" ${req}>${escapeHtml(f.value || '')}</textarea></div>`;
  }
  if (f.type === 'checkbox') {
    return `<div><label>${f.label}</label><label class="switch"><input type="checkbox" id="${id}" ${f.checked ? 'checked' : ''}><span class="slider"></span></label></div>`;
  }
  return `<div><label>${f.label}</label><input type="${f.type}" id="${id}" value="${escapeHtml(f.value ?? '')}" ${req}></div>`;
}

const crud = {
  async load(name) {
    const config = entityConfigs[name];
    const tbody = document.getElementById(config.tbody);
    tbody.innerHTML = `<tr><td colspan="10" class="empty">Loading…</td></tr>`;
    try {
      const items = await api.get(config.endpoint);
      if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="empty">No records yet.</td></tr>`;
        return;
      }
      tbody.innerHTML = items.map((item) => {
        const cols = config.columns(item).map((c) => `<td>${c}</td>`).join('');
        return `<tr>${cols}<td class="actions-row">
          <button class="btn small" onclick='crud.openEdit("${name}", ${JSON.stringify(JSON.stringify(item))})'>Edit</button>
          <button class="btn small danger" onclick="crud.remove('${name}', '${item._id}')">Delete</button>
        </td></tr>`;
      }).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="10" class="empty">${escapeHtml(err.message)}</td></tr>`;
    }
  },

  async openCreate(name) {
    const config = entityConfigs[name];
    const fields = await config.fields(null);
    openModal(`
      <button class="modal-close" onclick="closeModal()">✕</button>
      <h3>New ${name}</h3>
      <div class="form-grid one">${fields.map(buildFieldHtml).join('')}</div>
      <div class="actions-row">
        <button class="btn primary" onclick="crud.submit('${name}', null)">Create</button>
        <button class="btn" onclick="closeModal()">Cancel</button>
      </div>
    `);
    window._crudFields = fields;
  },

  async openEdit(name, itemJson) {
    const item = JSON.parse(itemJson);
    const config = entityConfigs[name];
    const fields = await config.fields(item);
    openModal(`
      <button class="modal-close" onclick="closeModal()">✕</button>
      <h3>Edit ${name}</h3>
      <div class="form-grid one">${fields.map(buildFieldHtml).join('')}</div>
      <div class="actions-row">
        <button class="btn primary" onclick="crud.submit('${name}', '${item._id}')">Save Changes</button>
        <button class="btn" onclick="closeModal()">Cancel</button>
      </div>
    `);
    window._crudFields = fields;
  },

  async submit(name, id) {
    const config = entityConfigs[name];
    const fields = window._crudFields || [];
    const payload = {};
    for (const f of fields) {
      const el = document.getElementById(`field_${f.key}`);
      if (!el) continue;
      if (f.type === 'checkbox') payload[f.key] = el.checked;
      else if (f.type === 'number') payload[f.key] = el.value === '' ? undefined : Number(el.value);
      else payload[f.key] = el.value === '' ? undefined : el.value;
    }
    // Drop empty password on edit so it doesn't overwrite with blank
    if (id && 'password' in payload && !payload.password) delete payload.password;

    const finalPayload = config.transformSubmit ? config.transformSubmit(payload) : payload;

    try {
      if (id) await api.put(`${config.endpoint}/${id}`, finalPayload);
      else await api.post(config.endpoint, finalPayload);
      toast(`${name} saved`, 'success');
      closeModal();
      crud.load(name);
    } catch (err) { toast(err.message, 'error'); }
  },

  async remove(name, id) {
    if (!confirm('Delete this record? This cannot be undone.')) return;
    const config = entityConfigs[name];
    try {
      await api.del(`${config.endpoint}/${id}`);
      toast('Deleted', 'success');
      crud.load(name);
    } catch (err) { toast(err.message, 'error'); }
  },
};
window.crud = crud;

// ---------- Dashboard ----------
async function loadDashboard() {
  try {
    const data = await api.get('/admin/dashboard/overview');
    document.getElementById('dashOverall').textContent = fmtNum(data.overallESGScore);
    document.getElementById('dashDeptCount').textContent = data.departments.length;
    document.getElementById('dashCsrCount').textContent = data.recentActivity.csrParticipations.length;
    document.getElementById('dashComplianceCount').textContent = data.recentActivity.complianceIssues.length;

    const deptBody = document.getElementById('dashDeptBody');
    deptBody.innerHTML = data.departments.length === 0
      ? '<tr><td colspan="6" class="empty">No departments yet.</td></tr>'
      : data.departments.map((d) => `
        <tr>
          <td>#${d.rank}</td><td>${escapeHtml(d.department.name)}</td>
          <td>${fmtNum(d.environmental)}</td><td>${fmtNum(d.social)}</td><td>${fmtNum(d.governance)}</td><td><strong>${fmtNum(d.total)}</strong></td>
        </tr>`).join('');

    const csrList = document.getElementById('dashCsrList');
    csrList.innerHTML = data.recentActivity.csrParticipations.length === 0
      ? '<div class="empty">None yet.</div>'
      : data.recentActivity.csrParticipations.map((p) => `<div class="small-text mb-10">${escapeHtml(p.employee?.name || '—')} → ${escapeHtml(p.activity?.title || '—')} <span class="badge ${badgeForStatus(p.approval)}">${p.approval}</span></div>`).join('');

    const chList = document.getElementById('dashChallengeList');
    chList.innerHTML = data.recentActivity.challengeParticipations.length === 0
      ? '<div class="empty">None yet.</div>'
      : data.recentActivity.challengeParticipations.map((p) => `<div class="small-text mb-10">${escapeHtml(p.employee?.name || '—')} → ${escapeHtml(p.challenge?.title || '—')} <span class="badge ${badgeForStatus(p.approval)}">${p.approval}</span></div>`).join('');

    const compList = document.getElementById('dashComplianceList');
    compList.innerHTML = data.recentActivity.complianceIssues.length === 0
      ? '<div class="empty">None yet.</div>'
      : data.recentActivity.complianceIssues.map((c) => `<div class="small-text mb-10">${escapeHtml(c.department?.name || '—')}: ${escapeHtml(c.description)} <span class="badge ${badgeForStatus(c.status)}">${c.status}</span></div>`).join('');
  } catch (err) { toast(err.message, 'error'); }
}

// ---------- Environmental: carbon transactions (read-only) ----------
async function loadCarbonTxns() {
  const tbody = document.getElementById('tbl-carbonTxns');
  tbody.innerHTML = `<tr><td colspan="6" class="empty">Loading…</td></tr>`;
  try {
    const txns = await api.get('/admin/environmental/carbon-transactions');
    tbody.innerHTML = txns.length === 0 ? `<tr><td colspan="6" class="empty">No submissions yet.</td></tr>` : txns.map((t) => `
      <tr>
        <td>${fmtDate(t.date)}</td>
        <td>${escapeHtml(t.department?.name || t.department)}</td>
        <td>${escapeHtml(t.emissionFactor?.activity || t.emissionFactor)}</td>
        <td>${t.quantity}</td>
        <td>${fmtNum(t.co2eCalculated, 2)}</td>
        <td>${escapeHtml(t.sourceDescription || '—')}</td>
      </tr>`).join('');
  } catch (err) { tbody.innerHTML = `<tr><td colspan="6" class="empty">${escapeHtml(err.message)}</td></tr>`; }
}

// ---------- Social: participation approval queue ----------
async function loadParticipationQueue() {
  const tbody = document.getElementById('tbl-participation');
  tbody.innerHTML = `<tr><td colspan="6" class="empty">Loading…</td></tr>`;
  try {
    const items = await api.get('/admin/social/participation');
    tbody.innerHTML = items.length === 0 ? `<tr><td colspan="6" class="empty">Queue is empty.</td></tr>` : items.map((p) => `
      <tr>
        <td>${escapeHtml(p.employee?.name || '—')}</td>
        <td>${escapeHtml(p.activity?.title || '—')}</td>
        <td>${p.proofFileUrl ? `<a href="${fileUrl(p.proofFileUrl)}" target="_blank">View</a>` : '—'}</td>
        <td><span class="badge ${badgeForStatus(p.approval)}">${p.approval}</span></td>
        <td>${p.pointsEarned ?? 0}</td>
        <td class="actions-row">
          ${p.approval === 'Pending' ? `
          <button class="btn small primary" onclick="approveParticipation('${p._id}')">Approve</button>
          <button class="btn small danger" onclick="rejectParticipation('${p._id}')">Reject</button>` : ''}
        </td>
      </tr>`).join('');
  } catch (err) { tbody.innerHTML = `<tr><td colspan="6" class="empty">${escapeHtml(err.message)}</td></tr>`; }
}
async function approveParticipation(id) {
  const points = prompt('Points to award for this submission:', '10');
  if (points === null) return;
  try {
    await api.patch(`/admin/social/participation/${id}/approve`, { pointsEarned: Number(points) });
    toast('Approved', 'success');
    loadParticipationQueue();
  } catch (err) { toast(err.message, 'error'); }
}
async function rejectParticipation(id) {
  try {
    await api.patch(`/admin/social/participation/${id}/reject`);
    toast('Rejected', 'success');
    loadParticipationQueue();
  } catch (err) { toast(err.message, 'error'); }
}
window.approveParticipation = approveParticipation;
window.rejectParticipation = rejectParticipation;

// ---------- Governance: acknowledgements (read-only) ----------
async function loadAcknowledgements() {
  const tbody = document.getElementById('tbl-acknowledgements');
  tbody.innerHTML = `<tr><td colspan="4" class="empty">Loading…</td></tr>`;
  try {
    const items = await api.get('/admin/governance/acknowledgements');
    tbody.innerHTML = items.length === 0 ? `<tr><td colspan="4" class="empty">No acknowledgement records yet.</td></tr>` : items.map((a) => `
      <tr>
        <td>${escapeHtml(a.employee?.name || a.employee)}</td>
        <td>${escapeHtml(a.policy?.title || a.policy)}</td>
        <td><span class="badge ${badgeForStatus(a.status)}">${a.status}</span></td>
        <td>${fmtDate(a.acknowledgedDate)}</td>
      </tr>`).join('');
  } catch (err) { tbody.innerHTML = `<tr><td colspan="4" class="empty">${escapeHtml(err.message)}</td></tr>`; }
}

// ---------- Governance: compliance issues ----------
async function loadComplianceIssues() {
  const tbody = document.getElementById('tbl-complianceIssues');
  tbody.innerHTML = `<tr><td colspan="8" class="empty">Loading…</td></tr>`;
  try {
    const items = await api.get('/admin/governance/compliance-issues');
    tbody.innerHTML = items.length === 0 ? `<tr><td colspan="8" class="empty">No compliance issues yet.</td></tr>` : items.map((c) => `
      <tr>
        <td>${escapeHtml(c.description)}</td>
        <td>${escapeHtml(c.audit?.title || c.audit)}</td>
        <td>${escapeHtml(c.department?.name || c.department)}</td>
        <td><span class="badge ${badgeForStatus(c.severity)}">${c.severity}</span></td>
        <td>${escapeHtml(c.owner)}</td>
        <td>${fmtDate(c.dueDate)}</td>
        <td><span class="badge ${badgeForStatus(c.status)}">${c.status}</span></td>
        <td>${c.status === 'Open' ? `<button class="btn small primary" onclick="resolveIssue('${c._id}')">Resolve</button>` : ''}</td>
      </tr>`).join('');
  } catch (err) { tbody.innerHTML = `<tr><td colspan="8" class="empty">${escapeHtml(err.message)}</td></tr>`; }
}
async function resolveIssue(id) {
  try {
    await api.patch(`/admin/governance/compliance-issues/${id}/resolve`);
    toast('Marked resolved', 'success');
    loadComplianceIssues();
  } catch (err) { toast(err.message, 'error'); }
}
window.resolveIssue = resolveIssue;

async function openComplianceForm() {
  const [depts, audits] = await Promise.all([loadDepartments(), loadAudits()]);
  openModal(`
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>New Compliance Issue</h3>
    <div class="form-grid one">
      <div><label>Audit</label><select id="ciAudit"><option value="">—</option>${optList(audits, '_id', (a) => a.title)}</select></div>
      <div><label>Department</label><select id="ciDept"><option value="">—</option>${optList(depts, '_id', (d) => d.name)}</select></div>
      <div><label>Description</label><textarea id="ciDesc"></textarea></div>
      <div><label>Severity</label><select id="ciSeverity"><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></div>
      <div><label>Owner (required)</label><input type="text" id="ciOwner"></div>
      <div><label>Due Date (required)</label><input type="date" id="ciDue"></div>
    </div>
    <div class="actions-row">
      <button class="btn primary" onclick="submitComplianceIssue()">Create</button>
      <button class="btn" onclick="closeModal()">Cancel</button>
    </div>
  `);
}
window.openComplianceForm = openComplianceForm;
async function submitComplianceIssue() {
  const payload = {
    audit: document.getElementById('ciAudit').value,
    department: document.getElementById('ciDept').value,
    description: document.getElementById('ciDesc').value,
    severity: document.getElementById('ciSeverity').value,
    owner: document.getElementById('ciOwner').value,
    dueDate: document.getElementById('ciDue').value,
  };
  if (!payload.owner || !payload.dueDate) { toast('Owner and Due Date are required', 'error'); return; }
  try {
    await api.post('/admin/governance/compliance-issues', payload);
    toast('Compliance issue created', 'success');
    closeModal();
    loadComplianceIssues();
  } catch (err) { toast(err.message, 'error'); }
}
window.submitComplianceIssue = submitComplianceIssue;

// ---------- Gamification: challenge participation queue ----------
async function loadChallengeParticipationQueue() {
  const tbody = document.getElementById('tbl-challengeParticipation');
  tbody.innerHTML = `<tr><td colspan="7" class="empty">Loading…</td></tr>`;
  try {
    const items = await api.get('/admin/gamification/challenge-participation');
    tbody.innerHTML = items.length === 0 ? `<tr><td colspan="7" class="empty">Queue is empty.</td></tr>` : items.map((p) => `
      <tr>
        <td>${escapeHtml(p.employee?.name || '—')}</td>
        <td>${escapeHtml(p.challenge?.title || '—')}</td>
        <td>${p.progress ?? 0}%</td>
        <td>${p.proofFileUrl ? `<a href="${fileUrl(p.proofFileUrl)}" target="_blank">View</a>` : '—'}</td>
        <td><span class="badge ${badgeForStatus(p.approval)}">${p.approval}</span></td>
        <td>${p.xpAwarded ?? 0}</td>
        <td class="actions-row">
          ${['Pending', 'Under review', 'In progress'].includes(p.approval) ? `
          <button class="btn small primary" onclick="approveChallengeParticipation('${p._id}')">Approve</button>
          <button class="btn small danger" onclick="rejectChallengeParticipation('${p._id}')">Reject</button>` : ''}
        </td>
      </tr>`).join('');
  } catch (err) { tbody.innerHTML = `<tr><td colspan="7" class="empty">${escapeHtml(err.message)}</td></tr>`; }
}
async function approveChallengeParticipation(id) {
  const xp = prompt('XP to award for this challenge:', '20');
  if (xp === null) return;
  try {
    await api.patch(`/admin/gamification/challenge-participation/${id}/approve`, { xpAwarded: Number(xp) });
    toast('Approved', 'success');
    loadChallengeParticipationQueue();
  } catch (err) { toast(err.message, 'error'); }
}
async function rejectChallengeParticipation(id) {
  try {
    await api.patch(`/admin/gamification/challenge-participation/${id}/reject`);
    toast('Rejected', 'success');
    loadChallengeParticipationQueue();
  } catch (err) { toast(err.message, 'error'); }
}
window.approveChallengeParticipation = approveChallengeParticipation;
window.rejectChallengeParticipation = rejectChallengeParticipation;

// ---------- Gamification: leaderboard (read-only) ----------
async function loadLeaderboard() {
  const tbody = document.getElementById('tbl-leaderboard');
  tbody.innerHTML = `<tr><td colspan="4" class="empty">Loading…</td></tr>`;
  try {
    const items = await api.get('/admin/gamification/leaderboard');
    const list = Array.isArray(items) ? items : (items.employees || items.leaderboard || []);
    tbody.innerHTML = list.length === 0 ? `<tr><td colspan="4" class="empty">No data yet.</td></tr>` : list.map((e, idx) => `
      <tr>
        <td>#${idx + 1}</td>
        <td>${escapeHtml(e.name || e.employee?.name || '—')}</td>
        <td>${escapeHtml(e.department?.name || e.department || '—')}</td>
        <td>${e.xp ?? '—'}</td>
      </tr>`).join('');
  } catch (err) { tbody.innerHTML = `<tr><td colspan="4" class="empty">${escapeHtml(err.message)}</td></tr>`; }
}

// ---------- Reports ----------
async function loadFixedReport(type) {
  const out = document.getElementById('reportOutput');
  out.textContent = 'Loading…';
  try {
    const data = await api.get(`/admin/reports/${type}`);
    out.textContent = JSON.stringify(data, null, 2);
  } catch (err) { out.textContent = 'Error: ' + err.message; }
}
window.loadFixedReport = loadFixedReport;

async function runCustomReport() {
  const out = document.getElementById('reportOutput');
  out.textContent = 'Running…';
  const body = {
    department: document.getElementById('crDept').value || undefined,
    module: document.getElementById('crModule').value || undefined,
    employee: document.getElementById('crEmployee').value || undefined,
    challenge: document.getElementById('crChallenge').value || undefined,
    esgCategory: document.getElementById('crCategory').value || undefined,
    dateRange: document.getElementById('crDateRange').value || undefined,
  };
  try {
    const data = await api.post('/admin/reports/custom', body);
    out.textContent = JSON.stringify(data, null, 2);
  } catch (err) { out.textContent = 'Error: ' + err.message; }
}
window.runCustomReport = runCustomReport;

function exportReport(format) {
  window.open(`${API_BASE}/admin/reports/custom/export?format=${format}`, '_blank');
}
window.exportReport = exportReport;

// ---------- Settings ----------
async function loadSettings() {
  try {
    const config = await api.get('/admin/settings/config');
    document.getElementById('wEnv').value = config.weights?.environmental ?? 40;
    document.getElementById('wSoc').value = config.weights?.social ?? 30;
    document.getElementById('wGov').value = config.weights?.governance ?? 30;
    document.getElementById('wTarget').value = config.targetPerEmployee ?? 200;
    document.getElementById('tAuto').checked = !!config.toggles?.autoEmissionCalculation;
    document.getElementById('tEvidence').checked = !!config.toggles?.evidenceRequiredForCSR;
    document.getElementById('tBadge').checked = !!config.toggles?.badgeAutoAward;
  } catch (err) { toast(err.message, 'error'); }
  try {
    const notif = await api.get('/admin/settings/notifications');
    document.getElementById('nCompliance').checked = !!notif.newComplianceIssue;
    document.getElementById('nApproval').checked = !!notif.approvalDecisions;
    document.getElementById('nPolicy').checked = !!notif.policyReminders;
    document.getElementById('nBadge').checked = !!notif.badgeUnlocks;
  } catch (err) { /* notifications may not exist yet - non-fatal */ }
}
async function saveConfig() {
  const payload = {
    weights: {
      environmental: Number(document.getElementById('wEnv').value),
      social: Number(document.getElementById('wSoc').value),
      governance: Number(document.getElementById('wGov').value),
    },
    targetPerEmployee: Number(document.getElementById('wTarget').value),
    toggles: {
      autoEmissionCalculation: document.getElementById('tAuto').checked,
      evidenceRequiredForCSR: document.getElementById('tEvidence').checked,
      badgeAutoAward: document.getElementById('tBadge').checked,
    },
  };
  try {
    await api.put('/admin/settings/config', payload);
    toast('Configuration saved', 'success');
  } catch (err) { toast(err.message, 'error'); }
}
window.saveConfig = saveConfig;
async function saveNotifications() {
  const payload = {
    newComplianceIssue: document.getElementById('nCompliance').checked,
    approvalDecisions: document.getElementById('nApproval').checked,
    policyReminders: document.getElementById('nPolicy').checked,
    badgeUnlocks: document.getElementById('nBadge').checked,
  };
  try {
    await api.put('/admin/settings/notifications', payload);
    toast('Notification settings saved', 'success');
  } catch (err) { toast(err.message, 'error'); }
}
window.saveNotifications = saveNotifications;

// ---------- Section / Tab loader registries ----------
const sectionLoaders = {
  dashboard: loadDashboard,
  departments: () => crud.load('departments'),
  employees: () => crud.load('employees'),
  categories: () => crud.load('categories'),
  environmental: () => crud.load('emissionFactors'),
  social: () => crud.load('csrActivities'),
  governance: () => crud.load('policies'),
  gamification: () => crud.load('challenges'),
  reports: () => {},
  settings: loadSettings,
};

const tabLoaders = {
  emissionFactors: () => crud.load('emissionFactors'),
  goals: () => crud.load('goals'),
  carbonTxns: loadCarbonTxns,
  productProfiles: () => crud.load('productProfiles'),
  csrActivities: () => crud.load('csrActivities'),
  participation: loadParticipationQueue,
  diversity: () => crud.load('diversity'),
  policies: () => crud.load('policies'),
  acknowledgements: loadAcknowledgements,
  audits: () => crud.load('audits'),
  complianceIssues: loadComplianceIssues,
  challenges: () => crud.load('challenges'),
  challengeParticipation: loadChallengeParticipationQueue,
  badges: () => crud.load('badges'),
  rewards: () => crud.load('rewards'),
  leaderboard: loadLeaderboard,
};

loadDashboard();
