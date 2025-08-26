// Simple hash-based SPA router + small UX enhancements
(function(){
  // API base from runtime config (set by GitHub Actions on Pages)
  const RUNTIME_BASE = (typeof window !== 'undefined' && window.__APP_CONFIG__ && window.__APP_CONFIG__.API_BASE) || '';
  // Local fallback when running via docker-compose
  const LOCAL_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:8888' : '';
  const API_BASE = RUNTIME_BASE || LOCAL_BASE;

  let portfolioData = null;
  let io; // IntersectionObserver
  const routes = ["home", "about", "skills", "projects", "contact"];
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
    document.title = `${capitalize(r)} — Portfolio`;
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
    })
    .catch(err => {
      console.warn('Failed to fetch portfolio data:', err);
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
    // Hero
    const heroTitle = document.querySelector('#home h1');
    const lead = document.querySelector('#home .lead');
    if (heroTitle) heroTitle.innerHTML = `Hello, I’m <span class="accent">${escapeHTML(data.profile?.name || 'Your Name')}</span>`;
    if (lead) lead.textContent = `${data.profile?.title || 'Software Developer'} — ${data.profile?.summary || ''}`;

    // Contact
    const list = document.querySelector('#contact .contact-list');
    if (list) {
      list.innerHTML = '';
      const { email, github, linkedin } = data.profile?.contacts || {};
      if (email) list.appendChild(li(a(`mailto:${email}`, email)));
      if (github) list.appendChild(li(a(github, 'GitHub')));
      if (linkedin) list.appendChild(li(a(linkedin, 'LinkedIn')));
    }

    // Skills
    const skillsUl = document.querySelector('#skills .chip-list');
    if (skillsUl) {
      skillsUl.innerHTML = '';
      (data.skills || []).forEach(s => {
        const liEl = document.createElement('li');
        liEl.className = 'chip';
        liEl.textContent = s;
        skillsUl.appendChild(liEl);
      });
    }

    // Projects
    const grid = document.querySelector('#projects .grid');
    if (grid) {
      grid.innerHTML = '';
      (data.projects || []).forEach((p, i) => {
        const card = document.createElement('article');
        card.className = 'card reveal-on-scroll';
        if (i) card.style.setProperty('--d', `${i * 0.05}s`);
        card.innerHTML = `
          <div class="card-body">
            <h3 class="card-title">${escapeHTML(p.title)}</h3>
            <p class="card-text">${escapeHTML(p.desc)}</p>
          </div>
          <div class="card-actions">
            ${p.live ? `<a class="btn small" href="${escapeAttr(p.live)}" target="_blank" rel="noopener">Live</a>` : ''}
            ${p.code ? `<a class="btn small ghost" href="${escapeAttr(p.code)}" target="_blank" rel="noopener">Code</a>` : ''}
          </div>`;
        grid.appendChild(card);
        if (io) io.observe(card); // enable reveal animation for dynamically added
      });
    }
  }

  // Small DOM helpers
  function a(href, text){ const el = document.createElement('a'); el.href = href; el.textContent = text; if (!href.startsWith('mailto:')) { el.target = '_blank'; el.rel = 'noopener'; } return el; }
  function li(child){ const el = document.createElement('li'); el.appendChild(child); return el; }
  function escapeHTML(s){ return String(s).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function escapeAttr(s){ return String(s).replace(/"/g, '&quot;'); }
})();
