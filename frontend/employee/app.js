/* Employee Portal app logic */

(function guard() {
  const profile = getProfile();
  if (!getToken() || !profile || profile.role !== 'employee') {
    window.location.href = 'login.html';
  }
})();

const profile = getProfile();
document.getElementById('whoBox').innerHTML = `${escapeHtml(profile.name || 'Employee')}<small>${escapeHtml(profile.department || '')}</small>`;

document.getElementById('logoutBtn').addEventListener('click', () => {
  clearToken();
  window.location.href = 'login.html';
});

// ---- Navigation ----
const sectionTitles = {
  overview: 'Overview', csr: 'CSR Activities', challenges: 'Challenges',
  policies: 'ESG Policies', rewards: 'Rewards'
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

// ---- Overview ----
async function loadOverview() {
  try {
    const data = await api.get('/employee/dashboard');
    document.getElementById('statXp').textContent = data.xp ?? 0;
    document.getElementById('statRank').textContent = `#${data.rank ?? '—'}`;
    document.getElementById('statBadgeCount').textContent = (data.badges || []).length;
    const grid = document.getElementById('badgeGrid');
    if (!data.badges || data.badges.length === 0) {
      grid.innerHTML = '<div class="empty">No badges earned yet — join activities and challenges to start unlocking them.</div>';
    } else {
      grid.innerHTML = data.badges.map((b) => `
        <div class="card">
          <div style="font-size:26px;">${escapeHtml(b.icon || '🏅')}</div>
          <h3 style="margin:8px 0 4px;">${escapeHtml(b.name)}</h3>
          <div class="small-text">${escapeHtml(b.description || '')}</div>
        </div>`).join('');
    }
  } catch (err) { toast(err.message, 'error'); }
}

// ---- CSR ----
async function loadCsr() {
  const tbody = document.getElementById('csrTableBody');
  tbody.innerHTML = `<tr><td colspan="4" class="empty">Loading…</td></tr>`;
  try {
    const activities = await api.get('/employee/csr-activities');
    if (activities.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="empty">No open CSR activities right now.</td></tr>`;
      return;
    }
    tbody.innerHTML = activities.map((a) => `
      <tr>
        <td>${escapeHtml(a.title)}</td>
        <td>${escapeHtml(a.description || '—')}</td>
        <td>${fmtDate(a.date)}</td>
        <td><button class="btn small primary" onclick="joinCsr('${a._id}')">Join</button></td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty">${escapeHtml(err.message)}</td></tr>`;
  }
}
async function joinCsr(id) {
  try {
    const participation = await api.post(`/employee/csr-activities/${id}/join`);
    toast('Joined activity! You can upload proof below.', 'success');
    promptUploadProof(`/employee/participation/${participation._id}/upload-proof`);
  } catch (err) { toast(err.message, 'error'); }
}
window.joinCsr = joinCsr;

// ---- Challenges ----
async function loadChallenges() {
  const tbody = document.getElementById('challengeTableBody');
  tbody.innerHTML = `<tr><td colspan="5" class="empty">Loading…</td></tr>`;
  try {
    const challenges = await api.get('/employee/challenges');
    if (challenges.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty">No active challenges right now.</td></tr>`;
      return;
    }
    tbody.innerHTML = challenges.map((c) => `
      <tr>
        <td>${escapeHtml(c.title)}</td>
        <td>${c.xp}</td>
        <td>${escapeHtml(c.difficulty || '—')}</td>
        <td>${fmtDate(c.deadline)}</td>
        <td><button class="btn small primary" onclick="joinChallenge('${c._id}')">Join</button></td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty">${escapeHtml(err.message)}</td></tr>`;
  }
}
async function joinChallenge(id) {
  try {
    const participation = await api.post(`/employee/challenges/${id}/join`);
    toast('Joined challenge!', 'success');
    openChallengeManage(participation._id);
  } catch (err) { toast(err.message, 'error'); }
}
window.joinChallenge = joinChallenge;

function openChallengeManage(participationId) {
  openModal(`
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>Update Challenge Progress</h3>
    <div class="form-grid one">
      <div><label>Progress (%)</label><input type="number" id="progressInput" min="0" max="100" value="0"></div>
    </div>
    <div class="actions-row mb-10">
      <button class="btn primary" onclick="submitProgress('${participationId}')">Save Progress</button>
    </div>
    <hr style="border-color:var(--border);margin:16px 0;">
    <label class="small-text" style="display:block;margin-bottom:6px;">Upload proof (image or PDF)</label>
    <input type="file" id="proofFileInput" accept="image/jpeg,image/png,application/pdf">
    <div class="actions-row" style="margin-top:12px;">
      <button class="btn primary" onclick="submitProof('/employee/challenge-participation/${participationId}/upload-proof')">Upload Proof</button>
    </div>
  `);
}
window.openChallengeManage = openChallengeManage;

async function submitProgress(id) {
  const val = Number(document.getElementById('progressInput').value);
  try {
    await api.patch(`/employee/challenge-participation/${id}/progress`, { progress: val });
    toast('Progress updated', 'success');
  } catch (err) { toast(err.message, 'error'); }
}
window.submitProgress = submitProgress;

function promptUploadProof(uploadPath) {
  openModal(`
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>Upload Proof</h3>
    <p class="small-text">Upload an image or PDF as evidence for this activity.</p>
    <input type="file" id="proofFileInput" accept="image/jpeg,image/png,application/pdf">
    <div class="actions-row" style="margin-top:14px;">
      <button class="btn primary" onclick="submitProof('${uploadPath}')">Upload</button>
      <button class="btn" onclick="closeModal()">Skip for now</button>
    </div>
  `);
}
window.promptUploadProof = promptUploadProof;

async function submitProof(path) {
  const fileInput = document.getElementById('proofFileInput');
  if (!fileInput.files.length) { toast('Please choose a file first', 'error'); return; }
  const fd = new FormData();
  fd.append('proof', fileInput.files[0]);
  try {
    await api.postForm(path, fd);
    toast('Proof uploaded', 'success');
    closeModal();
  } catch (err) { toast(err.message, 'error'); }
}
window.submitProof = submitProof;

// ---- Policies ----
async function loadPolicies() {
  const tbody = document.getElementById('policyTableBody');
  tbody.innerHTML = `<tr><td colspan="6" class="empty">Loading…</td></tr>`;
  try {
    const policies = await api.get('/employee/policies');
    if (policies.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty">No policies apply to you right now.</td></tr>`;
      return;
    }
    tbody.innerHTML = policies.map((p) => `
      <tr>
        <td>${escapeHtml(p.title)}</td>
        <td>${escapeHtml(p.category || '—')}</td>
        <td>${escapeHtml(p.version || '—')}</td>
        <td>${fmtDate(p.effectiveDate)}</td>
        <td><span class="badge ${badgeForStatus(p.ackStatus)}">${escapeHtml(p.ackStatus)}</span></td>
        <td>${p.ackStatus === 'Acknowledged'
          ? ''
          : `<button class="btn small primary" onclick="ackPolicy('${p._id}')">Acknowledge</button>`}</td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty">${escapeHtml(err.message)}</td></tr>`;
  }
}
async function ackPolicy(id) {
  try {
    await api.post(`/employee/policies/${id}/acknowledge`);
    toast('Policy acknowledged', 'success');
    loadPolicies();
  } catch (err) { toast(err.message, 'error'); }
}
window.ackPolicy = ackPolicy;

// ---- Rewards ----
async function loadRewards() {
  const grid = document.getElementById('rewardsGrid');
  grid.innerHTML = '<div class="empty">Loading…</div>';
  try {
    const data = await api.get('/employee/rewards');
    document.getElementById('rewardsXp').textContent = data.currentXP;
    if (!data.rewards || data.rewards.length === 0) {
      grid.innerHTML = '<div class="empty">No rewards available right now.</div>';
      return;
    }
    grid.innerHTML = data.rewards.map((r) => `
      <div class="card">
        <h3>${escapeHtml(r.name)}</h3>
        <div class="small-text mb-10">${escapeHtml(r.description || '')}</div>
        <div class="flex between mb-10">
          <span class="badge blue">${r.pointsRequired} XP</span>
          <span class="small-text">Stock: ${r.stock}</span>
        </div>
        <button class="btn primary" style="width:100%;" ${data.currentXP < r.pointsRequired || r.stock < 1 ? 'disabled' : ''} onclick="redeemReward('${r._id}')">Redeem</button>
      </div>`).join('');
  } catch (err) {
    grid.innerHTML = `<div class="empty">${escapeHtml(err.message)}</div>`;
  }
}
async function redeemReward(id) {
  try {
    const result = await api.post(`/employee/rewards/${id}/redeem`);
    toast(`Redeemed! Remaining XP: ${result.remainingXP}`, 'success');
    loadRewards();
    loadOverview();
  } catch (err) { toast(err.message, 'error'); }
}
window.redeemReward = redeemReward;

const loaders = {
  overview: loadOverview, csr: loadCsr, challenges: loadChallenges,
  policies: loadPolicies, rewards: loadRewards
};

loadOverview();
