/* ==============================================================
   考研英语 · 每日打卡 - App Logic
   ============================================================== */

(() => {
  'use strict';

  // ============================
  // 1. 默认任务定义
  // ============================
  const DEFAULT_TASKS = [
    { id: 'vocab_new',     label: '背新词',     category: '词汇', icon: '📖', extra: '50 词' },
    { id: 'vocab_review',  label: '复习旧词',   category: '词汇', icon: '🔄', extra: '100 词' },
    { id: 'reading',       label: '阅读理解',   category: '阅读', icon: '📝', extra: '2 篇精读' },
    { id: 'writing',       label: '写作训练',   category: '写作', icon: '✍️', extra: '真题练习' },
    { id: 'translation',   label: '翻译练习',   category: '翻译', icon: '🌐', extra: '英译中' },
    { id: 'cloze',         label: '完形填空',   category: '综合', icon: '🔠', extra: '1 篇' },
    { id: 'new_type',      label: '新题型训练', category: '综合', icon: '📋', extra: '排序/选标题' },
    { id: 'sentence',      label: '长难句分析', category: '语法', icon: '🔗', extra: '5 句' },
    { id: 'extensive',     label: '外刊精读',   category: '阅读', icon: '📰', extra: '经济学人' },
    { id: 'listening',     label: '听力/朗读',  category: '综合', icon: '🎧', extra: '15 分钟' },
  ];

  // ============================
  // 2. 学习资源
  // ============================
  const RESOURCES = [
    { name: '不背单词', desc: '语境记词 · 考研词库', icon: '📕', url: 'https://www.bbdc.cn', ext: 'App' },
    { name: '墨墨背单词', desc: '艾宾浩斯复习', icon: '📗', url: 'https://www.maimemo.com', ext: 'App' },
    { name: '百词斩', desc: '图文结合记单词', icon: '📘', url: 'https://www.baicizhan.com', ext: 'App/Web' },
    { name: '扇贝阅读', desc: '双语外刊精读', icon: '📚', url: 'https://www.shanbay.com', ext: 'App/Web' },
    { name: '每日英语听力', desc: 'VOA/BBC/真题听力', icon: '🎧', url: 'https://www.eudic.cn', ext: 'App' },
    { name: 'ChinaDaily', desc: '中国日报英语点津', icon: '🇨🇳', url: 'https://language.chinadaily.com.cn', ext: 'Web' },
    { name: '经济学人·商论', desc: '外刊双语精读', icon: '📊', url: 'https://www.tegbr.com', ext: 'App' },
    { name: '考研真题库', desc: '历年真题在线刷', icon: '✅', url: 'https://www.kaoyan.com/yingyu/zt', ext: 'Web' },
    { name: 'Grammarly', desc: '写作语法校对', icon: '✏️', url: 'https://app.grammarly.com', ext: 'Web/插件' },
    { name: '欧路词典', desc: '专业词典 · 查词', icon: '🔍', url: 'https://www.eudic.net', ext: 'App' },
    { name: 'Quillbot', desc: '写作润色 · 改写', icon: '🖋️', url: 'https://quillbot.com', ext: 'Web' },
    { name: '考研英语真题', desc: '黄皮书真题解析', icon: '📖', url: 'https://www.douban.com/doulist/...', ext: '书籍' },
  ];

  // ============================
  // 3. 数据层
  // ============================
  const STORAGE_KEY = 'kaoyan_english_data';

  function defaultData() {
    return {
      settings: {
        dailyGoal: 8,   // 每日打卡目标完成数
        enabledTasks: DEFAULT_TASKS.map(t => t.id),
        dailyNewWords: 50,
        dailyReviewWords: 100,
      },
      records: {},  // { "2026-07-05": { completed: [...], checkedIn: true } }
    };
  }

  let data = null;

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        data = JSON.parse(raw);
        // 确保所有字段存在（向前兼容）
        if (!data.settings) data.settings = defaultData().settings;
        if (!data.settings.enabledTasks) data.settings.enabledTasks = defaultData().settings.enabledTasks;
        if (!data.settings.dailyGoal) data.settings.dailyGoal = defaultData().settings.dailyGoal;
        if (!data.settings.dailyNewWords) data.settings.dailyNewWords = 50;
        if (!data.settings.dailyReviewWords) data.settings.dailyReviewWords = 100;
        if (!data.records) data.records = {};
      } else {
        data = defaultData();
        saveData();
      }
    } catch (e) {
      data = defaultData();
      saveData();
    }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Save failed:', e);
    }
  }

  // ============================
  // 4. 日期工具
  // ============================
  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function formatDate(year, month, day) {
    return year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
  }

  function getDateParts(dateStr) {
    const parts = dateStr.split('-').map(Number);
    return { year: parts[0], month: parts[1], day: parts[2] };
  }

  function daysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  function firstDayOfMonth(year, month) {
    return new Date(year, month - 1, 1).getDay(); // 0=Sun
  }

  function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  // ============================
  // 5. 核心逻辑
  // ============================
  function getTodayRecord() {
    const key = todayStr();
    if (!data.records[key]) {
      data.records[key] = { completed: [], checkedIn: false };
      saveData();
    }
    return data.records[key];
  }

  function getRecord(dateStr) {
    return data.records[dateStr];
  }

  function toggleTask(taskId) {
    const rec = getTodayRecord();
    const idx = rec.completed.indexOf(taskId);
    if (idx >= 0) {
      rec.completed.splice(idx, 1);
      rec.checkedIn = false;
    } else {
      rec.completed.push(taskId);
    }
    saveData();
    renderToday();
    renderCalendar();
  }

  function checkIn() {
    const rec = getTodayRecord();
    const enabledTasks = data.settings.enabledTasks;
    const completedCount = enabledTasks.filter(id => rec.completed.includes(id)).length;
    if (completedCount >= data.settings.dailyGoal) {
      rec.checkedIn = true;
      saveData();
      renderToday();
      renderCalendar();
      renderStats();
      showToast(`🎉 恭喜完成第 ${getStreak()} 天连续打卡！`);
    }
  }

  function isCheckedIn(dateStr) {
    const rec = getRecord(dateStr);
    return rec ? rec.checkedIn : false;
  }

  function getCompletedCount(dateStr) {
    const rec = getRecord(dateStr);
    if (!rec) return 0;
    return rec.completed.length;
  }

  function getEnabledTasks() {
    return DEFAULT_TASKS.filter(t => data.settings.enabledTasks.includes(t.id));
  }

  // ============================
  // 6. 连续打卡 / 统计
  // ============================
  function getStreak() {
    const d = new Date();
    let streak = 0;
    while (true) {
      const key = formatDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
      if (isCheckedIn(key)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  function getTotalDays() {
    return Object.keys(data.records).filter(k => data.records[k].checkedIn).length;
  }

  function getThisMonthCount() {
    const now = new Date();
    const prefix = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    let count = 0;
    for (const [key, rec] of Object.entries(data.records)) {
      if (rec.checkedIn && key.startsWith(prefix)) count++;
    }
    return count;
  }

  function getMonthlyStats(year, month) {
    const prefix = year + '-' + String(month).padStart(2, '0');
    let checked = 0;
    let partial = 0;
    for (const [key, rec] of Object.entries(data.records)) {
      if (!key.startsWith(prefix)) continue;
      if (rec.checkedIn) checked++;
      else if (rec.completed && rec.completed.length > 0) partial++;
    }
    return { checked, partial };
  }

  function getCompletedByTask() {
    const counts = {};
    DEFAULT_TASKS.forEach(t => { counts[t.id] = 0; });
    for (const rec of Object.values(data.records)) {
      if (!rec.completed) continue;
      rec.completed.forEach(id => {
        if (counts[id] !== undefined) counts[id]++;
      });
    }
    return counts;
  }

  // ============================
  // 7. 渲染
  // ============================

  // 7a. 日期显示
  function renderDate() {
    const now = new Date();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const el = document.getElementById('dateDisplay');
    el.textContent = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekdays[now.getDay()]}`;
  }

  // 7b. 今日任务
  function renderToday() {
    const rec = getTodayRecord();
    const enabled = getEnabledTasks();
    const listEl = document.getElementById('taskList');
    const btn = document.getElementById('btnCheckIn');
    const badge = document.getElementById('progressBadge');
    const progressBar = document.getElementById('todayProgress');

    const completedCount = enabled.filter(t => rec.completed.includes(t.id)).length;
    const total = enabled.length;
    const goal = data.settings.dailyGoal;

    badge.textContent = `${completedCount}/${total}`;
    const pct = total > 0 ? (completedCount / total) * 100 : 0;
    progressBar.style.width = Math.min(pct, 100) + '%';

    // 按钮状态
    const reachedGoal = completedCount >= goal;
    if (reachedGoal && !rec.checkedIn) {
      btn.disabled = false;
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> 完成打卡 (${completedCount}/${total})`;
    } else if (rec.checkedIn) {
      btn.disabled = true;
      btn.innerHTML = `✅ 今日已打卡 (${completedCount}/${total})`;
      btn.className = 'btn btn-secondary';
    } else {
      btn.disabled = true;
      btn.innerHTML = `还需 ${goal - completedCount} 项达标 · 目标${goal}项`;
      btn.className = 'btn btn-primary';
    }

    if (rec.checkedIn) {
      btn.className = 'btn btn-secondary';
    } else {
      btn.className = 'btn btn-primary';
    }

    // 渲染任务列表
    listEl.innerHTML = '';
    enabled.forEach(task => {
      const done = rec.completed.includes(task.id);
      const div = document.createElement('div');
      div.className = 'task-item' + (done ? ' completed' : '');
      div.dataset.taskId = task.id;
      div.innerHTML = `
        <div class="task-check">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <span class="task-icon">${task.icon}</span>
        <div class="task-info">
          <div class="task-label">${task.label}</div>
          <div class="task-category">${task.category}</div>
        </div>
        <span class="task-extra">${task.extra}</span>
      `;
      div.addEventListener('click', () => {
        if (rec.checkedIn) {
          showToast('今日已打卡，无法修改任务状态');
          return;
        }
        toggleTask(task.id);
      });
      listEl.appendChild(div);
    });
  }

  // 7c. 日历
  let calYear, calMonth;

  function renderCalendar() {
    const now = new Date();
    calYear = calYear || now.getFullYear();
    calMonth = calMonth || (now.getMonth() + 1);

    const grid = document.getElementById('calendarGrid');
    const monthLabel = document.getElementById('calendarMonth');
    monthLabel.textContent = `${calYear}年${calMonth}月`;

    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const days = daysInMonth(calYear, calMonth);
    const firstDay = firstDayOfMonth(calYear, calMonth);

    let html = '';
    weekdays.forEach(w => {
      html += `<div class="calendar-weekday">${w}</div>`;
    });

    // 上月填充
    const prevDays = daysInMonth(calMonth === 1 ? calYear - 1 : calYear, calMonth === 1 ? 12 : calMonth - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevDays - i;
      html += `<div class="calendar-day other-month">${d}</div>`;
    }

    // 本月
    for (let d = 1; d <= days; d++) {
      const key = formatDate(calYear, calMonth, d);
      const rec = getRecord(key);
      const today = new Date();
      const isToday = today.getFullYear() === calYear && (today.getMonth() + 1) === calMonth && today.getDate() === d;
      const isFuture = new Date(calYear, calMonth - 1, d) > today;

      let cls = 'calendar-day';
      if (rec) {
        if (rec.checkedIn) cls += ' checked';
        else if (rec.completed && rec.completed.length > 0) cls += ' partial';
      }
      if (isFuture) cls += ' future';
      if (isToday) cls += ' today';

      html += `<div class="${cls}">${d}</div>`;
    }

    // 下月填充
    const totalCells = 7 * Math.ceil((firstDay + days) / 7);
    const remaining = totalCells - firstDay - days;
    for (let d = 1; d <= remaining; d++) {
      html += `<div class="calendar-day other-month">${d}</div>`;
    }

    grid.innerHTML = html;
  }

  // 7d. 统计概览 (modal)
  function renderStatsModal() {
    const body = document.getElementById('statsBody');
    const streak = getStreak();
    const total = getTotalDays();
    const monthCount = getThisMonthCount();
    const taskCounts = getCompletedByTask();
    const enabled = getEnabledTasks();

    let html = `
      <div class="stat-detail-grid">
        <div class="stat-detail-card">
          <div class="stat-value">${streak}</div>
          <div class="stat-label">🔥 连续打卡</div>
        </div>
        <div class="stat-detail-card">
          <div class="stat-value">${total}</div>
          <div class="stat-label">📅 累计天数</div>
        </div>
        <div class="stat-detail-card">
          <div class="stat-value">${monthCount}</div>
          <div class="stat-label">📆 本月打卡</div>
        </div>
        <div class="stat-detail-card">
          <div class="stat-value">${total > 0 ? Math.round(streak / total * 100) : 0}%</div>
          <div class="stat-label">🎯 连续率</div>
        </div>
      </div>
      <div class="card-header"><h2>各任务完成次数</h2></div>
      <div style="display:flex;flex-direction:column;gap:6px;">
    `;

    enabled.forEach(task => {
      const count = taskCounts[task.id] || 0;
      html += `
        <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;">
          <span style="font-size:1rem;width:24px;">${task.icon}</span>
          <span style="flex:1;font-size:0.85rem;">${task.label}</span>
          <span style="font-size:0.85rem;font-weight:600;color:var(--primary);">${count} 次</span>
        </div>
      `;
    });

    html += '</div>';
    body.innerHTML = html;
  }

  // 7e. 设置 modal
  function renderSettingsModal() {
    const body = document.getElementById('settingsBody');
    const s = data.settings;

    let html = `
      <div class="setting-group">
        <h3>每日目标</h3>
        <div class="setting-row">
          <label>每日达标任务数</label>
          <div class="setting-counter">
            <button onclick="window.__app.adjustDailyGoal(-1)">−</button>
            <span id="goalDisplay">${s.dailyGoal}</span>
            <button onclick="window.__app.adjustDailyGoal(1)">+</button>
          </div>
        </div>
      </div>
      <div class="setting-group">
        <h3>启用学习项目</h3>
    `;

    DEFAULT_TASKS.forEach(task => {
      const enabled = s.enabledTasks.includes(task.id);
      html += `
        <div class="setting-row">
          <label>
            <span style="margin-right:6px;">${task.icon}</span>
            ${task.label}
          </label>
          <label class="toggle">
            <input type="checkbox" data-task-id="${task.id}" ${enabled ? 'checked' : ''} onchange="window.__app.toggleSettingTask('${task.id}')">
            <span class="toggle-slider"></span>
          </label>
        </div>
      `;
    });

    html += `
      </div>
      <div class="setting-group">
        <h3>每日目标</h3>
        <div class="setting-row">
          <label>每日新词量</label>
          <div class="setting-counter">
            <button onclick="window.__app.adjustWords('dailyNewWords', -10)">−</button>
            <span id="newWordsDisplay">${s.dailyNewWords}</span>
            <button onclick="window.__app.adjustWords('dailyNewWords', 10)">+</button>
          </div>
        </div>
        <div class="setting-row">
          <label>每日复习词量</label>
          <div class="setting-counter">
            <button onclick="window.__app.adjustWords('dailyReviewWords', -10)">−</button>
            <span id="reviewWordsDisplay">${s.dailyReviewWords}</span>
            <button onclick="window.__app.adjustWords('dailyReviewWords', 10)">+</button>
          </div>
        </div>
      </div>
      <div class="settings-actions">
        <button class="btn btn-danger btn-sm" onclick="window.__app.resetAllData()">重置所有数据</button>
      </div>
    `;

    body.innerHTML = html;
  }

  // 7f. 资源
  function renderResources() {
    const grid = document.getElementById('resourceGrid');
    grid.innerHTML = '';
    RESOURCES.forEach(r => {
      const a = document.createElement('a');
      a.className = 'resource-card';
      a.href = r.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.innerHTML = `
        <div class="resource-icon">${r.icon}</div>
        <div class="resource-info">
          <div class="resource-name">${r.name}</div>
          <div class="resource-desc">${r.desc}</div>
        </div>
        <span class="resource-ext">${r.ext}</span>
      `;
      grid.appendChild(a);
    });
  }

  // 7g. Stat row
  function renderStats() {
    document.getElementById('streakCount').textContent = getStreak();
    document.getElementById('totalDays').textContent = getTotalDays();
    document.getElementById('thisMonthCount').textContent = getThisMonthCount();
  }

  // ============================
  // 8. Toast
  // ============================
  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 2500);
  }

  // ============================
  // 9. Modal
  // ============================
  function openModal(id) {
    document.getElementById('modalOverlay').classList.add('open');
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    document.getElementById(id).style.display = 'flex';
  }

  function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
  }

  // ============================
  // 10. 暴露给全局 (用于内联 onclick)
  // ============================
  const appApi = {
    adjustDailyGoal(delta) {
      const s = data.settings;
      s.dailyGoal = Math.max(1, Math.min(s.enabledTasks.length, s.dailyGoal + delta));
      saveData();
      const el = document.getElementById('goalDisplay');
      if (el) el.textContent = s.dailyGoal;
    },
    toggleSettingTask(taskId) {
      const s = data.settings;
      const idx = s.enabledTasks.indexOf(taskId);
      if (idx >= 0) {
        s.enabledTasks.splice(idx, 1);
      } else {
        s.enabledTasks.push(taskId);
      }
      // 调整 dailyGoal 上限
      if (s.dailyGoal > s.enabledTasks.length) {
        s.dailyGoal = s.enabledTasks.length;
      }
      saveData();
      // 刷新今日任务
      renderToday();
    },
    adjustWords(field, delta) {
      const s = data.settings;
      s[field] = Math.max(10, s[field] + delta);
      saveData();
      const el = document.getElementById(field === 'dailyNewWords' ? 'newWordsDisplay' : 'reviewWordsDisplay');
      if (el) el.textContent = s[field];
    },
    resetAllData() {
      if (confirm('确定要重置所有打卡数据吗？此操作不可撤销！')) {
        data = defaultData();
        saveData();
        renderAll();
        closeModal();
        showToast('已重置所有数据');
      }
    },
  };
  window.__app = appApi;

  // ============================
  // 11. 全量渲染
  // ============================
  function renderAll() {
    renderDate();
    renderToday();
    renderCalendar();
    renderStats();
    renderResources();
  }

  // ============================
  // 12. 事件绑定
  // ============================
  function init() {
    loadData();
    renderAll();

    document.getElementById('btnCheckIn').addEventListener('click', checkIn);
    document.getElementById('btnStats').addEventListener('click', () => {
      renderStatsModal();
      openModal('statsModal');
    });
    document.getElementById('btnSettings').addEventListener('click', () => {
      renderSettingsModal();
      openModal('settingsModal');
    });
    document.getElementById('closeStats').addEventListener('click', closeModal);
    document.getElementById('closeSettings').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeModal();
    });
    document.getElementById('prevMonth').addEventListener('click', () => {
      if (calMonth === 1) { calYear--; calMonth = 12; }
      else calMonth--;
      renderCalendar();
    });
    document.getElementById('nextMonth').addEventListener('click', () => {
      if (calMonth === 12) { calYear++; calMonth = 1; }
      else calMonth++;
      renderCalendar();
    });
  }

  // ============================
  // 13. 启动
  // ============================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
    });

    // PWA service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }

    document.body.classList.add('ready');
