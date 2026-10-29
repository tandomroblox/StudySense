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
  let deferredInstallPrompt = null;
  let installBannerDismissed = false;

  const isStandaloneApp = () =>
    window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

  function mountInstallBanner() {
    if (!root || isStandaloneApp() || installBannerDismissed || root.querySelector("#pwaInstallBanner")) return;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!deferredInstallPrompt && !isMobile) return;

    const banner = document.createElement("aside");
    banner.id = "pwaInstallBanner";
    banner.className = "pwa-install-banner";
    banner.setAttribute("aria-label", "Install StudySense");
    const copy = document.createElement("div");
    copy.className = "pwa-install-copy";
    const heading = document.createElement("strong");
    heading.textContent = "Take StudySense with you";
    const detail = document.createElement("span");
    detail.textContent = deferredInstallPrompt
      ? "Install the app for a home-screen icon and a focused, app-like window."
      : /iPhone|iPad|iPod/i.test(navigator.userAgent)
        ? "On iPhone/iPad, use Share → Add to Home Screen."
        : "In your browser menu, choose Install app or Add to Home screen.";
    copy.append(heading, detail);
    const actions = document.createElement("div");
    actions.className = "pwa-install-actions";
    const install = document.createElement("button");
    install.type = "button";
    install.className = "pwa-install-button";
    install.textContent = deferredInstallPrompt ? "Install" : "How?";
    install.addEventListener("click", async () => {
      if (!deferredInstallPrompt) {
        detail.textContent = /iPhone|iPad|iPod/i.test(navigator.userAgent)
          ? "Tap Share in Safari, then choose Add to Home Screen → Add."
          : "Open ⋮ in Chrome, then choose Install app or Add to Home screen.";
        return;
      }
      const promptEvent = deferredInstallPrompt;
      deferredInstallPrompt = null;
      promptEvent.prompt();
      try { await promptEvent.userChoice; } catch (_) {}
      banner.remove();
    });
    const dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.className = "pwa-install-dismiss";
    dismiss.setAttribute("aria-label", "Dismiss install suggestion");
    dismiss.textContent = "×";
    dismiss.addEventListener("click", () => { installBannerDismissed = true; banner.remove(); });
    actions.append(install, dismiss);
    banner.append(copy, actions);
    const topbar = root.querySelector(".topbar");
    if (topbar) topbar.insertAdjacentElement("afterend", banner);
    else root.prepend(banner);
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    const existing = root.querySelector("#pwaInstallBanner");
    if (existing) {
      const installButton = existing.querySelector(".pwa-install-button");
      const detail = existing.querySelector(".pwa-install-copy span");
      if (installButton) installButton.textContent = "Install";
      if (detail) detail.textContent = "Install the app for a home-screen icon and a focused, app-like window.";
    }
    mountInstallBanner();
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    root.querySelector("#pwaInstallBanner")?.remove();
  });

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
      mountInstallBanner();
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
