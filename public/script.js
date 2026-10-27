const authPanel = document.querySelector("#authPanel");
const appPanel = document.querySelector("#appPanel");
const authForm = document.querySelector("#authForm");
const emailInput = document.querySelector("#emailInput");
const passwordInput = document.querySelector("#passwordInput");
const authHeading = document.querySelector("#authHeading");
const authSubmit = document.querySelector("#authSubmit");
const authMessage = document.querySelector("#authMessage");
const showLogin = document.querySelector("#showLogin");
const showRegister = document.querySelector("#showRegister");
const googleSignIn = document.querySelector("#googleSignIn");
const connectGoogleButton = document.querySelector("#connectGoogleButton");
const logoutButton = document.querySelector("#logoutButton");
const signedInAs = document.querySelector("#signedInAs");
const form = document.querySelector("#taskForm");
const taskInput = document.querySelector("#taskInput");
const subjectInput = document.querySelector("#subjectInput");
const taskList = document.querySelector("#taskList");
const taskMessage = document.querySelector("#taskMessage");

const subjectExamples = {
  "Mathematics": "e.g. Complete exercise 4.2",
  "Science": "e.g. Revise chemical reactions",
  "Social Science": "e.g. Complete the question answers",
  "English": "e.g. Learn new words and their meanings",
  "Hindi": "e.g. Review today's lesson",
  "Telugu": "e.g. Complete the Telugu writing exercise",
  "IT-402": "e.g. Revise computer applications",
  "Skill Education": "e.g. Complete the skill activity",
  "Vocational Education": "e.g. Review today's practical work"
};
let authMode = "login";
let tasks = [];

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
    headers: {
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

function setAuthMode(mode) {
  authMode = mode;
  const registering = mode === "register";
  authHeading.textContent = registering ? "Create your account" : "Welcome back";
  authSubmit.textContent = registering ? "Create account" : "Sign in";
  passwordInput.autocomplete = registering ? "new-password" : "current-password";
  showLogin.classList.toggle("active", !registering);
  showRegister.classList.toggle("active", registering);
  authMessage.textContent = "";
}
showLogin.addEventListener("click", () => setAuthMode("login"));
showRegister.addEventListener("click", () => setAuthMode("register"));
googleSignIn.addEventListener("click", () => { window.location.assign("/api/auth/google/start"); });
connectGoogleButton.addEventListener("click", () => { window.location.assign("/api/auth/google/start?mode=link"); });

const googleMessages = {
  linked: "Google is now connected to your StudySense account.",
  link_required: "That Google email already has a StudySense account. Sign in with email and password first, then choose Connect Google.",
  signin_required: "Sign in to your StudySense account before connecting Google.",
  already_linked: "That Google account is already connected to a different StudySense account.",
  email_conflict: "That Google email belongs to a different StudySense account. Sign in to that account before connecting it.",
  invalid_state: "Google sign-in could not be verified. Please try again.",
  cancelled: "Google sign-in was cancelled.",
  not_configured: "Google sign-in is not configured yet. The app owner needs to finish the Google and Cloudflare setup.",
  failed: "Google sign-in failed. Please try again."
};
const googleStatus = new URLSearchParams(window.location.search).get("google");
if (googleStatus && googleMessages[googleStatus]) {
  authMessage.textContent = googleMessages[googleStatus];
  if (googleStatus === "linked") {
    authMessage.textContent = "";
  }
  if (googleStatus === "linked") {
    // The signed-in session remains valid after linking; start() will restore the account.
  }
  window.history.replaceState({}, "", window.location.pathname);
}

function showSignedOut(message = "") {
  authPanel.hidden = false;
  appPanel.hidden = true;
  connectGoogleButton.hidden = true;
  authMessage.textContent = message;
  tasks = [];
}
function showSignedIn(user) {
  authPanel.hidden = true;
  appPanel.hidden = false;
  connectGoogleButton.hidden = false;
  signedInAs.textContent = `Signed in as ${user.email}`;
}

authForm.addEventListener("submit", async event => {
  event.preventDefault();
  authSubmit.disabled = true;
  authMessage.textContent = authMode === "register" ? "Creating your account…" : "Signing you in…";
  try {
    const user = await api(`/api/auth/${authMode === "register" ? "register" : "login"}`, {
      method: "POST",
      body: JSON.stringify({ email: emailInput.value, password: passwordInput.value })
    });
    passwordInput.value = "";
    showSignedIn(user.user);
    await loadTasks();
  } catch (error) {
    authMessage.textContent = error.message;
  } finally {
    authSubmit.disabled = false;
  }
});

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  try {
    await api("/api/auth/logout", { method: "POST" });
    showSignedOut("You have signed out.");
    setAuthMode("login");
  } catch (error) {
    taskMessage.textContent = error.message;
  } finally {
    logoutButton.disabled = false;
  }
});

function updateTaskPlaceholder() {
  taskInput.placeholder = subjectExamples[subjectInput.value] || "Enter a study task";
}
subjectInput.addEventListener("change", updateTaskPlaceholder);
updateTaskPlaceholder();

function updateStats() {
  const completed = tasks.filter(task => task.done).length;
  const total = tasks.length;
  document.querySelector("#totalTasks").textContent = total;
  document.querySelector("#completedTasks").textContent = completed;
  document.querySelector("#completionRate").textContent =
    `${total ? Math.round((completed / total) * 100) : 0}%`;
  document.querySelector("#taskCount").textContent =
    `${total} task${total === 1 ? "" : "s"}`;
}

function renderTasks() {
  taskList.replaceChildren();
  if (tasks.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No tasks yet. Add your first study task above!";
    taskList.append(empty);
  }

  for (const task of tasks) {
    const row = document.createElement("div");
    row.className = `task${task.done ? " done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", `Complete ${task.title}`);
    checkbox.addEventListener("change", async () => {
      checkbox.disabled = true;
      try {
        await api(`/api/tasks/${encodeURIComponent(task.id)}`, {
          method: "PATCH", body: JSON.stringify({ done: checkbox.checked })
        });
        task.done = checkbox.checked;
        renderTasks();
      } catch (error) {
        taskMessage.textContent = error.message;
        checkbox.checked = task.done;
        checkbox.disabled = false;
      }
    });

    const info = document.createElement("div");
    info.className = "task-info";
    const title = document.createElement("div");
    title.className = "task-title";
    title.textContent = task.title;
    const subject = document.createElement("p");
    subject.textContent = task.subject;
    info.append(title, subject);

    const remove = document.createElement("button");
    remove.className = "delete-btn";
    remove.textContent = "Delete";
    remove.setAttribute("aria-label", `Delete ${task.title}`);
    remove.addEventListener("click", async () => {
      remove.disabled = true;
      try {
        await api(`/api/tasks/${encodeURIComponent(task.id)}`, { method: "DELETE" });
        tasks = tasks.filter(item => item.id !== task.id);
        taskMessage.textContent = "";
        renderTasks();
      } catch (error) {
        taskMessage.textContent = error.message;
        remove.disabled = false;
      }
    });

    row.append(checkbox, info, remove);
    taskList.append(row);
  }
  updateStats();
}

async function loadTasks() {
  taskMessage.textContent = "";
  taskList.innerHTML = '<p class="empty">Loading your tasks…</p>';
  try {
    const data = await api("/api/tasks");
    tasks = data.tasks.map(task => ({
      id: task.id, title: task.title, subject: task.subject, done: task.completed === 1 || task.done === true
    }));
    renderTasks();
  } catch (error) {
    if (error.message.includes("sign in")) {
      showSignedOut("Your session expired. Please sign in again.");
      return;
    }
    taskList.innerHTML = "";
    taskMessage.textContent = error.message;
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const title = taskInput.value.trim();
  if (!title) return;
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  taskMessage.textContent = "";
  try {
    await api("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title, subject: subjectInput.value })
    });
    taskInput.value = "";
    updateTaskPlaceholder();
    await loadTasks();
  } catch (error) {
    taskMessage.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

async function start() {
  try {
    const data = await api("/api/auth/me");
    if (data.user) {
      showSignedIn(data.user);
      await loadTasks();
      if (googleStatus === "linked") taskMessage.textContent = googleMessages.linked;
    } else {
      showSignedOut(googleStatus && googleMessages[googleStatus] ? googleMessages[googleStatus] : "");
    }
  } catch {
    showSignedOut("Could not connect to StudySense. Refresh the page and try again.");
  }
}
start();


// Register the offline app shell. API responses and account data are never cached.
if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(error => {
      console.warn("StudySense offline support could not be enabled:", error);
    });
  });
}
