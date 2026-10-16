/* ============================================================
   LinguaVerse · 状态层
   - 用户注册 / 登录（localStorage 模拟后端）
   - 学习档案：XP / 等级 / 连续打卡 / 课程进度 / 单词 SRS
   - 成就判定
============================================================ */
window.LV = window.LV || {};

LV.Store = (function () {
  const K_USERS = 'lv_users_v1';
  const K_SESSION = 'lv_session_v1';
  const prefix = (email) => 'lv_db_v1_' + email.toLowerCase();

  /* ---------- 工具 ---------- */
  const read = (k, def) => {
    try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; }
    catch { return def; }
  };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

  /* ---------- 默认档案 ---------- */
  function defaultDB(profile) {
    return {
      currentLang: profile.lang || 'en',
      dailyGoal: profile.goal || 30,
      xp: 0,
      streak: 0,
      lastStudyDate: '',
      dailyDate: dateStr(),
      dailyXp: 0,
      lessons: {},              // lessonKey "en-3" => {done:true, stars, time}
      words: { en: [], ja: [], ko: [] },   // {idx,box,due,seen,known}
      moduleStats: {            // 各模块累计
        vocab:     { count: 0, right: 0 },
        grammar:   { count: 0, right: 0 },
        speak:     { count: 0, right: 0 },
        listen:    { count: 0, right: 0 },
      },
      perfectCount: 0,
      activity: {},             // {'2026-10-13': xp}
      unlocked: {},             // achievementId: date
      posts: [],                // 用户发布的帖子
    };
  }

  /* ---------- 用户 ---------- */
  function getUsers() { return read(K_USERS, {}); }
  function currentUser() { return read(K_SESSION, null); }

  function register({ name, email, password, lang, goal }) {
    email = email.trim().toLowerCase();
    const users = getUsers();
    if (users[email]) throw new Error('该邮箱已注册，请直接登录');
    if (password.length < 6) throw new Error('密码至少需要 6 位');
    users[email] = { name: name.trim(), email, password, lang, goal: Number(goal), createdAt: Date.now() };
    write(K_USERS, users);
    write(prefix(email), defaultDB({ lang, goal }));
    return login({ account: email, password });
  }

  function login({ account, password }) {
    account = account.trim().toLowerCase();
    const users = getUsers();
    // 允许邮箱或昵称登录
    const found = users[account] || Object.values(users).find(u => u.name.toLowerCase() === account);
    if (!found) throw new Error('账号不存在，请先注册');
    if (found.password !== password) throw new Error('密码错误，请重试');
    write(K_SESSION, found.email);
    if (!localStorage.getItem(prefix(found.email))) write(prefix(found.email), defaultDB(found));
    return found;
  }
  function logout() { localStorage.removeItem(K_SESSION); }

  function db() {
    const email = currentUser();
    if (!email) return null;
    return read(prefix(email), defaultDB({}));
  }
  function save(d) {
    const email = currentUser();
    if (email) write(prefix(email), d);
  }
  function update(mutator) {
    const d = db();
    if (!d) return null;
    mutator(d);
    save(d);
    return d;
  }
  function updateProfile(patch) {
    const email = currentUser();
    const users = getUsers();
    if (users[email]) { Object.assign(users[email], patch); write(K_USERS, users); }
    return users[email];
  }

  /* ---------- 等级 ---------- */
  function levelOf(xp) { return Math.floor(Math.sqrt(xp / 60)) + 1; }
  function levelRange(level) {
    const lo = 60 * (level - 1) * (level - 1);
    const hi = 60 * level * level;
    return { lo, hi };
  }

  /* ---------- 连续打卡 & XP ---------- */
  function ensureDaily(d) {
    const t = dateStr();
    if (d.dailyDate !== t) { d.dailyDate = t; d.dailyXp = 0; }
  }
  function touchStreak(d) {
    const t = dateStr();
    if (d.lastStudyDate === t) return;
    if (d.lastStudyDate && daysBetween(d.lastStudyDate, t) === 1) d.streak += 1;
    else d.streak = 1;
    d.lastStudyDate = t;
  }
  function addXp(n) {
    return update(d => {
      ensureDaily(d);
      touchStreak(d);
      d.xp += n;
      d.dailyXp += n;
      d.activity[dateStr()] = (d.activity[dateStr()] || 0) + n;
    });
  }

  /* ---------- 单词 SRS ---------- */
  function getWordState(d, lang, idx) {
    let w = d.words[lang].find(x => x.idx === idx);
    if (!w) { w = { idx, box: 0, due: dateStr(), seen: 0, known: 0 }; d.words[lang].push(w); }
    return w;
  }
  // box 间隔（天）：1 / 2 / 4 / 8 / 15
  const BOX_DAYS = [0, 1, 2, 4, 8, 15];
  function gradeWord(lang, idx, known) {
    update(d => {
      const w = getWordState(d, lang, idx);
      w.seen += 1;
      if (known) { w.known += 1; w.box = Math.min(w.box + 1, 5); }
      else w.box = 0;
      const due = new Date();
      due.setDate(due.getDate() + BOX_DAYS[w.box]);
      w.due = dateStr(due);
    });
  }
  function dueWords(lang) {
    const d = db();
    const t = dateStr();
    return d.words[lang].filter(w => w.box < 5 && w.due <= t).length;
  }

  /* ---------- 课程 ---------- */
  function lessonKey(lang, i) { return `${lang}-${i}`; }
  function isLessonDone(d, lang, i) { return !!d.lessons[lessonKey(lang, i)]; }
  function completeLesson(lang, i, xp, perfect) {
    let newly = false;
    update(d => {
      const k = lessonKey(lang, i);
      if (!d.lessons[k]) {
        d.lessons[k] = { done: true, time: Date.now(), perfect: !!perfect };
        newly = true;
        ensureDaily(d); touchStreak(d);
        d.xp += xp; d.dailyXp += xp;
        d.activity[dateStr()] = (d.activity[dateStr()] || 0) + xp;
      }
    });
    const achievements = newly ? checkAchievements(db()) : [];
    return { newly, achievements };
  }

  /* ---------- 学习会话上报 ----------
     module: vocab | grammar | speak | listen
     info: {total, right, perfect}                                         */
  function recordSession(module, info) {
    let d = update(db0 => {
      const m = db0.moduleStats[module];
      m.count += info.total;
      m.right += info.right;
      if (info.perfect) db0.perfectCount += 1;
      ensureDaily(db0);
      touchStreak(db0);
    });
    return checkAchievements(d);
  }

  /* ---------- 成就 ---------- */
  function metrics(d) {
    const langs = Object.keys(LV_DATA.LANGS);
    const activeLangs = langs.filter(l => d.words[l].some(w => w.seen > 0) ||
      Object.keys(d.lessons).some(k => k.startsWith(l + '-'))).length;
    const wordsLearned = langs.reduce((s, l) => s + d.words[l].filter(w => w.box >= 2).length, 0);
    const totalLessons = Object.keys(d.lessons).length;
    return {
      xp: d.xp, streak: d.streak, wordsLearned, totalLessons,
      grammarDone: d.moduleStats.grammar.count,
      speakDone: d.moduleStats.speak.count,
      listenDone: d.moduleStats.listen.count,
      perfectCount: d.perfectCount, activeLangs,
    };
  }
  function checkAchievements(d) {
    const m = metrics(d);
    const t = dateStr();
    if (d.dailyDate !== t) { d.dailyDate = t; d.dailyXp = 0; }
    const newly = [];
    LV_DATA.ACHIEVEMENTS.forEach(a => {
      const val = a.metric(m);
      if (!d.unlocked[a.id] && val >= a.target) {
        d.unlocked[a.id] = t;
        d.xp += a.reward;
        d.dailyXp += a.reward;
        d.activity[t] = (d.activity[t] || 0) + a.reward;
        newly.push(a);
      }
    });
    save(d);
    return newly;
  }
  function achievementProgress(d) {
    const m = metrics(d);
    return LV_DATA.ACHIEVEMENTS.map(a => {
      const val = a.metric(m);
      return { ...a, value: val, pct: Math.min(100, Math.round(val / a.target * 100)), unlocked: !!d.unlocked[a.id] };
    });
  }

  /* ---------- 社区 ---------- */
  function allPosts() {
    const d = db();
    const hot = a => a.likes + a.comments.length * 3;
    // 用户发布的内容优先（鼓励参与），其后种子内容按热度排序
    const mine = d.posts.slice().sort((a, b) => hot(b) - hot(a));
    const seed = LV_DATA.SEED_POSTS.map(p => ({ ...p })).sort((a, b) => hot(b) - hot(a));
    return [...mine, ...seed];
  }
  function addPost(body, lang) {
    const u = currentUser();
    const users = getUsers();
    const profile = users[u];
    update(d => {
      d.posts.unshift({
        id: 'u' + Date.now(), user: profile.name, avatar: profile.name[0] || 'U',
        lang, time: '刚刚', body: body.trim(), likes: 0, liked: false, comments: [], mine: true,
      });
    });
  }
  function toggleLike(postId) {
    update(d => {
      const p = d.posts.find(x => x.id === postId) || LV_DATA.SEED_POSTS.find(x => x.id === postId);
      if (!p) return;
      p.liked = !p.liked;
      p.likes += p.liked ? 1 : -1;
    });
  }
  function addComment(postId, text) {
    const users = getUsers();
    const profile = users[currentUser()];
    update(d => {
      const p = d.posts.find(x => x.id === postId) || LV_DATA.SEED_POSTS.find(x => x.id === postId);
      if (p) p.comments.push({ u: profile.name, c: text });
    });
  }

  /* ---------- 播种演示账号 ---------- */
  function seedDemo() {
    const email = 'demo@lingua.io';
    const users = getUsers();
    if (!users[email]) {
      users[email] = { name:'Demo 学员', email, password:'123456', lang:'en', goal:30, createdAt: Date.now() };
      write(K_USERS, users);
      const d = defaultDB({ lang:'en', goal:30 });
      // 预置一些学习痕迹，让仪表盘更生动
      d.xp = 160; d.streak = 2; d.lastStudyDate = dateStr();
      d.dailyXp = 20;
      for (let i = 0; i < 2; i++) d.lessons['en-' + i] = { done:true, time:Date.now() };
      d.words.en = LV_DATA.VOCAB.en.slice(0, 8).map((v, i) => ({ idx:i, box: i < 4 ? 2 : 1, due: i < 4 ? dateStr() : dateStr(), seen:2, known:1 }));
      d.moduleStats.vocab = { count:8, right:6 };
      d.moduleStats.grammar = { count:5, right:4 };
      const today = new Date();
      d.activity[dateStr(today)] = 20;
      today.setDate(today.getDate() - 1); d.activity[dateStr(today)] = 45;
      today.setDate(today.getDate() - 1); d.activity[dateStr(today)] = 30;
      write(prefix(email), d);
    }
  }

  return {
    register, login, logout, currentUser, getUsers, db, save, update, updateProfile,
    levelOf, levelRange, addXp, gradeWord, dueWords, getWordState,
    isLessonDone, completeLesson, recordSession,
    metrics, achievementProgress, checkAchievements,
    allPosts, addPost, toggleLike, addComment,
    seedDemo, dateStr,
  };
})();

/* ============================================================
   语音引擎：TTS 朗读 + 语音识别跟读评分
============================================================ */
LV.Speech = (function () {
  const synth = window.speechSynthesis;
  let voicesReady = false;
  function loadVoices() { voicesReady = !!(synth && synth.getVoices().length); }
  if (synth) { loadVoices(); synth.onvoiceschanged = loadVoices; }

  function speak(text, bcp47, rate = 1) {
    return new Promise((resolve) => {
      if (!synth) { resolve(false); return; }
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = bcp47; u.rate = rate; u.pitch = 1;
      const v = synth.getVoices().find(v => v.lang === bcp47) ||
                synth.getVoices().find(v => v.lang.startsWith(bcp47.slice(0, 2)));
      if (v) u.voice = v;
      u.onend = () => resolve(true);
      u.onerror = () => resolve(false);
      // Chrome 已知问题：cancel 后立即 speak 可能不发声，稍作延迟
      setTimeout(() => { try { synth.speak(u); } catch { resolve(false); } }, 60);
    });
  }
  function stop() { synth && synth.cancel(); }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognitionSupported = !!SR;

  // 文本规范化：小写、去标点、压缩空格（日韩去空格）
  function normalize(s, lang) {
    s = s.toLowerCase().replace(/[.,!?;:''"（）()「」【】\[\]。、！？～~]/g, '');
    if (lang === 'ja' || lang === 'ko') s = s.replace(/\s+/g, '');
    else s = s.replace(/\s+/g, ' ').trim();
    return s;
  }
  // 莱文斯坦距离
  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return dp[m][n];
  }
  function similarity(target, said, lang) {
    const a = normalize(target, lang), b = normalize(said, lang);
    if (!b) return 0;
    const dist = levenshtein(a, b);
    return Math.max(0, Math.round((1 - dist / Math.max(a.length, b.length)) * 100));
  }

  function recognize(bcp47, lang, timeoutMs = 6000) {
    return new Promise((resolve, reject) => {
      if (!SR) { reject(new Error('unsupported')); return; }
      const r = new SR();
      r.lang = bcp47; r.interimResults = false; r.maxAlternatives = 1;
      let done = false;
      const timer = setTimeout(() => { if (!done) { done = true; try { r.abort(); } catch {} reject(new Error('timeout')); } }, timeoutMs);
      r.onresult = (e) => {
        if (done) return;
        done = true; clearTimeout(timer);
        resolve(e.results[0][0].transcript);
      };
      r.onerror = (e) => { if (done) return; done = true; clearTimeout(timer); reject(e.error || new Error('error')); };
      r.onend = () => { if (!done) { done = true; clearTimeout(timer); reject(new Error('no-speech')); } };
      try { r.start(); } catch (e) { clearTimeout(timer); reject(e); }
    });
  }

  return { speak, stop, recognize, recognitionSupported, similarity, normalize };
})();

/* ============================================================
   音效引擎：WebAudio 纯合成，零外部资源
   所有音效均为短促提示音，可在用户菜单中开关
============================================================ */
LV.Sound = (function () {
  let ctx = null, enabled = true;
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch {} }
    return ctx;
  }
  function tone(freq, dur, type = 'sine', when = 0, vol = 0.15) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + when;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }
  const fx = {
    click()   { tone(700, .05, 'sine', 0, .07); },
    flip()    { tone(520, .08, 'sine', 0, .09); tone(680, .1, 'sine', .05, .07); },
    correct() { tone(660, .1, 'sine', 0); tone(880, .14, 'sine', .08); },
    wrong()   { tone(220, .18, 'sawtooth', 0, .1); tone(175, .22, 'sawtooth', .09, .09); },
    combo(n)  { const b = 500 + Math.min(n, 8) * 45; tone(b, .07, 'triangle', .02, .12); tone(b * 1.33, .09, 'triangle', .09, .1); },
    finish()  { [523, 659, 784].forEach((f, i) => tone(f, .13, 'sine', i * .09)); },
    levelup() { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, .15, 'triangle', i * .08, .13)); },
    achieve() { [523, 659, 784, 1047].forEach((f, i) => tone(f, .17, 'triangle', i * .09, .13)); },
  };
  function play(name, arg) { if (!enabled || !fx[name]) return; try { fx[name](arg); } catch {} }
  return {
    play,
    toggle() { enabled = !enabled; return enabled; },
    get enabled() { return enabled; },
  };
})();
