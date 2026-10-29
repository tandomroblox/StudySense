(() => {
  "use strict";
  const root = document.getElementById("appRoot");
  let currentPage = document.body.dataset.page || "dashboard";

  const pageCopy = {
    dashboard: { eyebrow: "YOUR PERSONAL STUDY DASHBOARD", title: "Make today count.", description: "A calm overview of your tasks, exam readiness, and next best step." },
    planner: { eyebrow: "MAKE TIME FOR WHAT MATTERS", title: "Your study planner.", description: "Turn your study goal into a doable plan, then focus on one task at a time." },
    exams: { eyebrow: "PLAN AHEAD", title: "Know what is coming.", description: "Add exams, see readiness, and keep upcoming deadlines visible." },
    syllabus: { eyebrow: "CURRICULUM & PROGRESS", title: "Track every chapter.", description: "Use the textbook catalogue, import chapters, and mark your progress as you go." },
    learn: { eyebrow: "ACTIVE RECALL", title: "Learn it. Test it. Retain it.", description: "Practice questions, flashcards, spaced revision, and an AI tutor in one workspace." },
    library: { eyebrow: "YOUR PERSONAL KNOWLEDGE BASE", title: "Keep useful things close.", description: "Save the notes, formulas, definitions, and doubts you will want to revisit." },
    profile: { eyebrow: "YOUR ACCOUNT", title: "Profile & preferences.", description: "Set your class and daily study goal once; StudySense uses them to tailor your workspace." }
  };
  const routeByPath = {
    "/": "dashboard",
    "/index.html": "dashboard",
    "/planner.html": "planner",
    "/exams.html": "exams",
    "/syllabus.html": "syllabus",
    "/learn.html": "learn",
    "/library.html": "library",
    "/profile.html": "profile"
  };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Could not load " + src));
      document.body.append(script);
    });
  }

  let closeAccountMenu = () => {};

  function renderPage(nextPage) {
    if (!pageCopy[nextPage]) return;
    currentPage = nextPage;
    document.body.dataset.page = nextPage;
    const copy = pageCopy[nextPage];
    document.querySelector(".welcome .eyebrow").textContent = copy.eyebrow;
    document.querySelector(".welcome h1").textContent = copy.title;
    document.querySelector(".welcome .muted").textContent = copy.description;
    document.title = copy.title + " · StudySense";
    document.querySelectorAll("[data-nav]").forEach(link => {
      const active = link.dataset.nav === currentPage;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    closeAccountMenu();
  }

  function setupNavigation() {
    const menu = document.getElementById("accountMenuPanel");
    const button = document.getElementById("accountMenuButton");
    closeAccountMenu = () => {
      menu.hidden = true;
      button.setAttribute("aria-expanded", "false");
    };
    button.addEventListener("click", () => {
      menu.hidden = !menu.hidden;
      button.setAttribute("aria-expanded", String(!menu.hidden));
    });
    document.addEventListener("click", event => {
      if (!event.target.closest("#accountMenu")) closeAccountMenu();
      const link = event.target.closest("a[data-nav]");
      if (!link || event.defaultPrevented || event.button !== 0 ||
          event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
          link.target === "_blank" || link.hasAttribute("download")) return;
      const target = new URL(link.href, window.location.href);
      if (target.origin !== window.location.origin) return;
      const nextPage = routeByPath[target.pathname];
      if (!nextPage) return;
      event.preventDefault();
      const nextUrl = target.pathname + target.search + target.hash;
      if (nextUrl !== window.location.pathname + window.location.search + window.location.hash) {
        window.history.pushState({ studysensePage: nextPage }, "", nextUrl);
      }
      renderPage(nextPage);
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeAccountMenu();
        button.focus();
      }
    });
    window.addEventListener("popstate", () => {
      const nextPage = routeByPath[window.location.pathname];
      if (nextPage) renderPage(nextPage);
    });
    renderPage(currentPage);
  }

  async function boot() {
    try {
      const response = await fetch("/app-shell.html", { cache: "no-cache" });
      if (!response.ok) throw new Error("The page layout could not be loaded.");
      root.innerHTML = await response.text();
      // Paint the app for returning users while the server verifies the signed session.
      try {
        if (localStorage.getItem("studysense-session-hint") === "1") {
          const loading = root.querySelector("#authLoadingPanel");
          const auth = root.querySelector("#authPanel");
          const app = root.querySelector("#appPanel");
          if (loading && auth && app) {
            loading.hidden = true;
            auth.hidden = true;
            app.hidden = false;
            document.body.classList.add("is-signed-in");
            let cachedEmail = "";
            try {
              const cachedUser = JSON.parse(sessionStorage.getItem("studysense-session-user") || "null");
              if (cachedUser && typeof cachedUser.email === "string") cachedEmail = cachedUser.email;
            } catch (_) {}
            const emailLabel = root.querySelector("#signedInAs");
            if (emailLabel) emailLabel.textContent = cachedEmail ? "Signed in as " + cachedEmail : "Restoring your session…";
            const connectButton = root.querySelector("#connectGoogleButton");
            if (connectButton) connectButton.hidden = !cachedEmail;
          }
        }
      } catch (_) {}
      setupNavigation();
      await loadScript("/syllabus.js");
      await loadScript("/script.js");
      await loadScript("/study-tools.js");
    } catch (error) {
      root.innerHTML = '<main class="container"><section class="card"><h1>StudySense could not load</h1><p class="muted"></p><a href="/index.html">Try the dashboard</a></section></main>';
      root.querySelector(".muted").textContent = error.message || "Please check your connection and reload.";
    }
  }
  boot();
})();
