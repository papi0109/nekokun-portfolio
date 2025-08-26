// Simple hash-based SPA router + small UX enhancements
(function(){
  const SITE_TITLE = 'ねこくん＠アラサーエンジニアのポートフォリオ';
  const SECTION_JA = { home: 'ホーム', about: '自己紹介', skills: 'スキル', career: '職務経歴', links: '関連リンク', contact: 'お問い合わせ' };
  // API base from runtime config (set by GitHub Actions on Pages)
  const RUNTIME_BASE = (typeof window !== 'undefined' && window.__APP_CONFIG__ && window.__APP_CONFIG__.API_BASE) || '';
  // Local fallback when running via docker-compose
  const LOCAL_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:8888' : '';
  const API_BASE = RUNTIME_BASE || LOCAL_BASE;

  let portfolioData = null;
  let io; // IntersectionObserver
  const routes = ["home", "about", "skills", "career", "links", "contact"];
  const views = new Map();
  const nav = document.getElementById("site-nav");
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  document.querySelectorAll(".view").forEach((el) => {
    views.set(el.getAttribute("data-route"), el);
  });

  function setActiveNav(route){
    if(!nav) return;
    nav.querySelectorAll("a").forEach(a => {
      const target = (a.getAttribute("href") || "").replace(/^#/, "");
      a.classList.toggle("active", target === route);
    });
  }

  function show(route){
    const r = routes.includes(route) ? route : "home";
    for (const [key, el] of views.entries()){
      const on = key === r;
      el.classList.toggle("active", on);
    }
    setActiveNav(r);
    document.title = `${SITE_TITLE} — ${SECTION_JA[r] || r}`;
    if (window.innerWidth < 760) closeMenu();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function capitalize(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

  // Router: hashchange + initial load
  function currentRoute(){ return (location.hash || "#home").replace(/^#/, ""); }
  window.addEventListener("hashchange", () => show(currentRoute()));
  show(currentRoute());

  // Fetch portfolio data once on first load and render sections
  fetch(`${API_BASE}/api/portfolio`, { method: 'GET' })
    .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
    .then(data => {
      portfolioData = data;
      renderFromData(data);
      // Clear loading state for API-driven sections
      ['about','skills','career','links'].forEach(id => {
        const sec = document.getElementById(id);
        if (sec) sec.classList.remove('loading');
      });
    })
    .catch(err => {
      console.warn('Failed to fetch portfolio data:', err);
      // Show error in loading area
      ['about','skills','career','links'].forEach(id => {
        const sec = document.getElementById(id);
        if (!sec) return;
        const ind = sec.querySelector('.loading-indicator');
        if (ind) ind.innerHTML = '<span style="color:#d00">読み込みに失敗しました。再読み込みしてください。</span>';
      });
    });

  // Smooth reveal on scroll
  io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting){
        e.target.classList.add("reveal");
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: "-10% 0px -10% 0px", threshold: 0.05 });
  document.querySelectorAll(".reveal-on-scroll").forEach(el => io.observe(el));

  // Mobile navigation toggle
  const toggle = document.querySelector(".nav-toggle");
  function closeMenu(){
    toggle?.setAttribute("aria-expanded", "false");
    nav?.classList.remove("open");
  }
  toggle?.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    nav?.classList.toggle("open", !open);
  });

  // Delegate internal nav clicks to use hash routing
  document.addEventListener("click", (e) => {
    const a = e.target instanceof Element ? e.target.closest("a[data-link]") : null;
    if (!a) return;
    const href = a.getAttribute("href") || "";
    if (href.startsWith("#")){
      e.preventDefault();
      const route = href.replace(/^#/, "");
      if (route !== currentRoute()) location.hash = `#${route}`;
      else show(route); // re-render if same route
    }
  });

  function renderFromData(data){
    // Home はハードコーディングのため、API では上書きしない

    // Contact
    const list = document.querySelector('#contact .contact-list');
    if (list) {
      list.innerHTML = '';
      const { email, github, linkedin } = data.profile?.contacts || {};
      if (email) list.appendChild(li(a(`mailto:${email}`, email)));
      if (github) list.appendChild(li(a(github, 'GitHub')));
      if (linkedin) list.appendChild(li(a(linkedin, 'LinkedIn')));
    }

    // Skills (categorized)
    const skillsWrap = document.querySelector('#skills .skills-grid');
    if (skillsWrap) {
      const dict = data.skills || {};
      const order = [
        { key: 'languages', label: '言語' },
        { key: 'frameworks', label: 'フレームワーク' },
        { key: 'tools', label: 'ツール' },
        { key: 'clouds', label: 'クラウドサービス' }
      ];
      skillsWrap.innerHTML = '';
      order.forEach(({key, label}) => {
        const list = dict[key] || [];
        const group = document.createElement('div');
        group.className = 'skill-group reveal-on-scroll';
        group.innerHTML = `
          <h3 class="skill-title">${label}</h3>
          <ul class="chip-list">${list.map((v) => `<li class=\"chip\">${escapeHTML(v)}</li>`).join('')}</ul>`;
        skillsWrap.appendChild(group);
        if (io) io.observe(group);
      });
    }

    // Career
    const grid = document.querySelector('#career .grid');
    if (grid) {
      grid.innerHTML = '';
      (data.careers || []).forEach((c, i) => {
        const card = document.createElement('article');
        card.className = 'card reveal-on-scroll';
        if (i) card.style.setProperty('--d', `${i * 0.05}s`);
        const lines = (c.description || []).slice(0,3).map(s => `<li>${escapeHTML(s)}</li>`).join('');
        const industry = c.industry ? `<div class=\"subtitle muted\">${escapeHTML(c.industry)}</div>` : '';
        const langsText = (c.languages || []).map(escapeHTML).join('、 ');
        const toolsText = (c.tools || []).map(escapeHTML).join('、 ');
        const langsLine = langsText ? `<div class=\"meta-line\"><strong>言語:</strong> ${langsText}</div>` : '';
        const toolsLine = toolsText ? `<div class=\"meta-line\"><strong>ツール:</strong> ${toolsText}</div>` : '';
        card.innerHTML = `
          <div class="card-body">
            ${c.period ? `<div class="badge">${escapeHTML(c.period)}</div>` : ''}
            <h3 class="card-title">${escapeHTML(c.title || '')}</h3>
            ${industry}
            ${lines ? `<ul class="desc-list">${lines}</ul>` : ''}
            ${langsLine}
            ${toolsLine}
          </div>`;
        grid.appendChild(card);
        if (io) io.observe(card); // enable reveal animation for dynamically added
      });
    }

    // Links
    const linksGrid = document.querySelector('#links .grid');
    if (linksGrid) {
      linksGrid.innerHTML = '';
      (data.links || []).forEach((l, i) => {
        const card = document.createElement('article');
        card.className = 'card reveal-on-scroll';
        if (i) card.style.setProperty('--d', `${i * 0.05}s`);
        const img = escapeAttr(l.image || 'assets/images/nekokun.jpeg');
        const title = escapeHTML(l.title || 'リンク');
        const desc = escapeHTML(l.desc || '関連リンク');
        const href = escapeAttr(l.href || '#');
        card.innerHTML = `
          <a class="card-media" href="${href}" target="_blank" rel="noopener">
            <img src="${img}" alt="${title}" />
          </a>
          <div class="card-body">
            <h3 class="card-title">${title}</h3>
            <p class="card-text">${desc}</p>
            <div class="card-actions">
              <a class="btn small" href="${href}" target="_blank" rel="noopener">開く</a>
            </div>
          </div>`;
        linksGrid.appendChild(card);
        if (io) io.observe(card);
      });
    }
  }

  // Small DOM helpers
  function a(href, text){ const el = document.createElement('a'); el.href = href; el.textContent = text; if (!href.startsWith('mailto:')) { el.target = '_blank'; el.rel = 'noopener'; } return el; }
  function li(child){ const el = document.createElement('li'); el.appendChild(child); return el; }
  function escapeHTML(s){ return String(s).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function escapeAttr(s){ return String(s).replace(/"/g, '&quot;'); }
})();
