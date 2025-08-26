// Simple hash-based SPA router + small UX enhancements
(function(){
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
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function capitalize(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

  // Router: hashchange + initial load
  function currentRoute(){ return (location.hash || "#home").replace(/^#/, ""); }
  window.addEventListener("hashchange", () => show(currentRoute()));
  show(currentRoute());

  // Smooth reveal on scroll
  const io = new IntersectionObserver((entries) => {
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
})();

