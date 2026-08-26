const app = document.querySelector("#app");
const STORAGE_KEY = "classical-words-300-progress-v1";
let view = "home";
let currentId = 1;
let query = "";

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

let progress = loadProgress();

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

window.addEventListener("pagehide", saveProgress);

function statusCounts() {
  const values = Object.values(progress);
  return {
    known: values.filter((v) => v === "known").length,
    unknown: values.filter((v) => v === "unknown").length,
  };
}

function icon(name) {
  const icons = { random: "↝", list: "☷", back: "‹" };
  return icons[name] || "";
}

function go(nextView, id) {
  view = nextView;
  if (id) currentId = id;
  query = "";
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function searchBox() {
  return `<input class="search" id="search" value="${query}" placeholder="搜索实词或义项..." autocomplete="off">`;
}

function bindSearch() {
  const input = document.querySelector("#search");
  if (!input) return;
  input.addEventListener("input", (event) => {
    query = event.target.value.trim();
    if (view === "list") renderList(true);
  });
}

function renderHome() {
  const counts = statusCounts();
  const learned = counts.known + counts.unknown;
  const percent = Math.round((counts.known / WORDS.length) * 100);
  app.innerHTML = `<main class="shell">
    <div class="brand"><div class="seal">文</div><div><h1>文言实词300个 · 情景串记</h1><p class="subtitle">一词多义故事记忆与抽背自测</p></div></div>
    ${searchBox()}
    <section class="stats">
      <div class="stat"><strong>${WORDS.length}</strong><span>总数</span></div>
      <div class="stat"><strong>${counts.known}</strong><span>已掌握</span></div>
      <div class="stat"><strong>${WORDS.length - learned}</strong><span>未学习</span></div>
    </section>
    <section class="actions">
      <button class="primary" id="random">${icon("random")}　随机抽背</button>
      <button class="secondary" id="browse">${icon("list")}　顺序浏览</button>
    </section>
    <section class="progress-card">
      <div class="progress-head"><strong>学习进度</strong><span>${percent}%</span></div>
      <div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div>
      <div class="legend"><span><i class="dot" style="background:var(--green)"></i>已掌握 ${counts.known}</span><span><i class="dot" style="background:var(--red)"></i>不认识 ${counts.unknown}</span><span><i class="dot" style="background:#d4cdc6"></i>未学 ${WORDS.length - learned}</span></div>
    </section>
    <button class="reset" id="reset">↻　重置全部进度</button>
  </main>`;
  document.querySelector("#random").onclick = () => go("detail", Math.floor(Math.random() * WORDS.length) + 1);
  document.querySelector("#browse").onclick = () => go("list");
  document.querySelector("#reset").onclick = () => {
    if (confirm("确定重置全部学习进度吗？")) { progress = {}; saveProgress(); render(); }
  };
  document.querySelector("#search").addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const value = event.target.value.trim();
    const match = WORDS.find((item) => item.word.includes(value) || item.meanings.some((m) => m.includes(value)));
    if (match) go("detail", match.id);
  });
}

function filteredWords() {
  if (!query) return WORDS;
  return WORDS.filter((item) => item.word.includes(query) || item.meanings.some((meaning) => meaning.includes(query)));
}

function renderList(keepFocus = false) {
  const words = filteredWords();
  app.innerHTML = `<main class="shell">
    <header class="topbar"><button class="back" id="back" title="返回">${icon("back")}</button><h2>顺序浏览</h2><span class="count">共 ${WORDS.length} 个</span></header>
    ${searchBox()}
    <section class="word-grid">${words.map((item) => `<button class="word-item" data-id="${item.id}"><span class="word-id">${item.id}</span><strong class="word-char">${item.word}</strong><span class="word-count">${item.meanings.length} 义</span></button>`).join("")}</section>
    ${words.length ? "" : `<div class="empty">没有匹配的实词</div>`}
  </main>`;
  document.querySelector("#back").onclick = () => go("home");
  document.querySelectorAll(".word-item").forEach((button) => button.onclick = () => go("detail", Number(button.dataset.id)));
  bindSearch();
  if (keepFocus) {
    const input = document.querySelector("#search");
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
}

function renderDetail() {
  const item = WORDS[currentId - 1];
  const status = progress[item.id] || "unlearned";
  app.innerHTML = `<main class="shell">
    <header class="topbar"><button class="back" id="back" title="返回">${icon("back")}</button><h2>情景串记</h2><span class="count">第 ${item.id} 号</span></header>
    <article class="detail-card">
      <div class="detail-meta"><span>${status === "known" ? "已掌握" : status === "unknown" ? "不认识" : "未学习"}</span><span>${item.meanings.length} 个义项</span></div>
      <div class="hero-word">${item.word}</div>
      <section class="section"><h3>义项</h3><div class="meaning-list">${item.meanings.map((meaning) => `<span class="meaning">${meaning}</span>`).join("")}</div></section>
      <section class="section"><h3>文言情景故事</h3><p class="story">${item.story}</p></section>
      <section class="section"><h3>白话提示</h3><p class="translation">${item.translation}</p></section>
      <div class="status-row"><button class="status-btn unknown ${status === "unknown" ? "active" : ""}" data-status="unknown">不认识</button><button class="status-btn known ${status === "known" ? "active" : ""}" data-status="known">已掌握</button><button class="status-btn" data-status="unlearned">重置</button></div>
    </article>
    <div class="pager"><button class="nav-btn" id="prev">上一个</button><span class="page-index">${item.id} / ${WORDS.length}</span><button class="nav-btn" id="next">下一个</button></div>
  </main>`;
  document.querySelector("#back").onclick = () => go("list");
  document.querySelector("#prev").onclick = () => { currentId = currentId === 1 ? WORDS.length : currentId - 1; renderDetail(); };
  document.querySelector("#next").onclick = () => { currentId = currentId === WORDS.length ? 1 : currentId + 1; renderDetail(); };
  document.querySelectorAll("[data-status]").forEach((button) => button.onclick = () => {
    if (button.dataset.status === "unlearned") delete progress[item.id];
    else progress[item.id] = button.dataset.status;
    saveProgress();
    renderDetail();
  });
}

function render() {
  if (view === "home") renderHome();
  else if (view === "list") renderList();
  else renderDetail();
}

render();
