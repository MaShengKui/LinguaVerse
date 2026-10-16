/* ============================================================
   LinguaVerse · 应用主逻辑
   路由 / 视图 / 四大学习会话 / 推荐 / 社区 / 成就
============================================================ */
(function () {
  const D = window.LV_DATA, S = LV.Store, Sp = LV.Speech, Sound = LV.Sound;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const view = $('#view');

  const state = { route: 'dashboard', sess: null };

  const MODULE_META = {
    vocab:   { ico: '🃏', title: '单词记忆', sub: '智能闪卡 · 间隔重复 SRS',
               desc: '翻转卡片检验记忆，系统根据你的熟悉度，在遗忘临界点自动安排复习。',
               points: ['3D 翻转闪卡，正面识词 / 背面释义例句', '英语单词支持 🇬🇧英式 / 🇺🇸美式双音朗读', '卡片背面可一键朗读例句', '认识 / 不认识，自动安排 1-15 天复习周期'] },
    grammar: { ico: '✏️', title: '语法练习', sub: '阶梯题库 · 即时解析',
               desc: '覆盖 A1-C2 核心语法点的选择题训练，作答后即时给出正误与考点讲解。',
               points: ['每语言 12 道精编题，覆盖入门到高阶', '选项乱序，真正检验掌握程度', '每题附中文考点解析', '连续答对触发连击，额外 XP 加成'] },
    speaking:{ ico: '🎙️', title: '口语跟读', sub: 'AI 语音识别 · 逐句打分',
               desc: '先听标准朗读，再对着麦克风跟读，AI 比对原文计算发音相似度。',
               points: ['Web Speech 语音识别实时转写', '0-100 分发音相似度评估', '0.8x / 1.0x 两档语速模仿', '连击加成：连续达标发音奖励翻倍'] },
    listening:{ico: '🎧', title: '听力训练', sub: '母语朗读 · 听写精修',
               desc: 'AI 合成母语级听力句，听写输入后与原文逐字比对，定位听不清的词。',
               points: ['情景句库覆盖日常 / 旅行 / 新闻', '多档语速反复磨耳朵', '听写后逐句对照原文翻译', '连击加成：连续听写正确更有成就感'] },
  };
  const SESS_BASE = { vocab: 10, grammar: 8, speaking: 8, listening: 8 };
  // 数据层统计键名为 speak/listen，这里建立别名，避免模块元信息取不到
  MODULE_META.speak = MODULE_META.speaking;
  MODULE_META.listen = MODULE_META.listening;

  /* ---------------- 小工具 ---------------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; };
  const greeting = () => { const h = new Date().getHours(); return h < 6 ? '夜深了' : h < 12 ? '早上好' : h < 18 ? '下午好' : '晚上好'; };

  let toastTimer;
  function toast(msg, type = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + type; t.textContent = msg;
    $('#toast-root').appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(30px)'; setTimeout(() => t.remove(), 350); }, 2600);
  }
  function openModal(html) { $('#modal-content').innerHTML = html; $('#modal-root').classList.remove('hidden'); }
  function closeModal() { $('#modal-root').classList.add('hidden'); $('#modal-content').innerHTML = ''; }

  const achQueue = [];
  function pushAchievements(list) { list.forEach(a => achQueue.push(a)); drainAch(); }
  function drainAch() {
    const pop = $('#achievement-pop');
    if (pop._busy || !achQueue.length) return;
    pop._busy = true;
    const a = achQueue.shift();
    $('#ach-pop-ico').textContent = a.ico;
    $('#ach-pop-name').textContent = a.name;
    $('#ach-pop-desc').textContent = a.desc + ` · +${a.reward} XP`;
    pop.classList.remove('hidden');
    Sound.play('achieve');
    setTimeout(() => { pop.classList.add('hidden'); pop._busy = false; setTimeout(drainAch, 250); }, 3200);
  }

  /* ---------------- 趣味系统：连击 / 粒子 / 升级 / 每日挑战 ---------------- */
  function showCombo(n) {
    const slot = $('#combo-slot'); if (!slot) return;
    slot.innerHTML = `<div class="combo-badge pop">🔥 x${n} 连击</div>`;
  }
  function breakCombo() {
    const slot = $('#combo-slot'); if (!slot) return;
    const b = slot.firstElementChild;
    if (b) { b.classList.remove('pop'); b.classList.add('break'); setTimeout(() => b.isConnected && b.remove(), 400); }
  }
  // 答对/答错统一入口：维护连击、播放音效、触发粒子
  function bumpCombo(ok, el) {
    const se = state.sess; if (!se) return;
    if (ok) {
      se.combo = (se.combo || 0) + 1;
      se.maxCombo = Math.max(se.maxCombo || 0, se.combo);
      if (se.combo >= 2) showCombo(se.combo);
      Sound.play('correct');
      if (se.combo >= 3) Sound.play('combo', se.combo);
      burst(el);
    } else {
      if ((se.combo || 0) >= 2) breakCombo();
      se.combo = 0;
      Sound.play('wrong');
    }
  }
  function burst(el) {
    const host = el && el.getBoundingClientRect ? el : $('#q-stage .q-card');
    if (!host) return;
    const r = host.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const colors = ['#f59e0b', '#fb923c', '#10b981', '#06b6d4', '#14b8a6', '#f472b6'];
    for (let i = 0; i < 16; i++) {
      const s = document.createElement('span');
      s.className = 'spark';
      const ang = Math.random() * Math.PI * 2, dist = 50 + Math.random() * 80;
      s.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(1) + 'px');
      s.style.setProperty('--dy', (Math.sin(ang) * dist).toFixed(1) + 'px');
      s.style.left = cx + 'px'; s.style.top = cy + 'px';
      s.style.background = colors[i % colors.length];
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 900);
    }
  }
  function showLevelUp(lv) {
    const el = document.createElement('div');
    el.className = 'levelup-pop';
    el.innerHTML = `<div class="lu-inner"><div class="lu-badge">🚀</div><h2>LEVEL UP!</h2><p>恭喜升到 Lv.${lv}，继续冲鸭！</p></div>`;
    document.body.appendChild(el);
    Sound.play('levelup');
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 450); }, 2200);
  }
  // 按日期确定性选取今日挑战模块
  function challengeOfDay() {
    const t = S.dateStr(); let h = 0;
    for (const c of t) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const kinds = ['vocab', 'grammar', 'speaking', 'listening'];
    return { date: t, kind: kinds[h % kinds.length] };
  }

  /* ============================================================
     启动 & 认证
  ============================================================ */
  function init() {
    S.seedDemo();
    bindAuth();
    bindChrome();
    const email = S.currentUser();
    if (email && S.getUsers()[email]) enterApp();
    else showAuth();
  }
  function showAuth() {
    $('#auth-page').classList.remove('hidden');
    $('#app').classList.add('hidden');
  }
  function enterApp() {
    $('#auth-page').classList.add('hidden');
    $('#app').classList.remove('hidden');
    const d = S.db();
    state.lang = d.currentLang;
    refreshChrome();
    navigate('dashboard');
  }

  function bindAuth() {
    $$('.auth-tab').forEach(tab => tab.addEventListener('click', () => {
      $$('.auth-tab').forEach(t => t.classList.toggle('active', t === tab));
      const isLogin = tab.dataset.tab === 'login';
      $('#login-form').classList.toggle('hidden', !isLogin);
      $('#register-form').classList.toggle('hidden', isLogin);
    }));
    $('#login-form').addEventListener('submit', e => {
      e.preventDefault();
      try {
        S.login({ account: $('#login-account').value, password: $('#login-password').value });
        toast('欢迎回到 LinguaVerse！', 'ok');
        enterApp();
      } catch (err) { toast(err.message, 'no'); }
    });
    $('#register-form').addEventListener('submit', e => {
      e.preventDefault();
      try {
        S.register({
          name: $('#reg-name').value, email: $('#reg-email').value, password: $('#reg-password').value,
          lang: $('#reg-lang').value, goal: $('#reg-goal').value,
        });
        toast('账号创建成功，开启你的语言旅程！', 'ok');
        enterApp();
      } catch (err) { toast(err.message, 'no'); }
    });
  }

  function bindChrome() {
    const setSidebar = (open) => {
      $('.sidebar').classList.toggle('open', open);
      $('#sidebar-mask').classList.toggle('show', open);
    };
    $('#nav-list').addEventListener('click', e => {
      const item = e.target.closest('.nav-item');
      if (!item) return;
      navigate(item.dataset.route);
      setSidebar(false);
    });
    $('#menu-btn').addEventListener('click', () => setSidebar(!$('.sidebar').classList.contains('open')));
    $('#sidebar-mask').addEventListener('click', () => setSidebar(false));
    $$('.lang-btn').forEach(b => b.addEventListener('click', () => {
      if (state.sess) { toast('练习进行中，完成后再切换语言吧', 'no'); return; }
      const lang = b.dataset.lang;
      S.update(d => d.currentLang = lang);
      state.lang = lang;
      $$('.lang-btn').forEach(x => x.classList.toggle('active', x === b));
      render();
      toast(`已切换至${D.LANGS[lang].name}`);
    }));
    $('#user-btn').addEventListener('click', () => $('#user-dropdown').classList.toggle('hidden'));
    document.addEventListener('click', e => {
      if (!e.target.closest('#user-menu')) $('#user-dropdown').classList.add('hidden');
      if (e.target.matches('[data-close]')) closeModal();
    });
    $('#user-dropdown').addEventListener('click', e => {
      const a = e.target.closest('a');
      if (!a) return;
      $('#user-dropdown').classList.add('hidden');
      if (a.dataset.action === 'logout') { Sp.stop(); S.logout(); location.reload(); }
      if (a.dataset.action === 'profile') openProfileModal();
      if (a.dataset.action === 'goal') openGoalModal();
      if (a.dataset.action === 'sound') {
        const on = Sound.toggle();
        a.textContent = (on ? '🔊' : '🔇') + ' 练习音效';
        toast(on ? '音效已开启' : '音效已关闭');
      }
    });
  }

  function openProfileModal() {
    const u = S.getUsers()[S.currentUser()];
    openModal(`
      <h3>👤 个人资料</h3>
      <label>昵称<input id="m-name" value="${esc(u.name)}"></label>
      <label>邮箱<input value="${esc(u.email)}" disabled style="opacity:.55"></label>
      <div style="display:flex;gap:10px;margin-top:6px">
        <button class="btn btn-ghost" data-close style="flex:1">取消</button>
        <button class="btn btn-primary" id="m-save" style="flex:1">保存</button>
      </div>`);
    $('#m-save').onclick = () => {
      const name = $('#m-name').value.trim();
      if (!name) return toast('昵称不能为空', 'no');
      S.updateProfile({ name });
      closeModal(); refreshChrome(); toast('资料已更新', 'ok');
    };
  }
  function openGoalModal() {
    const d = S.db();
    openModal(`
      <h3>🎯 修改每日目标</h3>
      <label>每日经验值目标
        <select id="m-goal">
          <option value="10" ${d.dailyGoal == 10 ? 'selected' : ''}>轻松 · 10 XP（约 5 分钟）</option>
          <option value="30" ${d.dailyGoal == 30 ? 'selected' : ''}>常规 · 30 XP（约 15 分钟）</option>
          <option value="60" ${d.dailyGoal == 60 ? 'selected' : ''}>冲刺 · 60 XP（约 30 分钟）</option>
        </select>
      </label>
      <div style="display:flex;gap:10px;margin-top:6px">
        <button class="btn btn-ghost" data-close style="flex:1">取消</button>
        <button class="btn btn-primary" id="m-goal-save" style="flex:1">保存</button>
      </div>`);
    $('#m-goal-save').onclick = () => {
      const goal = Number($('#m-goal').value);
      S.update(d => d.dailyGoal = goal);
      S.updateProfile({ goal });
      closeModal(); refreshChrome(); toast('每日目标已更新', 'ok');
    };
  }

  let lastXpShown = null;
  function refreshChrome() {
    const d = S.db(); if (!d) return;
    const u = S.getUsers()[S.currentUser()];
    $('#top-streak').textContent = d.streak;
    const xpEl = $('#top-xp');
    if (lastXpShown != null && d.xp !== lastXpShown) {
      xpEl.classList.remove('bump'); void xpEl.offsetWidth; xpEl.classList.add('bump');
    }
    lastXpShown = d.xp;
    xpEl.textContent = d.xp;
    $('#top-level').textContent = 'Lv.' + S.levelOf(d.xp);
    $('#top-username').textContent = u.name;
    $('#top-avatar').textContent = (u.name[0] || 'U').toUpperCase();
    $$('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === d.currentLang));
    const pct = Math.min(100, Math.round(d.dailyXp / d.dailyGoal * 100));
    $('#sidebar-goal-text').textContent = `${d.dailyXp} / ${d.dailyGoal} XP`;
    $('#goal-pct').textContent = pct + '%';
    const C = 2 * Math.PI * 17.5;
    $('#goal-ring-fg').style.strokeDashoffset = C * (1 - pct / 100);
  }

  /* ============================================================
     路由
  ============================================================ */
  const routes = {
    dashboard: renderDashboard, courses: renderCourses,
    vocab: () => renderModuleHome('vocab'), grammar: () => renderModuleHome('grammar'),
    speaking: () => renderModuleHome('speaking'), listening: () => renderModuleHome('listening'),
    progress: renderProgress, community: renderCommunity, achievements: renderAchievements,
  };
  function navigate(route) {
    state.route = route; state.sess = null; Sp.stop();
    $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.route === route));
    render();
    window.scrollTo({ top: 0 });
  }
  function render() { (routes[state.route] || renderDashboard)(); }

  /* ============================================================
     仪表盘
  ============================================================ */
  function nextLessonIndex(d, lang) {
    const arr = D.COURSES[lang];
    for (let i = 0; i < arr.length; i++) if (!S.isLessonDone(d, lang, i)) return i;
    return null;
  }
  function buildRecommendations(d) {
    const recs = [];
    const lang = d.currentLang;
    const langInfo = D.LANGS[lang];

    // 1. 到期复习
    let due = 0;
    Object.keys(D.LANGS).forEach(l => { due += S.dueWords(l); });
    if (due > 0)
      recs.push({ ico: '🔁', title: `${due} 个单词到了复习时间`, body: '间隔重复算法提醒你：现在复习，记忆最牢固。',
        reason: 'SRS 智能复习', act: 'start-practice', kind: 'vocab' });

    // 2. 继续课程路径
    const ni = nextLessonIndex(d, lang);
    if (ni != null) {
      const lesson = D.COURSES[lang][ni];
      recs.push({ ico: lesson.icon, title: `继续${langInfo.name}路径：${lesson.title}`,
        body: `${lesson.level} · ${lesson.desc}`, reason: '下一课程', act: 'start-lesson', i: ni });
    }

    // 3. 最弱技能
    const weak = ['vocab', 'grammar', 'speak', 'listen']
      .map(k => ({ k, ...d.moduleStats[k] }))
      .filter(x => x.count >= 4)
      .sort((a, b) => (a.right / a.count) - (b.right / b.count))[0];
    if (weak && weak.right / weak.count < 0.8)
      recs.push({ ico: MODULE_META[weak.k].ico, title: `补强你的${MODULE_META[weak.k].title}`,
        body: `最近正确率 ${Math.round(weak.right / weak.count * 100)}%，针对性练一组吧。`,
        reason: '个性化补强', act: 'start-practice', kind: weak.k });

    // 4. 多语探索
    const langsTried = Object.keys(D.LANGS).filter(l =>
      d.words[l].some(w => w.seen) || Object.keys(d.lessons).some(k => k.startsWith(l + '-')));
    if (langsTried.length < 3 && d.xp > 150) {
      const other = Object.keys(D.LANGS).find(l => !langsTried.includes(l));
      if (other)
        recs.push({ ico: D.LANGS[other].flag, title: `试试${D.LANGS[other].name}？`,
          body: '多语言者大脑更灵活，花 5 分钟开启一门新语言。', reason: '探索推荐', act: 'switch-lang', lang: other });
    }

    // 5. 今日尚未学习 / 新手
    const studiedToday = d.dailyDate === S.dateStr() && d.dailyXp > 0;
    if (!studiedToday && recs.length < 3)
      recs.push({ ico: '🚀', title: d.xp === 0 ? '开启你的第一节课' : '完成今日学习目标',
        body: d.xp === 0 ? '从分级课程的第一节开始，迈出语言宇宙第一步。' : `再获得 ${Math.max(0, d.dailyGoal - d.dailyXp)} XP 即可达成每日目标。`,
        reason: d.xp === 0 ? '新手启航' : '连续打卡', act: ni != null ? 'start-lesson' : 'start-practice', i: ni || 0, kind: 'vocab' });

    return recs.slice(0, 3);
  }

  function renderDashboard() {
    const d = S.db();
    const lang = d.currentLang, info = D.LANGS[lang];
    const m = S.metrics(d);
    const recs = buildRecommendations(d);
    const ni = nextLessonIndex(d, lang);
    const mastered = Object.keys(D.LANGS).reduce((s, l) => s + d.words[l].filter(w => w.box >= 2).length, 0);
    const recentAch = Object.keys(d.unlocked).slice(-3).reverse()
      .map(id => D.ACHIEVEMENTS.find(a => a.id === id)).filter(Boolean);
    const ch = challengeOfDay();
    const chDone = d.challenge && d.challenge.date === ch.date && d.challenge.done;

    view.innerHTML = `
      <div class="hero">
        <h2>${greeting()}，${esc(S.getUsers()[S.currentUser()].name)}！</h2>
        <p>当前学习：<b>${info.flag} ${info.name} ${info.native}</b> · ${info.desc}。${
          ni != null ? `下一节「${D.COURSES[lang][ni].title}」正在等你。` : '你已完成当前语言全部课程，保持复习巩固吧！'}</p>
        ${ni != null ? `<button class="btn btn-primary" data-act="start-lesson" data-i="${ni}">${D.COURSES[lang][ni].icon} 继续学习 · +${D.COURSES[lang][ni].xp} XP</button>`
          : `<button class="btn btn-primary" data-act="start-practice" data-kind="vocab">🔁 去复习单词</button>`}
      </div>

      <div class="challenge-strip ${chDone ? 'done' : ''}" data-act="start-practice" data-kind="${ch.kind}">
        <span class="ch-ico">${MODULE_META[ch.kind].ico}</span>
        <div>
          <b>今日挑战 · ${MODULE_META[ch.kind].title}</b>
          <p>${chDone ? '已完成，双倍奖励已入账，明天再来！' : `限时加成：完成一组${MODULE_META[ch.kind].title}，本组 XP×2！`}</p>
        </div>
        <span class="ch-badge">${chDone ? '✅ 已达成' : 'XP×2'}</span>
      </div>

      <div class="grid stat-grid">
        ${[
          ['🔥', d.streak, '连续学习天数', 'flame'],
          ['⚡', d.xp, '累计经验值 XP', ''],
          ['🃏', mastered, '已掌握单词', ''],
          ['📚', m.totalLessons, '完成课程数', ''],
        ].map(([ico, val, label]) => `
          <div class="card stat-card">
            <div class="s-ico">${ico}</div>
            <div class="s-val">${val}</div>
            <div class="s-label">${label}</div>
          </div>`).join('')}
      </div>

      <div class="section-title"><h3>✨ 为你推荐</h3><span class="text-dim text-sm">基于你的学习数据智能生成</span></div>
      <div class="grid rec-grid">
        ${recs.map(r => `
          <div class="card rec-card hoverable" data-act="${r.act}" ${r.kind ? `data-kind="${r.kind}"` : ''} ${r.i != null ? `data-i="${r.i}"` : ''} ${r.lang ? `data-lang="${r.lang}"` : ''}>
            <div class="r-ico">${r.ico}</div>
            <h4>${esc(r.title)}</h4>
            <p>${esc(r.body)}</p>
            <span class="rec-reason">${r.reason}</span>
          </div>`).join('')}
      </div>

      <div class="section-title"><h3>⚡ 快速练习</h3></div>
      <div class="mini-actions">
        ${['vocab', 'grammar', 'speaking', 'listening'].map(k => `
          <div class="action-tile" data-act="start-practice" data-kind="${k}">
            <span class="a-ico">${MODULE_META[k].ico}</span>
            <b>${MODULE_META[k].title}</b>
            <small>${MODULE_META[k].sub}</small>
          </div>`).join('')}
      </div>

      <div class="section-title"><h3>🏅 最近成就</h3><span class="more" data-act="route" data-r="achievements">查看全部 →</span></div>
      <div class="grid ach-grid" style="grid-template-columns:repeat(3,1fr)">
        ${recentAch.length ? recentAch.map(a => `
          <div class="card ach-tile">
            <span class="ach-medal">${a.ico}</span>
            <h4>${a.name}</h4>
            <p>${a.desc}</p>
          </div>`).join('') : `
          <div class="card" style="grid-column:1/-1;text-align:center;color:var(--text-dim);padding:26px">
            还没有解锁成就，完成第一节课即可获得 🌱 初语者徽章
          </div>`}
      </div>`;
  }

  /* ============================================================
     分级课程
  ============================================================ */
  function renderCourses() {
    const d = S.db();
    const lang = d.currentLang, info = D.LANGS[lang];
    const courses = D.COURSES[lang];
    const doneCount = courses.filter((_, i) => S.isLessonDone(d, lang, i)).length;
    const typeName = { vocab: '单词', grammar: '语法', speaking: '口语', listening: '听力' };

    view.innerHTML = `
      <div class="page-head">
        <h2>${info.flag} ${info.name}分级课程</h2>
        <p>参照 CEFR 欧标体系，A1 → C2 六级闯关，共 ${courses.length} 节 · 已完成 ${doneCount} 节</p>
      </div>
      <div class="card" style="margin-bottom:24px">
        <div class="level-legend">
          ${D.LEVELS.map(l => `<span class="lvl-pill"><b>${l.code}</b> ${l.name} · ${l.desc}</span>`).join('')}
        </div>
        <div class="progress-bar" style="margin-top:12px"><i style="width:${Math.round(doneCount / courses.length * 100)}%"></i></div>
      </div>
      <div class="path">
        ${courses.map((lesson, i) => {
          const done = S.isLessonDone(d, lang, i);
          const locked = i !== 0 && !S.isLessonDone(d, lang, i - 1);
          return `
          <div class="lesson-node ${done ? 'done' : ''} ${locked ? 'locked' : ''}"
               data-act="${locked ? 'locked' : 'start-lesson'}" data-i="${i}">
            <div class="node-ico"><span>${lesson.icon}</span></div>
            <div class="lesson-info">
              <h4>${lesson.title}
                <span class="badge-tag tag-${info.cls}" style="margin-left:8px">${lesson.level}</span>
                <span class="badge-tag tag-type" style="margin-left:6px">${typeName[lesson.type]}</span>
              </h4>
              <p>${lesson.desc}</p>
            </div>
            <div class="lesson-meta">
              ${locked ? '<span class="lock-ico">🔒</span>'
                : done ? `<span class="text-dim text-sm">已完成 · +${lesson.xp} XP</span>`
                : `<button class="btn btn-primary btn-sm">开始 · +${lesson.xp} XP</button>`}
            </div>
          </div>`;
        }).join('')}
      </div>`;
  }

  /* ============================================================
     模块主页
  ============================================================ */
  function renderModuleHome(kind) {
    const d = S.db();
    const info = D.LANGS[d.currentLang];
    const meta = MODULE_META[kind];
    const stat = d.moduleStats[{ speaking: 'speak', listening: 'listen' }[kind] || kind];
    const acc = stat.count ? Math.round(stat.right / stat.count * 100) : 0;
    const extra = kind === 'vocab'
      ? `<div class="card stat-card"><div class="s-ico">🔁</div><div class="s-val">${S.dueWords(d.currentLang)}</div><div class="s-label">待复习单词</div></div>`
      : kind === 'speaking' && !Sp.recognitionSupported
        ? `<div class="card" style="grid-column:1/-1;border-color:rgba(255,165,2,.4);background:rgba(255,165,2,.08)">
             <b style="color:var(--warn)">⚠️ 当前浏览器不支持实时语音识别</b>
             <p class="text-dim text-sm" style="margin-top:6px">建议使用 Chrome / Edge 浏览器获得麦克风打分体验；其他浏览器可使用"练习模式"跟读。</p></div>`
        : '';

    view.innerHTML = `
      <div class="page-head">
        <h2>${meta.ico} ${meta.title} <span class="badge-tag tag-${info.cls}" style="vertical-align:middle;margin-left:6px">${info.flag} ${info.name}</span></h2>
        <p>${meta.sub}</p>
      </div>
      <div class="grid dash-grid">
        <div class="card">
          <h3 style="margin-bottom:10px">训练说明</h3>
          <p class="text-dim" style="font-size:14px;line-height:1.8;margin-bottom:16px">${meta.desc}</p>
          <ul style="list-style:none;padding:0;margin:0">
            ${meta.points.map(p => `<li style="padding:7px 0;color:var(--text-dim);font-size:13.5px">✅ ${p}</li>`).join('')}
          </ul>
          <button class="btn btn-primary" style="width:100%;margin-top:18px" data-act="start-practice" data-kind="${kind}">🚀 开始一组练习</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:18px">
          <div class="grid" style="grid-template-columns:1fr 1fr">
            <div class="card stat-card"><div class="s-ico">📊</div><div class="s-val">${stat.count}</div><div class="s-label">累计训练题量</div></div>
            <div class="card stat-card"><div class="s-ico">🎯</div><div class="s-val">${stat.count ? acc + '%' : '—'}</div><div class="s-label">历史正确率</div></div>
          </div>
          ${extra}
        </div>
      </div>`;
  }

  /* ============================================================
     学习会话引擎
  ============================================================ */
  function startSession(kind, lessonCtx = null) {
    const lang = lessonCtx ? state.lang : S.db().currentLang;
    if (!lessonCtx && lang !== state.lang) state.lang = lang;
    const items = pickItems(kind, lang);
    state.sess = { kind, lang, items, i: 0, right: 0, scoreSum: 0, locked: false, lessonCtx, combo: 0, maxCombo: 0 };
    state.route = kind;
    $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.route === kind));
    renderSessionShell();
    renderItem();
  }

  function pickItems(kind, lang) {
    const d = S.db();
    if (kind === 'vocab') {
      const pool = D.VOCAB[lang], t = S.dateStr();
      const states = d.words[lang];
      const due = states.filter(w => w.box < 5 && w.due <= t).map(w => w.idx);
      const seen = new Set(states.map(w => w.idx));
      const fresh = pool.map((_, i) => i).filter(i => !seen.has(i));
      const ids = [...new Set([...due, ...fresh])];
      while (ids.length < 8) { const r = Math.floor(Math.random() * pool.length); if (!ids.includes(r)) ids.push(r); }
      return shuffle(ids).slice(0, 8).map(idx => ({ ...pool[idx], idx }));
    }
    if (kind === 'grammar') {
      return shuffle(D.GRAMMAR[lang]).slice(0, 8).map(q => {
        const order = shuffle(q.options.map((_, i) => i));
        return { q: q.q, options: order.map(i => q.options[i]), answer: order.indexOf(q.answer), tip: q.tip };
      });
    }
    if (kind === 'speaking') return shuffle(D.SPEAK[lang]).slice(0, 6).map(x => ({ ...x }));
    return shuffle(D.LISTEN[lang]).slice(0, 6).map(x => ({ ...x }));
  }

  function renderSessionShell() {
    const se = state.sess;
    const meta = MODULE_META[se.kind];
    const title = se.lessonCtx ? D.COURSES[se.lang][se.lessonCtx.index].title : `${D.LANGS[se.lang].name} · ${meta.title}`;
    view.innerHTML = `
      <div class="session">
        <div class="session-top">
          <button class="quit" data-act="quit">← 退出</button>
          <div class="session-progress"><i style="width:0%"></i></div>
          <div class="session-count"><b>${title}</b></div>
        </div>
        <div id="q-stage"></div>
      </div>`;
  }
  function updateSessProgress() {
    const se = state.sess;
    $('.session-progress i').style.width = Math.round(se.i / se.items.length * 100) + '%';
    $('.session-count b').textContent = `${se.i + 1} / ${se.items.length}`;
  }
  function renderItem() {
    const se = state.sess;
    se.locked = false;
    updateSessProgress();
    ({ vocab: renderVocabItem, grammar: renderGrammarItem, speaking: renderSpeakItem, listening: renderListenItem }[se.kind])();
    if ((se.combo || 0) >= 2) showCombo(se.combo); // 连击徽章跨题常驻
  }

  /* ---- 单词闪卡 ---- */
  function renderVocabItem() {
    const se = state.sess, it = se.items[se.i], info = D.LANGS[se.lang];
    const front = se.lang === 'en' ? `
              <div class="ukus-row">
                <button class="accent-pill" data-act="sound-accent" data-accent="uk">🇬🇧 UK <code>${esc(it.uk || '')}</code></button>
                <button class="accent-pill" data-act="sound-accent" data-accent="us">🇺🇸 US <code>${esc(it.us || '')}</code></button>
              </div>`
      : `
              <button class="sound-btn" data-act="sound">🔊</button>
              ${it.r ? `<div class="fc-ipa">${esc(it.r)}</div>` : ''}`;
    $('#q-stage').innerHTML = `
      <div class="q-card">
        <div id="combo-slot"></div>
        <div class="q-type">单词记忆 · 点击卡片翻面</div>
        <div class="flashcard-stage">
          <div class="flashcard" id="flashcard">
            <div class="fc-face">
              <div class="fc-word ${info.cls}">${esc(it.w)}</div>
              ${front}
              <div class="fc-hint">👆 点击卡片查看释义${se.lang === 'en' ? ' · 点国旗听英/美音' : ''}</div>
            </div>
            <div class="fc-face fc-back">
              <div class="fc-trans">${esc(it.t)}</div>
              <div class="fc-example"><b>${esc(it.ex)}</b><br>${esc(it.exT)}</div>
              <button class="sound-btn ex-sm" data-act="sound-example" title="朗读例句">🔊 朗读例句</button>
            </div>
          </div>
        </div>
        <div class="session-actions">
          <button class="btn btn-ghost" data-act="vocab-grade" data-known="0" style="border-color:rgba(244,63,94,.4);color:#e11d48">😕 还不认识</button>
          <button class="btn btn-primary" data-act="vocab-grade" data-known="1">😎 认识</button>
        </div>
      </div>`;
    $('#flashcard').addEventListener('click', e => {
      if (!e.target.closest('.sound-btn,.accent-pill')) { e.currentTarget.classList.toggle('flipped'); Sound.play('flip'); }
    });
  }

  /* ---- 语法选择 ---- */
  function renderGrammarItem() {
    const se = state.sess, it = se.items[se.i];
    $('#q-stage').innerHTML = `
      <div class="q-card">
        <div id="combo-slot"></div>
        <div class="q-type">语法练习 · 选择正确答案</div>
        <div style="font-size:22px;font-weight:800;line-height:1.7;padding:20px 6px">${esc(it.q).replace(/_{2,}|＿{2,}/g, '<span style="color:var(--brand-2)">______</span>')}</div>
        <div class="choices">
          ${it.options.map((o, i) => `<button class="choice" data-act="grammar-answer" data-i="${i}">${esc(o)}</button>`).join('')}
        </div>
        <div id="gf"></div>
        <div class="session-actions" id="ga" style="visibility:hidden">
          <button class="btn btn-primary" data-act="next">下一题 →</button>
        </div>
      </div>`;
  }

  /* ---- 口语跟读 ---- */
  function renderSpeakItem() {
    const se = state.sess, it = se.items[se.i], info = D.LANGS[se.lang];
    $('#q-stage').innerHTML = `
      <div class="q-card">
        <div id="combo-slot"></div>
        <div class="q-type">口语跟读 · 先听后跟读</div>
        <div class="speak-stage">
          <div class="speak-target ${info.cls}">${esc(it.text)}</div>
          <div class="speak-hint">${esc(it.trans)}</div>
          <div class="speed-row">
            <button class="speed-btn" data-act="speak-play" data-rate="0.8">🐢 慢速</button>
            <button class="speed-btn active" data-act="speak-play" data-rate="1">🔊 标准语速</button>
          </div>
          <button class="mic-btn" id="mic-btn" data-act="mic" title="按住点击跟读">🎤</button>
          <div class="speak-hint" id="mic-hint">点击麦克风，朗读上方句子</div>
        </div>
        <div id="spf"></div>
        <div class="session-actions" id="spa" style="visibility:hidden">
          ${Sp.recognitionSupported ? '' : `<button class="btn btn-ghost" data-act="speak-practice">📖 我已大声跟读（练习模式）</button>`}
          <button class="btn btn-primary" data-act="next">下一句 →</button>
        </div>
      </div>`;
  }

  /* ---- 听力训练 ---- */
  function renderListenItem() {
    const se = state.sess, info = D.LANGS[se.lang];
    $('#q-stage').innerHTML = `
      <div class="q-card">
        <div id="combo-slot"></div>
        <div class="q-type">听力训练 · 听写你听到的句子</div>
        <div class="listen-audio">
          <button class="sound-btn" data-act="listen-play" data-rate="1">🔊</button>
          <div class="wave paused" id="wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        </div>
        <div class="speed-row" style="margin-bottom:14px">
          <button class="speed-btn" data-act="listen-play" data-rate="0.7">0.7x 慢速</button>
          <button class="speed-btn active" data-act="listen-play" data-rate="1">1.0x 标准</button>
          <button class="speed-btn" data-act="listen-play" data-rate="1.2">1.2x 快速</button>
        </div>
        <input class="listen-input" id="listen-input" placeholder="${se.lang === 'en' ? 'Type what you hear…' : '请输入你听到的句子'}" />
        <div class="session-actions">
          <button class="btn btn-ghost" data-act="listen-skip">👀 直接看答案</button>
          <button class="btn btn-primary" data-act="listen-check">提交答案</button>
        </div>
        <div id="lf"></div>
      </div>`;
    setTimeout(() => $('#listen-input') && $('#listen-input').focus(), 100);
  }

  /* ---------------- 会话事件委托 ---------------- */
  view.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    const se = state.sess;

    /* 全局路由类 */
    if (act === 'route') return navigate(b.dataset.r);
    if (act === 'switch-lang') {
      const lang = b.dataset.lang;
      S.update(d => d.currentLang = lang);
      state.lang = lang; $$('.lang-btn').forEach(x => x.classList.toggle('active', x.dataset.lang === lang));
      toast(`已切换至${D.LANGS[lang].name}，加油！`);
      return render();
    }
    if (act === 'start-practice') { state.lang = S.db().currentLang; return startSession(b.dataset.kind); }
    if (act === 'start-lesson') {
      const i = Number(b.dataset.i);
      const d = S.db();
      if (i !== 0 && !S.isLessonDone(d, d.currentLang, i - 1)) return toast('先完成上一节课才能解锁哦', 'no');
      const lesson = D.COURSES[d.currentLang][i];
      state.lang = d.currentLang;
      return startSession(lesson.type, { index: i, xp: lesson.xp });
    }
    if (act === 'locked') return toast('完成上一节后自动解锁 🔒', 'no');
    if (!se) return;
    if (act === 'quit') {
      if (se.i > 0 && !confirm('确定退出本次练习吗？本次进度将不计入成绩。')) return;
      return navigate(se.lessonCtx ? 'courses' : se.kind);
    }
    if (act === 'next') return nextItem();
    if (se.locked && !['next', 'quit'].includes(act)) return;

    const info = D.LANGS[se.lang];
    const it = se.items[se.i];

    /* 闪卡 */
    if (act === 'sound') { e.stopPropagation(); return Sp.speak(it.w, info.bcp47); }
    if (act === 'sound-accent') {
      e.stopPropagation(); Sound.play('click');
      return Sp.speak(it.w, b.dataset.accent === 'uk' ? 'en-GB' : 'en-US');
    }
    if (act === 'sound-example') { e.stopPropagation(); Sound.play('click'); return Sp.speak(it.ex, info.bcp47); }
    if (act === 'vocab-grade') {
      const known = b.dataset.known === '1';
      S.gradeWord(se.lang, it.idx, known);
      if (known) se.right++;
      bumpCombo(known, b);
      return nextItem();
    }

    /* 语法 */
    if (act === 'grammar-answer') {
      if (se.locked) return;
      se.locked = true;
      const chosen = Number(b.dataset.i);
      const ok = chosen === it.answer;
      if (ok) se.right++;
      bumpCombo(ok, b);
      $$('.choice').forEach((c, i) => {
        c.disabled = true;
        if (i === it.answer) c.classList.add('correct');
        else if (i === chosen) c.classList.add('wrong');
      });
      $('#gf').innerHTML = `<div class="feedback ${ok ? 'ok' : 'no'}">
        ${ok ? '🎉 <b>回答正确！</b>' : `❌ <b>正确答案：${esc(it.options[it.answer])}</b>`}<br>${esc(it.tip)}</div>`;
      $('#ga').style.visibility = 'visible';
      return;
    }

    /* 口语 */
    if (act === 'speak-play') {
      $$('.speed-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      return Sp.speak(it.text, info.bcp47, Number(b.dataset.rate));
    }
    if (act === 'mic') {
      if (!Sp.recognitionSupported) return toast('当前浏览器不支持语音识别，可用练习模式', 'no');
      const mic = $('#mic-btn'), hint = $('#mic-hint');
      mic.classList.add('recording'); hint.textContent = '🎧 正在聆听，请大声朗读…';
      try {
        const said = await Sp.recognize(info.bcp47, se.lang, 7000);
        const score = Sp.similarity(it.text, said, se.lang);
        se.scoreSum += score;
        if (score >= 60) se.right++;
        se.locked = true;
        bumpCombo(score >= 60, mic);
        const grade = score >= 85 ? '太棒了，接近母语！' : score >= 60 ? '不错，继续保持！' : '再多听几遍，注意发音细节';
        $('#spf').innerHTML = `<div class="feedback ${score >= 60 ? 'ok' : 'no'}">
          <div class="score-orb" style="--pct:${score};background:conic-gradient(${score >= 60 ? 'var(--brand-2)' : 'var(--bad)'} ${score * 3.6}deg,rgba(255,255,255,.08) 0)">
            <span>${score}</span></div>
          <b>识别结果：</b>${esc(said)}<br><b>评分：</b>${score}/100 · ${grade}</div>`;
        $('#spa').style.visibility = 'visible';
      } catch (err) {
        const msg = String(err.message || err);
        hint.textContent = msg === 'not-allowed' || msg === 'service-not-allowed'
          ? '⚠️ 麦克风权限被拒绝，请在浏览器地址栏允许麦克风'
          : '没有听清，请再试一次';
      } finally { mic.classList.remove('recording'); }
      return;
    }
    if (act === 'speak-practice') {
      se.scoreSum += 70;
      bumpCombo(true, b);
      return nextItem();
    }

    /* 听力 */
    if (act === 'listen-play') {
      $$('.speed-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      const wave = $('#wave');
      if (wave) wave.classList.remove('paused');
      return Sp.speak(it.text, info.bcp47, Number(b.dataset.rate)).then(() => wave && wave.classList.add('paused'));
    }
    if (act === 'listen-check' || act === 'listen-skip') {
      if (se.locked) return;
      const input = $('#listen-input');
      const said = act === 'listen-skip' ? '' : input.value.trim();
      if (act === 'listen-check' && !said) return toast('先写下你听到的内容，或点"直接看答案"', 'no');
      se.locked = true;
      const score = said ? Sp.similarity(it.text, said, se.lang) : 0;
      if (score >= 60) se.right++;
      bumpCombo(score >= 60, b);
      $('#lf').innerHTML = `<div class="feedback ${score >= 60 ? 'ok' : 'no'}">
        ${score >= 60 ? `🎉 <b>听写成功！得分 ${score}/100</b>` : said ? `📝 <b>得分 ${score}/100</b>，对照原文再听一遍` : '👀 <b>原文对照</b>'}<br>
        <div class="listen-reveal"><b>原文：</b>${esc(it.text)}<br><b>翻译：</b>${esc(it.trans)}</div></div>`;
      input.disabled = true;
      b.parentElement.style.display = 'none';
      const actions = document.createElement('div');
      actions.className = 'session-actions';
      actions.innerHTML = `<button class="btn btn-primary" data-act="next">下一句 →</button>`;
      $('#lf').after(actions);
      return;
    }
  });

  function nextItem() {
    const se = state.sess;
    se.i++;
    if (se.i >= se.items.length) finishSession();
    else renderItem();
  }

  function finishSession() {
    const se = state.sess;
    const total = se.items.length;
    const right = se.right;
    const perfect = right === total;
    // 基础 XP：口语=基础+发音分换算；其他=基础+每题正确 2 XP
    const avgScore = se.scoreSum / Math.max(total, 1);
    const base = se.kind === 'speaking'
      ? SESS_BASE.speaking + Math.min(10, Math.round(avgScore / 10))
      : SESS_BASE[se.kind] + right * 2;
    // 连击加成：本次最大连击数 1:1 兑换 XP，上限 8
    const comboBonus = Math.min(se.maxCombo || 0, 8);
    let finalXp = base + comboBonus;
    // 每日挑战：类型匹配且今日未完成 → 本组 XP×2
    const ch = challengeOfDay();
    const d0 = S.db();
    const chHit = se.kind === ch.kind && !(d0.challenge && d0.challenge.date === ch.date && d0.challenge.done);
    if (chHit) {
      finalXp *= 2;
      S.update(x => { x.challenge = { date: ch.date, kind: ch.kind, done: true }; });
      toast('🎯 今日挑战达成！XP×2 已入账', 'ok');
    }

    const lvBefore = S.levelOf(S.db().xp);
    S.addXp(finalXp);
    const lvAfter = S.levelOf(S.db().xp);
    if (lvAfter > lvBefore) setTimeout(() => showLevelUp(lvAfter), 600);

    // 数据层统计键名：speaking→speak, listening→listen
    const statKey = { speaking: 'speak', listening: 'listen' }[se.kind] || se.kind;
    const popped = S.recordSession(statKey, { total, right, perfect });
    let lessonPop = [], lessonNew = false;
    if (se.lessonCtx) {
      const r = S.completeLesson(se.lang, se.lessonCtx.index, se.lessonCtx.xp, perfect);
      lessonPop = r.achievements; lessonNew = r.newly;
    }
    pushAchievements([...popped, ...lessonPop]);
    Sound.play('finish');
    refreshChrome();
    renderResult({ total, right, xp: finalXp + (lessonNew ? se.lessonCtx.xp : 0), perfect,
      lessonNew, lessonXp: lessonNew ? se.lessonCtx.xp : 0,
      base, comboBonus, chHit, maxCombo: se.maxCombo || 0 });
  }

  function renderResult({ total, right, xp, perfect, lessonNew, lessonXp, base, comboBonus, chHit, maxCombo }) {
    const se = state.sess;
    const acc = Math.round(right / total * 100);
    const title = perfect ? '完美通关！' : acc >= 60 ? '训练完成！' : '继续加油！';
    const emoji = perfect ? '🏆' : acc >= 60 ? '🎉' : '💪';
    const meta = MODULE_META[se.kind];
    const stars = perfect ? 3 : acc >= 70 ? 2 : acc >= 40 ? 1 : 0;
    const detail = [`基础 +${base}`];
    if (comboBonus > 0) detail.push(`连击 +${comboBonus}`);
    if (chHit) detail.push(`今日挑战 ×2`);
    if (lessonNew) detail.push(`课程奖励 +${lessonXp}`);
    $('#q-stage').innerHTML = `
      <div class="result-card card">
        <div class="result-emoji">${emoji}</div>
        <div class="stars">${[1, 2, 3].map(i => `<span class="st ${i <= stars ? 'on' : ''}" style="animation-delay:${(0.15 + i * 0.18).toFixed(2)}s">★</span>`).join('')}</div>
        <h2>${title}</h2>
        <p class="text-dim">${D.LANGS[se.lang].name} · ${meta.title}${se.lessonCtx ? ' · ' + esc(D.COURSES[se.lang][se.lessonCtx.index].title) : ''}</p>
        <div class="result-xp">⚡ +${xp} XP</div>
        <p class="text-sm" style="color:var(--text-faint)">${detail.join(' · ')}</p>
        <div class="result-stats">
          <div><b>${right}/${total}</b><span>正确题数</span></div>
          <div><b>${acc}%</b><span>正确率</span></div>
          <div><b>🔥 ${maxCombo}</b><span>最大连击</span></div>
        </div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-ghost" data-act="after-session" data-to="${se.lessonCtx ? 'courses' : 'dashboard'}">${se.lessonCtx ? '返回课程路径' : '回到仪表盘'}</button>
          <button class="btn btn-primary" data-act="after-session" data-to="again">🔁 再练一组</button>
        </div>
      </div>`;
    // 结算页按钮单独绑定（会话委托在 next 后仍工作，但 act 已不在白名单，直接绑定）
    $$('#q-stage [data-act="after-session"]').forEach(btn => btn.addEventListener('click', () => {
      const to = btn.dataset.to;
      if (to === 'again') { state.sess = null; return startSession(se.kind); }
      navigate(to);
    }));
  }

  /* ============================================================
     学习进度
  ============================================================ */
  function renderProgress() {
    const d = S.db();
    const last7 = Array.from({ length: 7 }, (_, k) => {
      const dt = new Date(); dt.setDate(dt.getDate() - (6 - k));
      return { label: ['日', '一', '二', '三', '四', '五', '六'][dt.getDay()], key: S.dateStr(dt), val: d.activity[S.dateStr(dt)] || 0, today: k === 6 };
    });
    const maxV = Math.max(20, ...last7.map(x => x.val));

    // 热力图：15 周
    const start = new Date(); start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (15 * 7 - 1));
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const cells = [];
    for (let w = 0; w < 15; w++)
      for (let dd = 0; dd < 7; dd++) {
        const dt = new Date(start); dt.setDate(start.getDate() + w * 7 + dd);
        const key = S.dateStr(dt);
        const v = d.activity[key] || 0;
        const future = dt > new Date();
        cells.push({ key, v, level: future ? -1 : v === 0 ? 0 : v < 20 ? 1 : v < 45 ? 2 : v < 80 ? 3 : 4 });
      }
    const heatCols = Array.from({ length: 15 }, (_, w) => cells.slice(w * 7, w * 7 + 7));

    const skillName = { vocab: '单词记忆', grammar: '语法练习', speak: '口语跟读', listen: '听力训练' };
    const profOf = (l) => {
      const done = Object.keys(d.lessons).filter(k => k.startsWith(l + '-')).length;
      const mastered = d.words[l].filter(w => w.box >= 2).length;
      return Math.min(100, Math.round(done / 18 * 55 + Math.min(mastered, 20) / 20 * 45));
    };
    const lvl = S.levelOf(d.xp), range = S.levelRange(lvl);
    const lvlPct = Math.round((d.xp - range.lo) / (range.hi - range.lo) * 100);
    const mastered = Object.keys(D.LANGS).reduce((s, l) => s + d.words[l].filter(w => w.box >= 2).length, 0);

    view.innerHTML = `
      <div class="page-head"><h2>📈 学习进度追踪</h2><p>数据每日自动记录，帮助你看清成长轨迹与薄弱环节</p></div>

      <div class="level-strip">
        <div class="lv-big">Lv.${lvl}</div>
        <div class="lv-info">
          <b>${S.getUsers()[S.currentUser()].name} 的语言等级</b>
          <p>距离 Lv.${lvl + 1} 还需 ${range.hi - d.xp} XP</p>
          <div class="progress-bar" style="margin-top:8px;background:rgba(255,255,255,.25)"><i style="width:${lvlPct}%;background:#fff"></i></div>
        </div>
        <div class="lv-xp">${d.xp} / ${range.hi} XP</div>
      </div>

      <div class="grid stat-grid" style="margin-bottom:22px">
        ${[['🔥', d.streak, '连续天数'], ['🃏', mastered, '掌握单词'], ['📚', Object.keys(d.lessons).length, '完成课程'], ['💯', d.perfectCount, '满分次数']]
          .map(([ico, val, label]) => `<div class="card stat-card"><div class="s-ico">${ico}</div><div class="s-val">${val}</div><div class="s-label">${label}</div></div>`).join('')}
      </div>

      <div class="grid dash-grid">
        <div class="card">
          <h3 style="margin-bottom:16px">近 7 天经验值</h3>
          <div class="chart">
            ${last7.map(x => `
              <div class="bar-col">
                <div class="bar ${x.today ? 'today' : ''}" style="height:${Math.max(3, x.val / maxV * 100)}%"><em>${x.val || ''}</em></div>
                <small>${x.label}</small>
              </div>`).join('')}
          </div>
          <h3 style="margin:26px 0 10px">学习活动热力图 · 近 15 周</h3>
          <div class="heatmap" style="grid-template-columns:repeat(15,1fr)">
            ${heatCols.map(col => col.map(c =>
              `<i class="${c.level < 0 ? '' : 'h' + c.level}" style="${c.level < 0 ? 'visibility:hidden' : ''}" title="${c.key}: ${c.v} XP"></i>`).join('')).join('')}
          </div>
          <div style="display:flex;gap:6px;align-items:center;justify-content:flex-end;margin-top:10px;font-size:11px;color:var(--text-faint)">
            少 ${[0, 1, 2, 3, 4].map(l => `<i class="h${l}" style="width:12px;height:12px;border-radius:3px;display:inline-block;background:${l === 0 ? 'rgba(255,255,255,.06)' : ''};${l ? `background:rgba(108,92,231,${.25 + l * .18})` : ''}"></i>`).join('')} 多
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:18px">
          <div class="card">
            <h3 style="margin-bottom:18px">三语熟练度</h3>
            <div class="lang-prof">
              ${Object.keys(D.LANGS).map(l => {
                const p = profOf(l);
                return `<div class="prof-row">
                  <div class="pr-top"><span>${D.LANGS[l].flag} ${D.LANGS[l].name}</span><span>${p}%</span></div>
                  <div class="prof-bar"><i class="${D.LANGS[l].cls}" style="width:${p}%"></i></div>
                </div>`;
              }).join('')}
            </div>
          </div>
          <div class="card">
            <h3 style="margin-bottom:16px">技能训练分布</h3>
            <div class="skill-list">
              ${Object.keys(skillName).map(k => {
                const st = d.moduleStats[k], acc = st.count ? Math.round(st.right / st.count * 100) : 0;
                return `<div class="skill-row">
                  <div class="sr-head"><span>${MODULE_META[k].ico} ${skillName[k]}</span><span>${st.count} 题 · ${st.count ? acc + '%' : '未开始'}</span></div>
                  <div class="progress-bar"><i style="width:${acc}%"></i></div>
                </div>`;
              }).join('')}
            </div>
          </div>
        </div>
      </div>`;
  }

  /* ============================================================
     社区广场
  ============================================================ */
  let communityFilter = 'all';
  function renderCommunity() {
    const d = S.db();
    const me = S.getUsers()[S.currentUser()];
    let posts = S.allPosts();
    if (communityFilter !== 'all') posts = posts.filter(p => p.lang === communityFilter);

    const board = [...D.RANK_SEED.map(r => ({ ...r })), { name: me.name + '（我）', xp: d.xp, self: true }]
      .sort((a, b) => b.xp - a.xp).slice(0, 8);

    view.innerHTML = `
      <div class="page-head"><h2>💬 社区广场</h2><p>和全球语言学习者一起打卡、提问、分享方法</p></div>
      <div style="margin-bottom:18px">
        <span class="topic-chip ${communityFilter === 'all' ? '' : ''}" data-filter="all" style="${communityFilter === 'all' ? 'border-color:var(--brand);color:#0f766e;background:rgba(13,148,136,.12);font-weight:700' : ''}">🌐 全部</span>
        ${Object.keys(D.LANGS).map(l =>
          `<span class="topic-chip" data-filter="${l}" style="${communityFilter === l ? 'border-color:var(--brand);color:#0f766e;background:rgba(13,148,136,.12);font-weight:700' : ''}">${D.LANGS[l].flag} ${D.LANGS[l].name}</span>`).join('')}
      </div>
      <div class="grid community-grid">
        <div>
          <div class="card post-composer">
            <span class="avatar">${esc((me.name[0] || 'U').toUpperCase())}</span>
            <div style="flex:1">
              <textarea id="post-input" placeholder="分享你的学习心得、提出疑问…"></textarea>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
                <select id="post-lang" style="background:rgba(255,255,255,.08);border:1px solid var(--line);border-radius:8px;color:var(--text);padding:6px 10px;font-size:12px">
                  ${Object.keys(D.LANGS).map(l => `<option value="${l}" ${l === d.currentLang ? 'selected' : ''}>${D.LANGS[l].flag} ${D.LANGS[l].name}</option>`).join('')}
                </select>
                <button class="btn btn-primary btn-sm" id="post-btn">发布</button>
              </div>
            </div>
          </div>
          <div id="post-list">
            ${posts.map(p => postHTML(p)).join('') || `<div class="card" style="text-align:center;color:var(--text-dim)">该语言板块还没有帖子，来发第一条吧！</div>`}
          </div>
        </div>
        <div>
          <div class="card" style="position:sticky;top:86px">
            <h3 style="margin-bottom:14px">🏅 本周学霸榜</h3>
            ${board.map((r, i) => `
              <div class="rank-row">
                <span class="rank-no">${i + 1}</span>
                <span class="r-name" style="${r.self ? 'color:var(--brand-2)' : ''}">${esc(r.name)}</span>
                <span class="r-xp">${r.xp} XP</span>
              </div>`).join('')}
            <div style="margin-top:18px">
              ${D.TOPICS.map(t => `<span class="topic-chip">${t}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>`;

    $('#post-btn').onclick = () => {
      const body = $('#post-input').value.trim();
      if (!body) return toast('说点什么再发布吧', 'no');
      S.addPost(body, $('#post-lang').value);
      communityFilter = 'all';
      renderCommunity();
      toast('发布成功 🎉', 'ok');
    };
    $$('[data-filter]').forEach(c => c.onclick = () => { communityFilter = c.dataset.filter; renderCommunity(); });
    bindPostEvents();
  }

  function postHTML(p) {
    const dotColor = { en: 'var(--en)', ja: 'var(--ja)', ko: 'var(--ko)' }[p.lang];
    return `
      <div class="card post" data-pid="${p.id}">
        <div class="post-head">
          <span class="avatar">${esc(p.avatar)}</span>
          <div>
            <b>${esc(p.user)}</b>
            <div class="post-meta"><span class="post-lang-dot" style="background:${dotColor}"></span>${D.LANGS[p.lang].name} · ${p.time}</div>
          </div>
        </div>
        <div class="post-body">${esc(p.body)}</div>
        <div class="post-actions">
          <button data-pact="like" class="${p.liked ? 'liked' : ''}">${p.liked ? '❤️' : '🤍'} ${p.likes}</button>
          <button data-pact="comments">💬 ${p.comments.length}</button>
        </div>
        <div class="comment-list">
          ${p.comments.map(c => `<div class="comment"><b>${esc(c.u)}：</b>${esc(c.c)}</div>`).join('')}
          <div style="display:flex;gap:8px;margin-top:8px">
            <input class="comment-input" placeholder="写下你的评论…" style="flex:1;background:rgba(255,255,255,.06);border:1px solid var(--line);border-radius:9px;padding:8px 12px;color:var(--text);font-size:12.5px;outline:none">
            <button class="btn btn-primary btn-sm" data-pact="send-comment">发送</button>
          </div>
        </div>
      </div>`;
  }
  function bindPostEvents() {
    $$('#post-list .post').forEach(card => {
      const pid = card.dataset.pid;
      card.querySelector('[data-pact="like"]').onclick = () => {
        S.toggleLike(pid); renderCommunity();
      };
      const btnComments = card.querySelector('[data-pact="comments"]');
      const list = card.querySelector('.comment-list');
      btnComments.onclick = () => list.classList.toggle('open');
      card.querySelector('[data-pact="send-comment"]').onclick = () => {
        const input = card.querySelector('.comment-input');
        const text = input.value.trim();
        if (!text) return;
        S.addComment(pid, text);
        renderCommunity();
        const updated = $(`.post[data-pid="${pid}"] .comment-list`);
        if (updated) updated.classList.add('open');
      };
    });
  }

  /* ============================================================
     成就激励
  ============================================================ */
  function renderAchievements() {
    const d = S.db();
    const list = S.achievementProgress(d);
    const unlockedCount = list.filter(a => a.unlocked).length;
    const lvl = S.levelOf(d.xp), range = S.levelRange(lvl);
    const lvlPct = Math.round((d.xp - range.lo) / (range.hi - range.lo) * 100);

    view.innerHTML = `
      <div class="page-head"><h2>🏆 成就激励中心</h2><p>已解锁 ${unlockedCount} / ${list.length} 枚徽章，每枚徽章都有额外 XP 奖励</p></div>
      <div class="level-strip">
        <div class="lv-big">Lv.${lvl}</div>
        <div class="lv-info">
          <b>坚持是最酷的天赋</b>
          <p>完成课程、练习打卡、探索语言都能获得 XP，XP 自动提升等级</p>
          <div class="progress-bar" style="margin-top:8px;background:rgba(255,255,255,.25)"><i style="width:${lvlPct}%;background:#fff"></i></div>
        </div>
        <div class="lv-xp">${d.xp} XP · 🔥 ${d.streak} 天</div>
      </div>
      <div class="grid ach-grid">
        ${list.map(a => `
          <div class="card ach-tile ${a.unlocked ? '' : 'locked'}">
            <span class="ach-medal">${a.ico}</span>
            <h4>${a.name}</h4>
            <p>${a.desc}</p>
            <div class="ach-prog">
              <div class="progress-bar"><i style="width:${a.pct}%"></i></div>
              <small>${a.unlocked ? '✅ 已解锁 · +' + a.reward + ' XP' : `${Math.min(a.value, a.target)} / ${a.target} · 奖励 +${a.reward} XP`}</small>
            </div>
          </div>`).join('')}
      </div>`;
  }

  init();
})();
