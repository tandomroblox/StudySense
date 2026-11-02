(() => {
  "use strict";

  const $ = selector => document.querySelector(selector);
  const authPanel = $("#authPanel");
  const authLoadingPanel = $("#authLoadingPanel");
  const authForm = $("#authForm");
  const emailInput = $("#emailInput");
  const passwordInput = $("#passwordInput");
  const authHeading = $("#authHeading");
  const authSubmit = $("#authSubmit");
  const authMessage = $("#authMessage");
  const showLogin = $("#showLogin");
  const showRegister = $("#showRegister");
  const googleSignIn = $("#googleSignIn");

  if (!authPanel || !authForm || !emailInput || !passwordInput ||
      !authSubmit || !authMessage || !showLogin || !showRegister || !googleSignIn) {
    console.error("StudySense authentication page is missing required elements.");
    if (authLoadingPanel) authLoadingPanel.hidden = true;
    if (authPanel) authPanel.hidden = false;
    if (authMessage) authMessage.textContent = "The sign-in page could not initialise. Please refresh the page.";
    return;
  }

  let authMode = "login";
  let submitting = false;

  const googleMessages = {
    linked: "Google is now connected to your StudySense account.",
    link_required: "That Google email already has a StudySense account. Sign in with email and password first, then choose Connect Google.",
    signin_required: "Sign in to your StudySense account before connecting Google.",
    already_linked: "That Google account is already connected to a different StudySense account.",
    email_conflict: "That Google email belongs to a different StudySense account. Sign in to that account before connecting it.",
    invalid_state: "Google sign-in could not be verified. Please try again.",
    cancelled: "Google sign-in was cancelled.",
    not_configured: "Google sign-in is not configured yet. Please try email sign-in or contact the app owner.",
    failed: "Google sign-in failed. Please try again."
  };

  async function api(path, options = {}) {
    const response = await fetch(path, {
      credentials: "same-origin",
      cache: "no-store",
      ...options,
      headers: {
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(typeof data.error === "string" ? data.error : `Request failed (${response.status}).`);
    }
    return data;
  }

  function setMessage(message, kind = "error") {
    authMessage.textContent = message;
    authMessage.dataset.kind = kind;
  }

  function setAuthMode(mode) {
    authMode = mode === "register" ? "register" : "login";
    const registering = authMode === "register";
    authHeading.textContent = registering ? "Create your account" : "Welcome back";
    authSubmit.textContent = registering ? "Create account" : "Sign in";
    passwordInput.autocomplete = registering ? "new-password" : "current-password";
    passwordInput.minLength = registering ? 10 : 1;
    showLogin.classList.toggle("active", !registering);
    showRegister.classList.toggle("active", registering);
    showLogin.setAttribute("aria-pressed", String(!registering));
    showRegister.setAttribute("aria-pressed", String(registering));
    setMessage("");
  }

  function setBusy(busy, message = "") {
    submitting = busy;
    authSubmit.disabled = busy;
    showLogin.disabled = busy;
    showRegister.disabled = busy;
    googleSignIn.disabled = busy;
    authForm.setAttribute("aria-busy", String(busy));
    if (message) setMessage(message, "status");
    if (!busy) authSubmit.textContent = authMode === "register" ? "Create account" : "Sign in";
  }

  async function verifySession() {
    const data = await api("/api/auth/me", { method: "GET" });
    return data.user || null;
  }

  showLogin.addEventListener("click", () => setAuthMode("login"));
  showRegister.addEventListener("click", () => setAuthMode("register"));
  googleSignIn.addEventListener("click", () => {
    window.location.assign("/api/auth/google/start");
  });

  authForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (submitting) return;

    if (!authForm.reportValidity()) return;
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    setBusy(true, authMode === "register" ? "Creating your account…" : "Signing you in…");

    try {
      await api(authMode === "register" ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      // Confirm that the browser accepted the HttpOnly session cookie before leaving login.
      const user = await verifySession();
      if (!user) {
        throw new Error("Your credentials were accepted, but this browser did not retain the sign-in session. Please enable cookies and try again.");
      }

      passwordInput.value = "";
      setMessage("Signed in. Opening your study space…", "status");
      window.location.replace("/dashboard.html");
    } catch (error) {
      setMessage(error && error.message ? error.message : "Could not sign in. Please try again.");
      setBusy(false);
    }
  });

  const params = new URLSearchParams(window.location.search);
  const requestedMode = params.get("mode");
  setAuthMode(requestedMode === "register" ? "register" : "login");

  const googleStatus = params.get("google");
  if (googleStatus && googleMessages[googleStatus]) {
    setMessage(googleMessages[googleStatus]);
  }
  if (params.has("mode") || params.has("google") || params.has("return")) {
    window.history.replaceState({}, "", window.location.pathname);
  }

  async function initialise() {
    if (authLoadingPanel) authLoadingPanel.hidden = true;
    authPanel.hidden = false;
    try {
      const user = await verifySession();
      if (user) {
        window.location.replace("/dashboard.html");
        return;
      }
    } catch (error) {
      // Keep the form usable even if the session-check request is temporarily unavailable.
      setMessage("We couldn't check your existing session. You can still try signing in. " +
        (error && error.message ? error.message : ""));
    }
    emailInput.focus({ preventScroll: true });
  }

  initialise();
})();
