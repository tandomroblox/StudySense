(() => {
  "use strict";
  const root = document.getElementById("appRoot");
  const page = document.body.dataset.page || "dashboard";
  const pageCopy = {
    dashboard: { eyebrow: "YOUR PERSONAL STUDY DASHBOARD", title: "Make today count.", description: "A calm overview of your tasks, exam readiness, and next best step." },
    planner: { eyebrow: "MAKE TIME FOR WHAT MATTERS", title: "Your study planner.", description: "Turn your study goal into a doable plan, then focus on one task at a time." },
    exams: { eyebrow: "PLAN AHEAD", title: "Know what is coming.", description: "Add exams, see readiness, and keep upcoming deadlines visible." },
    syllabus: { eyebrow: "CURRICULUM & PROGRESS", title: "Track every chapter.", description: "Use the textbook catalogue, import chapters, and mark your progress as you go." },
    learn: { eyebrow: "ACTIVE RECALL", title: "Learn it. Test it. Retain it.", description: "Practice questions, flashcards, spaced revision, and an AI tutor in one workspace." },
    library: { eyebrow: "YOUR PERSONAL KNOWLEDGE BASE", title: "Keep useful things close.", description: "Save the notes, formulas, definitions, and doubts you will want to revisit." },
    profile: { eyebrow: "YOUR ACCOUNT", title: "Profile & preferences.", description: "Set your class and daily study goal once; StudySense uses them to tailor your workspace." }
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
  function setupNavigation() {
    document.querySelectorAll("[data-nav]").forEach(link => {
      if (link.dataset.nav === page) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
    });
    const menu = document.getElementById("accountMenuPanel");
    const button = document.getElementById("accountMenuButton");
    const closeMenu = () => {
      menu.hidden = true;
      button.setAttribute("aria-expanded", "false");
    };
    button.addEventListener("click", () => {
      menu.hidden = !menu.hidden;
      button.setAttribute("aria-expanded", String(!menu.hidden));
    });
    document.addEventListener("click", event => {
      if (!event.target.closest("#accountMenu")) closeMenu();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") { closeMenu(); button.focus(); }
    });
  }
  async function boot() {
    try {
      const response = await fetch("/app-shell.html", { cache: "no-cache" });
      if (!response.ok) throw new Error("The page layout could not be loaded.");
      root.innerHTML = await response.text();
      const copy = pageCopy[page] || pageCopy.dashboard;
      const eyebrow = document.querySelector(".welcome .eyebrow");
      const heading = document.querySelector(".welcome h1");
      const description = document.querySelector(".welcome .muted");
      eyebrow.textContent = copy.eyebrow;
      heading.textContent = copy.title;
      description.textContent = copy.description;
      document.title = copy.title + " · StudySense";
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
