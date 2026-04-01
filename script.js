// ===== TASKR — Main Script =====

const CATS = {
  personal: { label: '👤 Personal', color: '#7c6aff' },
  work:     { label: '💼 Work',     color: '#ff6a9d' },
  study:    { label: '📚 Study',    color: '#ffd166' },
  health:   { label: '❤️ Health',   color: '#4dff9e' },
  other:    { label: '📌 Other',    color: '#6affb8' },
};

let tasks     = JSON.parse(localStorage.getItem('taskr_tasks') || '[]');
let filter    = 'all';
let catFilter = 'all';

function save() {
  localStorage.setItem('taskr_tasks', JSON.stringify(tasks));
}

function addTask() {
  const title = document.getElementById('taskInput').value.trim();
  if (!title) { document.getElementById('taskInput').focus(); return; }

  const task = {
    id:        Date.now(),
    title,
    priority:  document.getElementById('prioritySelect').value,
    category:  document.getElementById('categorySelect').value,
    due:       document.getElementById('dueDateInput').value,
    done:      false,
    createdAt: new Date().toISOString()
  };

  tasks.unshift(task);
  save();
  document.getElementById('taskInput').value  = '';
  document.getElementById('dueDateInput').value = '';
  renderTasks();
  renderStats();
}

function toggleDone(id) {
  const t = tasks.find(t => t.id === id);
  if (t) { t.done = !t.done; save(); renderTasks(); renderStats(); }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  save(); renderTasks(); renderStats();
}

function setFilter(f, el) {
  filter = f;
  document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderTasks();
}

function setCatFilter(c) {
  catFilter = c;
  document.querySelectorAll('.cat-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.cat === c);
    if (p.dataset.cat === c) {
      const col = c === 'all' ? 'var(--accent)' : CATS[c]?.color || 'var(--accent)';
      p.style.background  = col;
      p.style.borderColor = col;
    } else {
      p.style.background  = '';
      p.style.borderColor = '';
    }
  });
  renderTasks();
}

function renderCatFilters() {
  const wrap    = document.getElementById('catFilters');
  const allPill = `<button class="cat-pill active" data-cat="all"
    style="background:var(--accent);border-color:var(--accent);color:var(--bg)"
    onclick="setCatFilter('all')">All</button>`;
  const pills   = Object.entries(CATS).map(([k, v]) =>
    `<button class="cat-pill" data-cat="${k}" onclick="setCatFilter('${k}')">${v.label}</button>`
  ).join('');
  wrap.innerHTML = allPill + pills;
}

function isOverdue(due) {
  if (!due) return false;
  return new Date(due) < new Date(new Date().toDateString());
}

function formatDue(due) {
  if (!due) return null;
  const d    = new Date(due + 'T00:00:00');
  const today = new Date(new Date().toDateString());
  const diff  = Math.round((d - today) / 86400000);
  if (diff < 0)  return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

function renderTasks() {
  const search   = document.getElementById('searchInput').value.toLowerCase();
  let filtered   = tasks.filter(t => {
    if (filter    === 'active' && t.done)              return false;
    if (filter    === 'done'   && !t.done)             return false;
    if (catFilter !== 'all'    && t.category !== catFilter) return false;
    if (search && !t.title.toLowerCase().includes(search)) return false;
    return true;
  });

  const container = document.getElementById('taskContainer');
  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✦</div>
        <h3>No tasks found</h3>
        <p>Add a task above to get started</p>
      </div>`;
    return;
  }

  const active = filtered.filter(t => !t.done);
  const done   = filtered.filter(t =>  t.done);

  let html = '';
  if (active.length) {
    if (done.length) html += `<div class="section-label">Active — ${active.length}</div>`;
    html += active.map(t => taskHTML(t)).join('');
  }
  if (done.length) {
    html += `<div class="section-label">Completed — ${done.length}</div>`;
    html += done.map(t => taskHTML(t)).join('');
  }

  container.innerHTML = `<div class="task-list">${html}</div>`;
}

function taskHTML(t) {
  const overdue     = isOverdue(t.due) && !t.done;
  const dueLabel    = formatDue(t.due);
  const cat         = CATS[t.category];
  const priorityMap = { high: '🔴 High', medium: '⚡ Med', low: '🟢 Low' };

  return `
  <div class="task-item ${t.done ? 'done' : ''}" data-priority="${t.priority}">
    <div class="checkbox ${t.done ? 'checked' : ''}" onclick="toggleDone(${t.id})"></div>
    <div class="task-body">
      <div class="task-title">${escHtml(t.title)}</div>
      <div class="task-meta">
        <span class="meta-tag priority-${t.priority}">${priorityMap[t.priority]}</span>
        <span class="meta-tag cat-tag" style="background:${cat.color}22;color:${cat.color}">${cat.label}</span>
        ${dueLabel ? `<span class="meta-tag due-tag ${overdue ? 'due-overdue' : ''}">📅 ${dueLabel}</span>` : ''}
      </div>
    </div>
    <div class="task-actions">
      <button class="action-btn del-btn" onclick="deleteTask(${t.id})" title="Delete">✕</button>
    </div>
  </div>`;
}

function escHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderStats() {
  const total   = tasks.length;
  const done    = tasks.filter(t => t.done).length;
  const overdue = tasks.filter(t => isOverdue(t.due) && !t.done).length;
  document.getElementById('statsBar').innerHTML = `
    <div class="stat"><span class="stat-dot" style="background:var(--accent)"></span>${total} total</div>
    <div class="stat"><span class="stat-dot" style="background:var(--green)"></span>${done} done</div>
    <div class="stat"><span class="stat-dot" style="background:var(--text3)"></span>${total - done} pending</div>
    ${overdue ? `<div class="stat"><span class="stat-dot" style="background:var(--red)"></span>${overdue} overdue</div>` : ''}
  `;
}

// Enter key to add
document.getElementById('taskInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

// ===== AI AGENT =====
function toggleAgent() {
  const panel = document.getElementById('agentPanel');
  const isOpen = panel.classList.toggle('open');
  if (isOpen && document.getElementById('agentMessages').children.length === 0) {
    startChat();
  }
}

function startChat() {
  addAgentMsg("Hey! 👋 I'm your TASKR assistant.\n\nWhat can I suggest:\n• Tasks for tomorrow\n• Tasks for a topic (study, work, health)\n• Or anything else?\n\nJust tell me!");
}

function addAgentMsg(text, chips = []) {
  const wrap = document.getElementById('agentMessages');
  const div  = document.createElement('div');
  div.className = 'msg agent';
  div.innerHTML = text.replace(/\n/g, '<br>');
  if (chips.length) {
    const chipWrap = document.createElement('div');
    chipWrap.style.marginTop = '8px';
    chips.forEach(chip => {
      const btn = document.createElement('span');
      btn.className   = 'suggest-chip';
      btn.textContent = chip;
      btn.onclick     = () => addTaskFromChip(chip);
      chipWrap.appendChild(btn);
    });
    div.appendChild(chipWrap);
  }
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}

function addUserMsg(text) {
  const wrap = document.getElementById('agentMessages');
  const div  = document.createElement('div');
  div.className   = 'msg user';
  div.textContent = text;
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}

function showTyping() {
  const wrap = document.getElementById('agentMessages');
  const div  = document.createElement('div');
  div.className   = 'msg typing';
  div.id          = 'typingIndicator';
  div.textContent = '...';
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}

function hideTyping() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

function addTaskFromChip(title) {
  tasks.unshift({
    id: Date.now(), title,
    priority: 'medium', category: 'personal',
    due: '', done: false,
    createdAt: new Date().toISOString()
  });
  save();
  renderTasks();
  renderStats();
  addAgentMsg(`✅ Task added: "${title}"`);
}

async function getAIResponse(userMsg) {
  await new Promise(r => setTimeout(r, 900));
  const msg = userMsg.toLowerCase();
  if (msg.includes('tomorrow') || msg.includes('kal'))
    return `For tomorrow! TASKS:["Morning exercise 30 min","Top 3 priority tasks","Check emails","Evening plan review"]`;
  if (msg.includes('study') || msg.includes('padhai'))
    return `Study tasks! TASKS:["Pomodoro: 25 min study","Revise notes","Practice problems","Write doubt list"]`;
  if (msg.includes('health') || msg.includes('fitness'))
    return `Health tasks! TASKS:["Morning walk 20 min","Drink 8 glasses of water","Healthy lunch","10 min stretching"]`;
  if (msg.includes('work') || msg.includes('office'))
    return `Work tasks! TASKS:["Prepare standup","Clear emails","Update weekly report","Team sync"]`;
  return `Try these! TASKS:["Complete top priority task","Inbox zero","15 min planning","Delegate one task"]`;
}

async function sendMessage() {
  const input = document.getElementById('agentInput');
  const text  = input.value.trim();
  if (!text) return;
  input.value = '';
  addUserMsg(text);
  showTyping();
  const response = await getAIResponse(text);
  hideTyping();
  const taskMatch = response.match(/TASKS:\[([^\]]+)\]/);
  const chips = taskMatch ? JSON.parse('[' + taskMatch[1] + ']') : [];
  const cleanMsg = response.replace(/TASKS:\[[^\]]+\]/, '').trim();
  addAgentMsg(cleanMsg, chips);
}

document.getElementById('agentInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMessage();
});

// ===== TABS =====
function switchTab(tab, el) {
  document.querySelectorAll('.agent-tab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('agentMessages').style.display   = tab === 'chat'  ? 'flex' : 'none';
  document.getElementById('agentTimerPanel').style.display = tab === 'timer' ? 'flex' : 'none';
  document.querySelector('.agent-input-wrap').style.display= tab === 'chat'  ? 'flex' : 'none';
}

function setTimerMode(mode, el) {
  document.querySelectorAll('.tmode').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  ['pomodoro','countdown','stopwatch'].forEach(m => {
    document.getElementById('tp-' + m).style.display = m === mode ? 'flex' : 'none';
  });
}

// ===== POMODORO =====
let pomState = { running: false, isBreak: false, session: 1, timeLeft: 25*60, interval: null };

function pomTick() {
  pomState.timeLeft--;
  updatePomDisplay();
  if (pomState.timeLeft <= 0) {
    clearInterval(pomState.interval);
    pomState.running = false;
    if (!pomState.isBreak) {
      pomState.isBreak = true;
      pomState.timeLeft = 5 * 60;
      document.getElementById('pomPhase').textContent = 'BREAK';
      document.getElementById('pomPhase').style.color = 'var(--green)';
    } else {
      pomState.isBreak = false;
      pomState.session++;
      pomState.timeLeft = 25 * 60;
      document.getElementById('pomPhase').textContent = 'FOCUS';
      document.getElementById('pomPhase').style.color = 'var(--accent)';
    }
    updatePomDisplay();
    document.getElementById('pomInfo').textContent = `Session ${pomState.session} • 4 rounds`;
    document.querySelector('#tp-pomodoro .tbtn').textContent = '▶ Start';
    recordPomodoro();
  }
}

function updatePomDisplay() {
  const m = String(Math.floor(pomState.timeLeft / 60)).padStart(2, '0');
  const s = String(pomState.timeLeft % 60).padStart(2, '0');
  document.getElementById('pomDisplay').textContent = `${m}:${s}`;
}

function pomControl() {
  const btn = document.querySelector('#tp-pomodoro .tbtn');
  if (pomState.running) {
    clearInterval(pomState.interval);
    pomState.running = false;
    btn.textContent = '▶ Start';
  } else {
    pomState.interval = setInterval(pomTick, 1000);
    pomState.running = true;
    btn.textContent = '⏸ Pause';
  }
}

function pomReset() {
  clearInterval(pomState.interval);
  pomState = { running: false, isBreak: false, session: 1, timeLeft: 25*60, interval: null };
  document.getElementById('pomPhase').textContent = 'FOCUS';
  document.getElementById('pomPhase').style.color = 'var(--accent)';
  document.getElementById('pomInfo').textContent  = 'Session 1 • 4 rounds';
  document.querySelector('#tp-pomodoro .tbtn').textContent = '▶ Start';
  updatePomDisplay();
}

// ===== COUNTDOWN =====
let cdState = { running: false, timeLeft: 0, interval: null };

function cdControl() {
  const btn = document.querySelector('#tp-countdown .tbtn');
  if (cdState.running) {
    clearInterval(cdState.interval);
    cdState.running = false;
    btn.textContent = '▶ Start';
    return;
  }
  if (!cdState.timeLeft) {
    const m = parseInt(document.getElementById('cdMin').value) || 0;
    const s = parseInt(document.getElementById('cdSec').value) || 0;
    cdState.timeLeft = m * 60 + s;
  }
  if (!cdState.timeLeft) return;
  document.getElementById('cdInputs').style.display = 'none';
  cdState.interval = setInterval(() => {
    cdState.timeLeft--;
    const m = String(Math.floor(cdState.timeLeft / 60)).padStart(2,'0');
    const s = String(cdState.timeLeft % 60).padStart(2,'0');
    document.getElementById('cdDisplay').textContent = `${m}:${s}`;
    if (cdState.timeLeft <= 0) {
      clearInterval(cdState.interval);
      cdState.running = false;
      document.getElementById('cdDisplay').textContent = '✅ Done!';
      btn.textContent = '▶ Start';
    }
  }, 1000);
  cdState.running = true;
  btn.textContent = '⏸ Pause';
}

function cdReset() {
  clearInterval(cdState.interval);
  cdState = { running: false, timeLeft: 0, interval: null };
  document.getElementById('cdDisplay').textContent = '00:00';
  document.getElementById('cdInputs').style.display = 'flex';
  document.getElementById('cdMin').value = '';
  document.getElementById('cdSec').value = '';
  document.querySelector('#tp-countdown .tbtn').textContent = '▶ Start';
}

// ===== STOPWATCH =====
let swState = { running: false, elapsed: 0, lapTime: 0, lastTick: null, lapCount: 0, interval: null };

function swControl() {
  const btn = document.querySelector('#tp-stopwatch .tbtn');
  if (swState.running) {
    clearInterval(swState.interval);
    swState.running = false;
    btn.textContent = '▶ Resume';
    document.querySelector('#tp-stopwatch .tbtn-ghost').textContent = '🏁 Lap';
    document.querySelector('#tp-stopwatch .tbtn-ghost').onclick = swLap;
  } else {
    swState.lastTick = Date.now() - swState.elapsed;
    swState.interval = setInterval(() => {
      swState.elapsed = Date.now() - swState.lastTick;
      document.getElementById('swDisplay').textContent = formatSW(swState.elapsed);
    }, 100);
    swState.running = true;
    btn.textContent = '⏸ Pause';
    document.querySelector('#tp-stopwatch .tbtn-ghost').textContent = '🏁 Lap';
    document.querySelector('#tp-stopwatch .tbtn-ghost').onclick = swLap;
  }
}

function swLap() {
  if (!swState.running) return;
  swState.lapCount++;
  const lapEl = document.createElement('div');
  lapEl.className = 'lap-item';
  lapEl.innerHTML = `<span>Lap ${swState.lapCount}</span><span>${formatSW(swState.elapsed)}</span>`;
  document.getElementById('swLaps').prepend(lapEl);
}

function swReset() {
  clearInterval(swState.interval);
  swState = { running: false, elapsed: 0, lapTime: 0, lastTick: null, lapCount: 0, interval: null };
  document.getElementById('swDisplay').textContent = '00:00.0';
  document.getElementById('swLaps').innerHTML = '';
  document.querySelector('#tp-stopwatch .tbtn').textContent = '▶ Start';
  document.querySelector('#tp-stopwatch .tbtn-ghost').textContent = '↺ Reset';
  document.querySelector('#tp-stopwatch .tbtn-ghost').onclick = swReset;
}

function formatSW(ms) {
  const m  = String(Math.floor(ms / 60000)).padStart(2,'0');
  const s  = String(Math.floor((ms % 60000) / 1000)).padStart(2,'0');
  const ds = Math.floor((ms % 1000) / 100);
  return `${m}:${s}.${ds}`;
}

// ===== GRAPH & STATS =====
function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function getLast7Keys() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

function getDailyData() {
  return JSON.parse(localStorage.getItem('taskr_daily') || '{}');
}

function saveDailyData(data) {
  localStorage.setItem('taskr_daily', JSON.stringify(data));
}

function recordTaskComplete() {
  const data = getDailyData();
  const key  = getTodayKey();
  data[key] = (data[key] || 0) + 1;
  saveDailyData(data);
  refreshGraphs();
}

function recordPomodoro() {
  const data = JSON.parse(localStorage.getItem('taskr_pom') || '{}');
  const key  = getTodayKey();
  data[key] = (data[key] || 0) + 1;
  localStorage.setItem('taskr_pom', JSON.stringify(data));
  refreshGraphs();
}

function calcStreak() {
  const data = getDailyData();
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (data[key] && data[key] > 0) streak++;
    else break;
  }
  return streak;
}

function switchGraph(tab, el) {
  document.querySelectorAll('.graph-tab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  ['daily', 'pomodoro', 'category'].forEach(t => {
    document.getElementById('gp-' + t).style.display = t === tab ? 'block' : 'none';
  });
}

let dailyChartInst = null;
let pomChartInst   = null;
let catChartInst   = null;

function refreshGraphs() {
  document.getElementById('streakCount').textContent = calcStreak();

  const keys  = getLast7Keys();
  const labels = keys.map(k => {
    const d = new Date(k + 'T00:00:00');
    return d.toLocaleDateString('en', { weekday: 'short' });
  });

  // Daily Bar Chart
  const dailyData = getDailyData();
  const dailyVals = keys.map(k => dailyData[k] || 0);
  if (dailyChartInst) dailyChartInst.destroy();
  dailyChartInst = new Chart(document.getElementById('dailyChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Tasks Done',
        data: dailyVals,
        backgroundColor: keys.map(k =>
          k === getTodayKey() ? '#7c6aff' : 'rgba(124,106,255,0.3)'
        ),
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: chartOptions('Tasks Completed'),
  });

  // Pomodoro Line Chart
  const pomData = JSON.parse(localStorage.getItem('taskr_pom') || '{}');
  const pomVals = keys.map(k => pomData[k] || 0);
  if (pomChartInst) pomChartInst.destroy();
  pomChartInst = new Chart(document.getElementById('pomChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Pomodoros',
        data: pomVals,
        borderColor: '#ff6a9d',
        backgroundColor: 'rgba(255,106,157,0.1)',
        pointBackgroundColor: '#ff6a9d',
        pointRadius: 5,
        tension: 0.4,
        fill: true,
      }]
    },
    options: chartOptions('Sessions'),
  });

  // Category Bar Chart
  const catLabels = Object.values(CATS).map(c => c.label);
  const catKeys   = Object.keys(CATS);
  const catVals   = catKeys.map(k =>
    tasks.filter(t => t.category === k && t.done).length
  );
  const catColors = ['#7c6aff','#ff6a9d','#ffd166','#4dff9e','#6affb8'];
  if (catChartInst) catChartInst.destroy();
  catChartInst = new Chart(document.getElementById('catChart'), {
    type: 'bar',
    data: {
      labels: catLabels,
      datasets: [{
        label: 'Completed',
        data: catVals,
        backgroundColor: catColors.map(c => c + '99'),
        borderColor: catColors,
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: chartOptions('Tasks'),
  });
}

function chartOptions(yLabel) {
  return {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1a24',
        titleColor: '#e8e8f0',
        bodyColor: '#888899',
        borderColor: '#2a2a3a',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        ticks: { color: '#888899', font: { family: 'Space Mono', size: 10 } },
        grid:  { color: 'rgba(255,255,255,0.04)' },
      },
      y: {
        ticks: { color: '#888899', font: { family: 'Space Mono', size: 10 }, stepSize: 1 },
        grid:  { color: 'rgba(255,255,255,0.04)' },
        title: { display: false },
        beginAtZero: true,
      }
    }
  };
}

// Hook toggleDone to record task completions in daily data
const _origToggleDone = toggleDone;
toggleDone = function(id) {
  const t = tasks.find(t => t.id === id);
  const wasDone = t?.done;
  _origToggleDone(id);
  if (t && !wasDone && t.done) recordTaskComplete();
};

// ===== INIT =====
renderCatFilters();
renderTasks();
renderStats();
refreshGraphs();