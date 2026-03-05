/* =============================================
   Agentic AI Knowledge Base — App Logic
   ============================================= */

// ---- State ----
let allSections = [];
let currentSectionIndex = -1;
let readSections = new Set(JSON.parse(localStorage.getItem('readSections') || '[]'));
let isDark = localStorage.getItem('theme') !== 'light';
let searchTimeout = null;

// ---- Section descriptions for home cards ----
const SECTION_DESCS = {
  0: "Welcome and executive overview of the Agentic AI Knowledge Base — your starting point.",
  1: "Foundational information, disclaimers, usage guidelines, and target audience overview.",
  2: "Core definitions, agent types (reactive, deliberative, hybrid, learning), and foundational concepts.",
  3: "Architecture components, design patterns by OpenAI, multi-agent systems, 12-Factor Agents, and Gartner patterns.",
  4: "Deep dives into LangChain, LangGraph, Google ADK, AWS Strands, AutoGen, Semantic Kernel, CrewAI, PydanticAI, and more.",
  5: "Technology landscape: cloud platforms (Google Vertex, AWS AgentCore, Azure), workflow engines, and popular AI agents.",
  6: "MCP, Agent2Agent (A2A) protocol, AGENTS.md, OpenSpec, AG-UI, and Linux Foundation initiatives.",
  7: "Reference architectures for AI assistants, automation, self-learning agents, and RAG pipelines.",
  8: "Context management strategies, prompt engineering, and implementation examples from Manus, Anthropic, and LangGraph.",
  9: "Three-tier memory model, long-term memory strategies, short-term and long-term memory solutions.",
  10: "LLM evaluation frameworks, agent benchmarks, evaluation platforms, and reference documentation.",
  11: "NIST AI RMF, Google SAIF framework, AWS security perspective, and agentic AI threat models.",
  12: "Observability goals, solutions, and best practices for monitoring agentic AI systems in production.",
  13: "AgentOps overview, GenOps evolution from MLOps, and operational best practices for agentic AI.",
  14: "Gartner, AWS, Google, and IDC maturity models for agentic AI adoption and capability assessment.",
  15: "AWS AI Agents Marketplace, AgentOps Marketplace, and miscellaneous agent marketplaces.",
  16: "Best practices from Anthropic, Google, Microsoft, and OpenAI for building reliable AI agents."
};

// ---- Init ----
async function init() {
  applyTheme();
  try {
    const resp = await fetch('content.json');
    allSections = await resp.json();
  } catch(e) {
    console.error('Failed to load content.json', e);
    return;
  }
  buildSidebar();
  buildHomeGrid();
  updateProgress();
  showHome();
  setupSearch();
  setupKeyboard();
}

// ---- Theme ----
function applyTheme() {
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  document.getElementById('themeToggle').textContent = isDark ? '☀' : '☾';
}
document.getElementById('themeToggle').addEventListener('click', () => {
  isDark = !isDark;
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  applyTheme();
});

// ---- Sidebar ----
function buildSidebar() {
  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = '';
  allSections.forEach((sec, idx) => {
    const isRead = readSections.has(sec.id);
    const el = document.createElement('div');
    el.className = 'nav-section' + (isRead ? ' read' : '');
    el.dataset.idx = idx;
    el.innerHTML = `
      <span class="nav-num">${sec.num}</span>
      <span class="nav-title">${sec.title}</span>
      <span class="nav-check">✓</span>
    `;
    el.addEventListener('click', () => navigateToSection(idx));
    nav.appendChild(el);
  });
}

function updateSidebarActive(idx) {
  document.querySelectorAll('.nav-section').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
    if (i === idx) el.scrollIntoView({ block: 'nearest' });
  });
}

// ---- Home Grid ----
function buildHomeGrid() {
  const grid = document.getElementById('homeGrid');
  const stats = document.getElementById('heroStats');
  grid.innerHTML = '';

  // Stats
  const totalSubs = allSections.reduce((a, s) => a + s.subsections.length, 0);
  const totalLinks = allSections.reduce((a, s) => a + s.subsections.reduce((b, sub) => b + sub.links.length, 0), 0);
  stats.innerHTML = `
    <div class="hero-stat"><div class="hero-stat-num">${allSections.length}</div><div class="hero-stat-label">Sections</div></div>
    <div class="hero-stat"><div class="hero-stat-num">${totalSubs}+</div><div class="hero-stat-label">Topics</div></div>
    <div class="hero-stat"><div class="hero-stat-num">${totalLinks}+</div><div class="hero-stat-label">Resources</div></div>
    <div class="hero-stat"><div class="hero-stat-num">${readSections.size}</div><div class="hero-stat-label">Completed</div></div>
  `;

  allSections.forEach((sec, idx) => {
    const isRead = readSections.has(sec.id);
    const card = document.createElement('div');
    card.className = 'home-card' + (isRead ? ' read-card' : '');
    card.innerHTML = `
      <div class="card-num">Section ${sec.num}</div>
      <div class="card-title">${sec.title}</div>
      <div class="card-desc">${SECTION_DESCS[sec.num] || ''}</div>
      <div class="card-meta">
        <span class="card-subs">${sec.subsections.length} topics</span>
        ${isRead ? '<span class="card-read-badge">✓ Completed</span>' : ''}
      </div>
    `;
    card.addEventListener('click', () => navigateToSection(idx));
    grid.appendChild(card);
  });
}

// ---- Navigation ----
function showHome() {
  document.getElementById('homeScreen').classList.remove('hidden');
  document.getElementById('sectionView').classList.add('hidden');
  currentSectionIndex = -1;
  document.querySelectorAll('.nav-section').forEach(el => el.classList.remove('active'));
}

function navigateToSection(idx) {
  if (idx < 0 || idx >= allSections.length) return;
  currentSectionIndex = idx;
  const sec = allSections[idx];

  document.getElementById('homeScreen').classList.add('hidden');
  document.getElementById('sectionView').classList.remove('hidden');

  // Breadcrumb
  document.getElementById('sectionBreadcrumb').innerHTML =
    `<span onclick="showHome()">🏠 Home</span> &rsaquo; Section ${sec.num}: ${sec.title}`;

  // Header
  document.getElementById('sectionNumBadge').textContent = sec.num;
  document.getElementById('sectionTitle').textContent = sec.title;
  document.getElementById('sectionIntro').textContent = sec.intro || '';

  // Mark read button
  const btn = document.getElementById('markReadBtn');
  const isRead = readSections.has(sec.id);
  btn.textContent = isRead ? '✓ Completed' : '✓ Mark as Read';
  btn.classList.toggle('marked', isRead);

  // Subsections
  renderSubsections(sec);

  // Nav buttons
  document.getElementById('prevBtn').disabled = idx === 0;
  document.getElementById('nextBtn').disabled = idx === allSections.length - 1;
  document.getElementById('prevBtn2').disabled = idx === 0;
  document.getElementById('nextBtn2').disabled = idx === allSections.length - 1;

  updateSidebarActive(idx);
  window.scrollTo(0, 0);
}

function renderSubsections(sec) {
  const list = document.getElementById('subsectionList');
  list.innerHTML = '';
  sec.subsections.forEach((sub, i) => {
    const card = document.createElement('div');
    card.className = 'subsection-card';
    const linkCount = sub.links.length;
    const keyCount = sub.key_points.length;
    card.innerHTML = `
      <div>
        <div class="sub-title">${sub.title}</div>
        <div class="sub-meta">
          ${linkCount > 0 ? `<span class="sub-links-badge">🔗 ${linkCount} links</span>` : ''}
          ${keyCount > 0 ? `<span class="sub-links-badge">💡 ${keyCount} key points</span>` : ''}
        </div>
      </div>
      <span class="sub-arrow">›</span>
    `;
    card.addEventListener('click', () => openSubsection(sub, sec));
    list.appendChild(card);
  });
}

function navigateNext() {
  if (currentSectionIndex < allSections.length - 1) navigateToSection(currentSectionIndex + 1);
}
function navigatePrev() {
  if (currentSectionIndex > 0) navigateToSection(currentSectionIndex - 1);
}

// ---- Mark as Read ----
function toggleSectionRead() {
  if (currentSectionIndex < 0) return;
  const sec = allSections[currentSectionIndex];
  if (readSections.has(sec.id)) {
    readSections.delete(sec.id);
    showToast('Section unmarked');
  } else {
    readSections.add(sec.id);
    showToast('✓ Section marked as read!');
  }
  localStorage.setItem('readSections', JSON.stringify([...readSections]));
  updateProgress();
  buildSidebar();
  buildHomeGrid();
  // Update button
  const btn = document.getElementById('markReadBtn');
  const isRead = readSections.has(sec.id);
  btn.textContent = isRead ? '✓ Completed' : '✓ Mark as Read';
  btn.classList.toggle('marked', isRead);
  updateSidebarActive(currentSectionIndex);
}

function updateProgress() {
  const total = allSections.length;
  const done = readSections.size;
  document.getElementById('progressText').textContent = `${done} / ${total}`;
  document.getElementById('progressBarFill').style.width = `${(done/total)*100}%`;
}

// ---- Reset Progress ----
document.getElementById('resetProgress').addEventListener('click', () => {
  if (confirm('Reset all reading progress?')) {
    readSections.clear();
    localStorage.removeItem('readSections');
    updateProgress();
    buildSidebar();
    buildHomeGrid();
    showToast('Progress reset');
  }
});

// ---- Sidebar Toggle ----
document.getElementById('sidebarToggle').addEventListener('click', () => {
  const sidebar = document.getElementById('sidebar');
  const main = document.getElementById('mainContent');
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    sidebar.classList.toggle('mobile-open');
  } else {
    sidebar.classList.toggle('collapsed');
    main.classList.toggle('full');
  }
});

// ---- Subsection Modal ----
function openSubsection(sub, sec) {
  document.getElementById('modalTitle').textContent = sub.title;

  // Render content
  let html = '';
  if (sub.content) {
    html += `<div class="content-block">${markdownToHtml(sub.content)}</div>`;
  }

  // Key points
  if (sub.key_points && sub.key_points.length > 0) {
    html += `<div class="key-points-section"><h3 style="font-size:13px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Key Concepts</h3>`;
    sub.key_points.forEach(kp => {
      html += `<div class="key-point">
        <div class="key-point-term">${escHtml(kp.term)}</div>
        ${kp.desc ? `<div class="key-point-desc">${escHtml(kp.desc)}</div>` : ''}
      </div>`;
    });
    html += `</div>`;
  }

  // Links
  if (sub.links && sub.links.length > 0) {
    html += `<div class="links-section"><h3>External Resources</h3>`;
    sub.links.forEach(link => {
      html += `<a class="link-item" href="${escHtml(link.url)}" target="_blank" rel="noopener">
        <span class="link-icon">↗</span>
        <span>${escHtml(link.text)}</span>
      </a>`;
    });
    html += `</div>`;
  }

  document.getElementById('modalBody').innerHTML = html || '<p style="color:var(--text3)">No detailed content available for this topic.</p>';
  document.getElementById('modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.body.style.overflow = '';
}

// ---- Search ----
function setupSearch() {
  const input = document.getElementById('searchInput');
  const results = document.getElementById('searchResults');

  input.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const q = input.value.trim();
    if (!q) { results.classList.add('hidden'); return; }
    searchTimeout = setTimeout(() => performSearch(q), 200);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper') && !e.target.closest('.search-results')) {
      results.classList.add('hidden');
    }
  });
}

function performSearch(query) {
  const results = document.getElementById('searchResults');
  const q = query.toLowerCase();
  const matches = [];

  allSections.forEach((sec, secIdx) => {
    // Match section title
    if (sec.title.toLowerCase().includes(q)) {
      matches.push({ type: 'section', secIdx, title: sec.title, sectionName: `Section ${sec.num}`, snippet: sec.intro?.substring(0, 100) || '' });
    }
    // Match subsections
    sec.subsections.forEach((sub) => {
      if (sub.title.toLowerCase().includes(q) || sub.content.toLowerCase().includes(q)) {
        const idx = sub.content.toLowerCase().indexOf(q);
        const snippet = idx >= 0 ? '...' + sub.content.substring(Math.max(0, idx-30), idx+80).replace(/[#*]/g, '') + '...' : '';
        matches.push({ type: 'subsection', secIdx, sub, title: sub.title, sectionName: `Section ${sec.num}: ${sec.title}`, snippet });
      }
    });
    if (matches.length >= 20) return;
  });

  results.classList.remove('hidden');
  if (matches.length === 0) {
    results.innerHTML = `<div class="sr-empty">No results found for "<strong>${escHtml(query)}</strong>"</div>`;
    return;
  }

  results.innerHTML = matches.slice(0, 15).map(m => `
    <div class="search-result-item" data-sec="${m.secIdx}" data-sub="${m.sub ? m.sub.id : ''}">
      <div class="sr-section">${escHtml(m.sectionName)}</div>
      <div class="sr-title">${escHtml(m.title)}</div>
      ${m.snippet ? `<div class="sr-snippet">${escHtml(m.snippet.substring(0, 120))}</div>` : ''}
    </div>
  `).join('');

  results.querySelectorAll('.search-result-item').forEach((el, i) => {
    el.addEventListener('click', () => {
      const m = matches[i];
      navigateToSection(m.secIdx);
      if (m.sub) setTimeout(() => openSubsection(m.sub, allSections[m.secIdx]), 100);
      results.classList.add('hidden');
      document.getElementById('searchInput').value = '';
    });
  });
}

// ---- Keyboard Shortcuts ----
function setupKeyboard() {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('searchInput').focus();
    }
    if (e.key === 'Escape') {
      closeModal();
      document.getElementById('searchResults').classList.add('hidden');
      document.getElementById('searchInput').blur();
    }
    if (e.key === 'ArrowRight' && !e.target.matches('input') && currentSectionIndex >= 0) navigateNext();
    if (e.key === 'ArrowLeft' && !e.target.matches('input') && currentSectionIndex >= 0) navigatePrev();
  });
}

// ---- Toast ----
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 2500);
}

// ---- Markdown to HTML (simple) ----
function markdownToHtml(md) {
  if (!md) return '';
  // First extract links to protect them from escaping
  const links = [];
  let processed = md.replace(/!\[([^\]]*)\]\([^\)]+\)/g, ''); // remove images
  processed = processed.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, (match, text, url) => {
    const idx = links.length;
    links.push({ text, url });
    return `%%LINK${idx}%%`;
  });
  // Now escape HTML
  let html = escHtml(processed);
  // Restore links
  html = html.replace(/%%LINK(\d+)%%/g, (m, i) => {
    const l = links[parseInt(i)];
    return `<a href="${escHtml(l.url)}" target="_blank" rel="noopener">${escHtml(l.text)}</a>`;
  });
  // Headers
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
  // Code inline
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Horizontal rules
  html = html.replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:16px 0">');
  // Lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, m => `<ul>${m}</ul>`);
  // Paragraphs
  html = html.split(/\n{2,}/).map(block => {
    block = block.trim();
    if (!block) return '';
    if (block.startsWith('<h') || block.startsWith('<ul') || block.startsWith('<hr') || block.startsWith('<li')) return block;
    return `<p>${block.replace(/\n/g, ' ')}</p>`;
  }).join('\n');
  return html;
}

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ---- Start ----
init();
