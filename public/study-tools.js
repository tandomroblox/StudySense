(() => {
  "use strict";
  const appPanel = document.querySelector("#appPanel");
  if (!appPanel) return;

  const hub = document.createElement("section");
  hub.id = "productivityHub";
  hub.className = "card productivity-hub";
  hub.innerHTML = `
    <div class="section-heading">
      <div><p class="eyebrow">LEARN · REVISE · PREPARE</p><h2>StudySense learning engine</h2></div>
      <span class="pill">Beta</span>
    </div>
    <p class="muted hub-intro">Your revision schedule, practice questions, progress estimate, and personal study notes — tied to the chapters you add to your exams.</p>
    <div class="productivity-grid">
      <section class="productivity-panel">
        <h3>Exam readiness</h3>
        <p class="hub-muted">An estimate from recorded chapter progress and practice results, not a prediction of marks.</p>
        <div id="hubReadiness" class="hub-list"><p class="hub-empty">Loading your study data…</p></div>
        <button id="hubDownloadSummary" class="hub-btn-secondary hub-share" type="button">Download parent-ready summary</button>
        <p class="hub-muted">The summary is generated on this device when you click. Nothing is sent to a parent automatically.</p>
        <p id="hubReadinessMessage" class="hub-error" role="status"></p>
      </section>
      <section class="productivity-panel">
        <h3>Today's suggested plan</h3>
        <p class="hub-muted">Builds a manageable session from your daily goal, due revisions, and chapters for the nearest upcoming exams. Suggestions become tasks only when you choose.</p>
        <div id="hubDailyPlan" class="hub-list"><p class="hub-empty">Preparing your study plan…</p></div>
        <div class="hub-row-actions"><button id="hubAddPlanTasks" type="button">Add plan to my tasks</button><button id="hubRefreshPlan" class="hub-btn-secondary" type="button">Refresh plan</button></div>
        <p id="hubDailyPlanMessage" class="hub-error" role="status"></p>
      </section>
      <section class="productivity-panel">
        <h3>Smart revision queue</h3>
        <p class="hub-muted">Review a chapter and rate how it felt. The next date adjusts to your rating.</p>
        <div id="hubRevisionQueue" class="hub-list"><p class="hub-empty">Loading your revisions…</p></div>
        <p id="hubRevisionMessage" class="hub-error" role="status"></p>
      </section>
      <section class="productivity-panel">
        <h3>AI practice generator</h3>
        <p class="hub-muted">Generates original practice. Add a short lesson excerpt to keep questions grounded in your exact material.</p>
        <form id="hubPracticeForm">
          <label for="hubGrade">Class</label><select id="hubGrade"><option value="6">Class 6</option><option value="7">Class 7</option><option value="8">Class 8</option><option value="9" selected>Class 9</option><option value="10">Class 10</option></select>
          <label for="hubSubject">Subject</label><select id="hubSubject"><option>Mathematics</option><option>Science</option><option>Social Science</option><option>English</option><option>Hindi</option><option>Telugu</option><option>IT-402</option><option>Skill Education</option><option>Vocational Education</option></select>
          <label for="hubChapter">Topic / chapter</label><input id="hubChapter" maxlength="180" placeholder="e.g. Linear equations" required>
          <label for="hubQuestionType">Question type</label><select id="hubQuestionType"><option value="mixed">Mixed practice</option><option value="mcq">MCQs</option><option value="short">Short answer</option><option value="numerical">Numericals</option></select>
          <label for="hubQuestionCount">Number of questions</label><select id="hubQuestionCount"><option value="3">3 questions</option><option value="5" selected>5 questions</option><option value="10">10 questions</option></select>
          <label for="hubContext">Lesson excerpt (optional)</label><textarea id="hubContext" maxlength="6000" rows="4" placeholder="Paste a short excerpt or your own notes; up to 6,000 characters."></textarea>
          <button id="hubGeneratePractice" type="submit">Generate practice</button>
        </form>
        <p id="hubPracticeMessage" class="hub-error" role="status"></p>
        <pre id="hubGeneratedPractice" class="hub-answer" hidden></pre>
        <form id="hubPracticeResultForm" class="hub-share" hidden>
          <p class="hub-muted">Finished the questions? Record your score so the readiness estimate can use it.</p>
          <label for="hubResultQuestions">Questions attempted</label><input id="hubResultQuestions" type="number" min="1" max="10" required>
          <label for="hubResultCorrect">Correct answers</label><input id="hubResultCorrect" type="number" min="0" max="10" required>
          <label for="hubResultNotes">Reflection (optional)</label><textarea id="hubResultNotes" maxlength="1000" rows="2" placeholder="What was difficult?"></textarea>
          <button id="hubRecordPractice" type="submit">Record result in readiness</button>
        </form>
        <p id="hubResultMessage" class="hub-error" role="status"></p>
      </section>
      <section class="productivity-panel">
        <h3>Personal study library</h3>
        <p class="hub-muted">Save notes, formulas, definitions, and doubts against the exact book part and chapter. Items are private to your account.</p>
        <form id="hubLibraryForm">
          <label for="hubLibraryGrade">Class</label><select id="hubLibraryGrade"><option value="6">Class 6</option><option value="7">Class 7</option><option value="8">Class 8</option><option value="9" selected>Class 9</option><option value="10">Class 10</option></select>
          <label for="hubLibrarySubject">Subject</label><select id="hubLibrarySubject"><option>Mathematics</option><option>Science</option><option>Social Science</option><option>English</option><option>Hindi</option><option>Telugu</option><option>IT-402</option><option>Skill Education</option><option>Vocational Education</option></select>
          <label for="hubTextbook">Exact textbook title</label><input id="hubTextbook" maxlength="160" placeholder="e.g. Ganita Prakash" />
          <label for="hubBookPart">Part / edition (if applicable)</label><input id="hubBookPart" maxlength="80" placeholder="e.g. Part II · 2026–27" />
          <label for="hubLibraryChapter">Chapter title</label><input id="hubLibraryChapter" maxlength="180" placeholder="Exact title from your book" />
          <label for="hubItemType">Item type</label><select id="hubItemType"><option value="note">Note</option><option value="formula">Formula</option><option value="definition">Definition</option><option value="doubt">Doubt to revisit</option></select>
          <label for="hubLibraryTitle">Title</label><input id="hubLibraryTitle" maxlength="160" placeholder="A short label" required />
          <label for="hubLibraryContent">Content</label><textarea id="hubLibraryContent" maxlength="8000" rows="4" placeholder="Write your note, formula, definition, or question…" required></textarea>
          <button id="hubSaveLibrary" type="submit">Save to library</button>
          <button id="hubCancelLibraryEdit" class="hub-btn-secondary" type="button" hidden>Cancel edit</button>
        </form>
        <p id="hubLibraryMessage" class="hub-error" role="status"></p>
        <div id="hubLibraryItems" class="hub-list"><p class="hub-empty">Loading your library…</p></div>
      </section>
    </div>`;

  const firstExisting = appPanel.querySelector(".profile-card");
  if (firstExisting) appPanel.insertBefore(hub, firstExisting);
  else appPanel.append(hub);

  const $ = id => document.getElementById(id);
  const safeApi = async (path, options) => {
    const response = await fetch(path, {
      credentials: "same-origin",
      ...(options || {}),
      headers: { ...((options && options.body) ? { "content-type": "application/json" } : {}), ...((options && options.headers) || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || ("Request failed (" + response.status + ")"));
    return data;
  };
  const make = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  let cache = { exams: [], chapters: [], practice: [], flashcards: [], tasks: [], revisions: [], library: [], profile: null };
  let refreshPromise = null;
  let accountGeneration = 0;
  let pendingReview = false;
  let editingLibraryItemId = null;
  let currentDailyPlan = [];
  let lastPractice = null;

  function renderReadiness() {
    const out = $("hubReadiness");
    out.replaceChildren();
    const exams = cache.exams;
    const chapters = cache.chapters;
    if (!exams.length) {
      out.append(make("p", "hub-empty", "Add an exam and its chapter list in the Exam command centre to start readiness tracking."));
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const recentPractice = cache.practice.filter(p => {
      const date = new Date(String(p.practiced_on || "") + "T00:00:00");
      return !Number.isNaN(date.getTime()) && (today - date) <= 30 * 86400000 && date <= today;
    });
    const practiceBySubject = new Map();
    for (const p of recentPractice) {
      const key = String(p.subject || "").replace(/\\s+—\\s+Part\\s+(?:I|II)$/i, "");
      const current = practiceBySubject.get(key) || { questions: 0, correct: 0 };
      current.questions += Number(p.questions) || 0;
      current.correct += Number(p.correct) || 0;
      practiceBySubject.set(key, current);
    }
    for (const exam of exams) {
      const own = chapters.filter(c => c.exam_id === exam.id);
      const statusScore = { not_started: 0, learning: 35, revising: 70, mastered: 100 };
      const coverage = own.length ? Math.round(own.reduce((sum, c) => sum + (statusScore[c.status] || 0), 0) / own.length) : null;
      const normaliseSubject = value => String(value || "").replace(/\\s+—\\s+Part\\s+(?:I|II)$/i, "");
      const subjectNames = new Set(own.map(c => normaliseSubject(c.subject)));
      let questions = 0, correct = 0;
      for (const subject of subjectNames) {
        const item = practiceBySubject.get(subject);
        if (item) { questions += item.questions; correct += item.correct; }
      }
      const accuracy = questions ? Math.round(correct / questions * 100) : null;
      const readiness = coverage === null ? null : accuracy === null ? coverage : Math.round(coverage * 0.7 + accuracy * 0.3);
      const date = new Date(String(exam.exam_date) + "T00:00:00");
      const days = Math.ceil((date - today) / 86400000);
      const card = make("article", "hub-row");
      const top = make("div", "hub-row-top");
      const copy = make("div");
      copy.append(make("div", "hub-row-title", exam.name));
      copy.append(make("div", "hub-row-meta", (days < 0 ? "Date passed" : days === 0 ? "Exam today" : days + " day(s) away") + " · " + own.length + " chapter(s)"));
      top.append(copy, make("span", "pill", readiness === null ? "No chapter data" : readiness + "% estimate"));
      card.append(top);
      const metrics = make("div", "hub-metrics");
      const metric = (value, label) => { const m = make("div", "hub-metric"); m.append(make("strong", "", value), make("span", "", label)); return m; };
      metrics.append(metric(coverage === null ? "—" : coverage + "%", "Chapter progress"), metric(accuracy === null ? "—" : accuracy + "%", "Practice accuracy (30 days)"), metric(own.filter(c => c.status === "mastered").length + "/" + own.length, "Mastered chapters"));
      card.append(metrics);
      card.append(make("p", "hub-muted", accuracy === null ? "Estimate uses chapter status only because there are no recent practice logs for these subjects." : "Estimate combines chapter status (70%) and recorded accuracy in the same subjects over the past 30 days (30%). It is a planning aid, not an exam-score prediction."));
      out.append(card);
    }
  }

  function formatDate(value) {
    if (!value) return "not scheduled";
    const date = new Date(String(value) + "T00:00:00");
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }
  function buildDailyPlan() {
    const profileGoal = Number(cache.profile?.daily_goal_minutes);
    const goalMinutes = Number.isInteger(profileGoal) && profileGoal >= 15 && profileGoal <= 600 ? profileGoal : 60;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
    const due = cache.revisions
      .filter(item => !item.next_review_on || item.next_review_on <= todayKey)
      .sort((a, b) => {
        const dateCompare = String(a.next_review_on || "0000-00-00").localeCompare(String(b.next_review_on || "0000-00-00"));
        if (dateCompare) return dateCompare;
        const examCompare = String(a.exam_date || "9999-99-99").localeCompare(String(b.exam_date || "9999-99-99"));
        return examCompare || String(a.title).localeCompare(String(b.title));
      });
    const futureExams = cache.exams
      .filter(exam => String(exam.exam_date || "") >= todayKey)
      .sort((a, b) => String(a.exam_date).localeCompare(String(b.exam_date)));
    const statusPriority = { not_started: 0, learning: 1, revising: 2, mastered: 3 };
    const chapterCandidates = futureExams.flatMap(exam =>
      cache.chapters.filter(chapter => chapter.exam_id === exam.id && chapter.status !== "mastered")
        .map(chapter => ({ ...chapter, exam_name: exam.name, exam_date: exam.exam_date }))
    ).sort((a, b) =>
      String(a.exam_date).localeCompare(String(b.exam_date)) ||
      (statusPriority[a.status] ?? 1) - (statusPriority[b.status] ?? 1) ||
      String(a.title).localeCompare(String(b.title))
    );
    const usedChapterIds = new Set();
    const plan = [];
    let minutes = 0;
    const append = item => {
      if (plan.length >= 6 || minutes + item.minutes > goalMinutes) return false;
      plan.push(item);
      minutes += item.minutes;
      if (item.chapter_id) usedChapterIds.add(item.chapter_id);
      return true;
    };

    for (const item of due) {
      if (plan.length >= 6) break;
      const subject = String(item.subject || "").replace(/\s+—\s+Part\s+(?:I|II)$/i, "");
      const minutesForReview = Math.min(15, goalMinutes);
      if (!append({
        id: "review-" + item.chapter_id,
        kind: "revision",
        chapter_id: item.chapter_id,
        subject,
        title: "Revise: " + item.title,
        minutes: minutesForReview,
        reason: item.next_review_on && item.next_review_on < todayKey ? "Overdue revision" : item.next_review_on === todayKey ? "Due today" : "New chapter — first review",
        exam_name: item.exam_name
      })) break;
    }

    for (const chapter of chapterCandidates) {
      if (plan.length >= 6) break;
      if (usedChapterIds.has(chapter.id)) continue;
      const subject = String(chapter.subject || "").replace(/\s+—\s+Part\s+(?:I|II)$/i, "");
      const remaining = goalMinutes - minutes;
      const studyMinutes = Math.min(25, remaining);
      if (studyMinutes < 10) break;
      const when = Math.ceil((new Date(String(chapter.exam_date) + "T00:00:00") - today) / 86400000);
      if (!append({
        id: "chapter-" + chapter.id,
        kind: "study",
        chapter_id: chapter.id,
        subject,
        title: (chapter.status === "not_started" ? "Start: " : "Study: ") + chapter.title,
        minutes: studyMinutes,
        reason: (chapter.exam_name || "Upcoming exam") + (when === 0 ? " · today" : when > 0 ? " · " + when + " day(s) away" : ""),
        exam_name: chapter.exam_name
      })) break;
    }
    return { items: plan, goalMinutes, plannedMinutes: minutes };
  }
  function renderDailyPlan() {
    const out = $("hubDailyPlan");
    out.replaceChildren();
    const { items, goalMinutes, plannedMinutes } = buildDailyPlan();
    currentDailyPlan = items;
    const summary = make("p", "hub-muted", plannedMinutes + " of " + goalMinutes + " daily goal minutes planned · " + items.length + " suggested task(s)");
    out.append(summary);
    if (!items.length) {
      const hasExamOrChapter = cache.exams.length || cache.chapters.length;
      out.append(make("p", "hub-empty", hasExamOrChapter
        ? "Your upcoming chapters are already marked mastered or no more items fit your daily goal. Add a revision date or increase your daily goal to plan more."
        : "Add an exam and chapters in the Exam command centre to get a personalized daily plan."));
      $("hubAddPlanTasks").disabled = true;
      return;
    }
    $("hubAddPlanTasks").disabled = false;
    items.forEach((item, index) => {
      const row = make("article", "hub-row");
      const top = make("div", "hub-row-top");
      const copy = make("div");
      copy.append(make("div", "hub-row-title", (index + 1) + ". " + item.title));
      copy.append(make("div", "hub-row-meta", item.subject + " · " + item.minutes + " min · " + item.reason));
      top.append(copy, make("span", "pill", item.kind === "revision" ? "Revise" : "Study"));
      row.append(top);
      out.append(row);
    });
  }

  function renderRevisions() {
    const out = $("hubRevisionQueue");
    out.replaceChildren();
    const all = cache.revisions.slice().sort((a, b) => {
      const ad = !a.next_review_on ? "0000-00-00" : a.next_review_on;
      const bd = !b.next_review_on ? "0000-00-00" : b.next_review_on;
      return ad.localeCompare(bd);
    }).slice(0, 12);
    if (!all.length) {
      out.append(make("p", "hub-empty", "No chapters yet. Add a chapter to an exam to create your first review card."));
      return;
    }
    for (const item of all) {
      const row = make("article", "hub-row");
      const top = make("div", "hub-row-top");
      const info = make("div");
      info.append(make("div", "hub-row-title", item.title));
      info.append(make("div", "hub-row-meta", item.subject + " · " + item.exam_name));
      const today = new Date().toISOString().slice(0, 10);
      const dateLabel = !item.next_review_on ? "New · review when ready" : item.next_review_on < today ? "Overdue · " + formatDate(item.next_review_on) : item.next_review_on === today ? "Due today" : "Next review · " + formatDate(item.next_review_on);
      top.append(info, make("span", "pill", dateLabel));
      row.append(top);
      const actions = make("div", "hub-row-actions");
      for (const [rating, label] of [["again","Again · 1d"],["hard","Hard"],["good","Good"],["easy","Easy"]]) {
        const button = make("button", rating === "good" ? "" : "hub-btn-secondary", label);
        button.type = "button";
        button.disabled = pendingReview;
        button.addEventListener("click", async () => {
          pendingReview = true;
          $("hubRevisionMessage").textContent = "Saving review…";
          try {
            const result = await safeApi("/api/revisions", { method: "POST", body: JSON.stringify({ chapter_id: item.chapter_id, rating }) });
            $("hubRevisionMessage").textContent = "Next review: " + formatDate(result.next_review_on) + " (" + result.interval_days + " day(s)).";
            $("hubRevisionMessage").className = "hub-error hub-success";
            await refreshData();
          } catch (error) {
            $("hubRevisionMessage").textContent = error.message;
            $("hubRevisionMessage").className = "hub-error";
          } finally {
            pendingReview = false;
          }
        });
        actions.append(button);
      }
      row.append(actions);
      out.append(row);
    }
    if (cache.revisions.length > 12) out.append(make("p", "hub-muted", "Showing 12 of " + cache.revisions.length + " chapters. Review older entries in the exam chapter list."));
  }

  function renderLibrary() {
    const out = $("hubLibraryItems");
    out.replaceChildren();
    if (!cache.library.length) {
      out.append(make("p", "hub-empty", "Your library is empty. Save a note, formula, definition, or doubt above."));
      return;
    }
    for (const item of cache.library) {
      const row = make("article", "hub-row");
      const top = make("div", "hub-row-top");
      const info = make("div");
      info.append(make("div", "hub-row-title", item.title));
      const context = [item.subject, item.textbook, item.book_part, item.chapter_title].filter(Boolean).join(" · ");
      info.append(make("div", "hub-row-meta", context || "No book/chapter specified"));
      top.append(info, make("span", "pill", String(item.item_type || "note")));
      row.append(top);
      row.append(make("p", "hub-library-content", item.content));
      const actions = make("div", "hub-row-actions");
      const edit = make("button", "hub-btn-secondary", "Edit");
      edit.type = "button";
      edit.addEventListener("click", () => {
        editingLibraryItemId = item.id;
        $("hubLibraryGrade").value = String(item.grade);
        $("hubLibrarySubject").value = item.subject;
        $("hubTextbook").value = item.textbook || "";
        $("hubBookPart").value = item.book_part || "";
        $("hubLibraryChapter").value = item.chapter_title || "";
        $("hubItemType").value = item.item_type || "note";
        $("hubLibraryTitle").value = item.title;
        $("hubLibraryContent").value = item.content;
        $("hubSaveLibrary").textContent = "Update library item";
        $("hubCancelLibraryEdit").hidden = false;
        $("hubLibraryMessage").textContent = "Editing “" + item.title + "”.";
        $("hubLibraryMessage").className = "hub-error";
        $("hubLibraryForm").scrollIntoView({ behavior: "smooth", block: "center" });
        $("hubLibraryTitle").focus({ preventScroll: true });
      });
      const remove = make("button", "hub-btn-secondary", "Delete item");
      remove.type = "button";
      remove.addEventListener("click", async () => {
        if (!window.confirm("Delete this study-library item?")) return;
        remove.disabled = true;
        try {
          await safeApi("/api/library/" + encodeURIComponent(item.id), { method: "DELETE" });
          cache.library = cache.library.filter(value => value.id !== item.id);
          renderLibrary();
        } catch (error) {
          $("hubLibraryMessage").textContent = error.message;
          remove.disabled = false;
        }
      });
      actions.append(edit, remove);
      row.append(actions);
      out.append(row);
    }
  }

  function renderMetricsSummary() {
    renderReadiness();
    renderDailyPlan();
    renderRevisions();
    renderLibrary();
  }
  async function refreshData() {
    if (appPanel.hidden) return;
    if (refreshPromise) return refreshPromise;
    const generation = accountGeneration;
    let retryForNewAccount = false;
    refreshPromise = (async () => {
      const requests = await Promise.allSettled([
        safeApi("/api/exams"), safeApi("/api/practice"), safeApi("/api/flashcards"),
        safeApi("/api/tasks"), safeApi("/api/revisions"), safeApi("/api/library"), safeApi("/api/profile")
      ]);
      if (appPanel.hidden) {
        cache = { exams: [], chapters: [], practice: [], flashcards: [], tasks: [], revisions: [], library: [], profile: null };
        return;
      }
      if (generation !== accountGeneration) {
        retryForNewAccount = true;
        return;
      }
      const keys = ["exams","practice","flashcards","tasks","revisions","library","profile"];
      const errors = [];
      requests.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const value = result.value;
          if (keys[index] === "exams") { cache.exams = value.exams || []; cache.chapters = value.chapters || []; }
          if (keys[index] === "practice") cache.practice = value.practice || [];
          if (keys[index] === "flashcards") cache.flashcards = value.flashcards || [];
          if (keys[index] === "tasks") cache.tasks = value.tasks || [];
          if (keys[index] === "revisions") cache.revisions = value.reviews || [];
          if (keys[index] === "library") cache.library = value.items || [];
          if (keys[index] === "profile") cache.profile = value.profile || null;
        } else {
          errors.push(keys[index] + ": " + (result.reason?.message || "Could not load data."));
        }
      });
      if (cache.profile && Number(cache.profile.grade) >= 6 && Number(cache.profile.grade) <= 10) {
        $("hubGrade").value = String(cache.profile.grade);
        $("hubLibraryGrade").value = String(cache.profile.grade);
      }
      renderMetricsSummary();
      $("hubReadinessMessage").textContent = errors.filter(e => e.startsWith("exams:")).join(" ");
      const revisionError = errors.find(e => e.startsWith("revisions:"));
      $("hubRevisionMessage").textContent = revisionError || "";
      const libraryError = errors.find(e => e.startsWith("library:"));
      $("hubLibraryMessage").textContent = libraryError || "";
    })();
    try { return await refreshPromise; }
    finally {
      refreshPromise = null;
      if (retryForNewAccount && !appPanel.hidden) refreshData().catch(() => {});
    }
  }
  $("hubPracticeForm").addEventListener("submit", async event => {
    event.preventDefault();
    const button = $("hubGeneratePractice");
    button.disabled = true;
    $("hubPracticeMessage").textContent = "Generating original questions…";
    $("hubPracticeMessage").className = "hub-error";
    $("hubGeneratedPractice").hidden = true;
    try {
      const data = await safeApi("/api/practice/generate", { method: "POST", body: JSON.stringify({
        grade: Number($("hubGrade").value), subject: $("hubSubject").value,
        chapter: $("hubChapter").value.trim(), type: $("hubQuestionType").value,
        count: Number($("hubQuestionCount").value), context: $("hubContext").value.trim()
      })});
      $("hubGeneratedPractice").textContent = data.practice;
      $("hubGeneratedPractice").hidden = false;
      lastPractice = { grade: Number($("hubGrade").value), subject: $("hubSubject").value, chapter: $("hubChapter").value.trim(), type: $("hubQuestionType").value, count: Number($("hubQuestionCount").value) };
      $("hubResultQuestions").max = String(lastPractice.count);
      $("hubResultQuestions").value = String(lastPractice.count);
      $("hubResultCorrect").max = String(lastPractice.count);
      $("hubResultCorrect").value = "";
      $("hubResultNotes").value = "";
      $("hubResultMessage").textContent = "";
      $("hubResultMessage").className = "hub-error";
      $("hubPracticeResultForm").hidden = false;
      $("hubPracticeMessage").textContent = data.source_grounded ? "Generated using the lesson excerpt you supplied." : "General practice generated without textbook context; check it against your syllabus.";
      $("hubPracticeMessage").className = "hub-error" + (data.source_grounded ? " hub-success" : "");
    } catch (error) {
      $("hubPracticeMessage").textContent = error.message;
    } finally { button.disabled = false; }
  });

  $("hubPracticeResultForm").addEventListener("submit", async event => {
    event.preventDefault();
    const button = $("hubRecordPractice");
    const attempted = Number($("hubResultQuestions").value);
    const correct = Number($("hubResultCorrect").value);
    if (!lastPractice) {
      $("hubResultMessage").textContent = "Generate a practice set first.";
      return;
    }
    if (!Number.isInteger(attempted) || attempted < 1 || attempted > lastPractice.count ||
        !Number.isInteger(correct) || correct < 0 || correct > attempted) {
      $("hubResultMessage").textContent = "Enter 1–" + lastPractice.count + " attempted questions and a correct count no greater than attempted.";
      return;
    }
    button.disabled = true;
    $("hubResultMessage").textContent = "Saving your result…";
    try {
      const notes = ["AI-generated practice", "Class " + lastPractice.grade, "Type: " + lastPractice.type, $("hubResultNotes").value.trim()].filter(Boolean).join(" · ");
      await safeApi("/api/practice", {
        method: "POST",
        body: JSON.stringify({ subject: lastPractice.subject, topic: lastPractice.chapter, questions: attempted, correct, notes })
      });
      $("hubResultMessage").textContent = "Result saved. Readiness data refreshed.";
      $("hubResultMessage").className = "hub-error hub-success";
      await refreshData();
    } catch (error) {
      $("hubResultMessage").textContent = error.message;
      $("hubResultMessage").className = "hub-error";
    } finally { button.disabled = false; }
  });

  function resetLibraryEditor() {
    editingLibraryItemId = null;
    $("hubLibraryForm").reset();
    $("hubSaveLibrary").textContent = "Save to library";
    $("hubCancelLibraryEdit").hidden = true;
  }
  $("hubCancelLibraryEdit").addEventListener("click", () => {
    resetLibraryEditor();
    $("hubLibraryMessage").textContent = "Edit cancelled.";
    $("hubLibraryMessage").className = "hub-error";
  });
  $("hubLibraryForm").addEventListener("submit", async event => {
    event.preventDefault();
    const button = $("hubSaveLibrary");
    button.disabled = true;
    $("hubLibraryMessage").textContent = editingLibraryItemId ? "Updating…" : "Saving…";
    $("hubLibraryMessage").className = "hub-error";
    const payload = {
      grade: Number($("hubLibraryGrade").value), subject: $("hubLibrarySubject").value,
      textbook: $("hubTextbook").value.trim(), book_part: $("hubBookPart").value.trim(),
      chapter_title: $("hubLibraryChapter").value.trim(), item_type: $("hubItemType").value,
      title: $("hubLibraryTitle").value.trim(), content: $("hubLibraryContent").value.trim()
    };
    const targetId = editingLibraryItemId;
    try {
      await safeApi(targetId ? "/api/library/" + encodeURIComponent(targetId) : "/api/library", {
        method: targetId ? "PUT" : "POST", body: JSON.stringify(payload)
      });
      resetLibraryEditor();
      $("hubLibraryMessage").textContent = targetId ? "Library item updated." : "Saved to your personal study library.";
      $("hubLibraryMessage").className = "hub-error hub-success";
      const data = await safeApi("/api/library");
      cache.library = data.items || [];
      renderLibrary();
    } catch (error) {
      $("hubLibraryMessage").textContent = error.message;
      $("hubLibraryMessage").className = "hub-error";
    } finally { button.disabled = false; }
  });

  $("hubRefreshPlan").addEventListener("click", async () => {
    $("hubDailyPlanMessage").textContent = "Refreshing…";
    try {
      await refreshData();
      $("hubDailyPlanMessage").textContent = "Plan refreshed from your latest exams and revision queue.";
      $("hubDailyPlanMessage").className = "hub-error hub-success";
    } catch (error) {
      $("hubDailyPlanMessage").textContent = error.message || "Could not refresh your plan.";
      $("hubDailyPlanMessage").className = "hub-error";
    }
  });
  $("hubAddPlanTasks").addEventListener("click", async () => {
    const button = $("hubAddPlanTasks");
    if (!currentDailyPlan.length) return;
    button.disabled = true;
    $("hubDailyPlanMessage").textContent = "Adding suggested tasks…";
    $("hubDailyPlanMessage").className = "hub-error";
    try {
      const normalizeTaskTitle = title => String(title || "").trim().toLowerCase().replace(/\\s+\\(\\d+ min\\)$/, "");
      const existing = new Set(cache.tasks.filter(task => !(task.done === true || Number(task.completed) === 1))
        .map(task => String(task.subject || "").toLowerCase() + "|" + normalizeTaskTitle(task.title)));
      let added = 0;
      let skipped = 0;
      for (const item of currentDailyPlan) {
        const key = item.subject.toLowerCase() + "|" + normalizeTaskTitle(item.title);
        if (existing.has(key)) { skipped++; continue; }
        await safeApi("/api/tasks", { method: "POST", body: JSON.stringify({ title: item.title + " (" + item.minutes + " min)", subject: item.subject }) });
        existing.add(key);
        added++;
      }
      await safeApi("/api/tasks").then(data => { cache.tasks = data.tasks || []; });
      $("hubDailyPlanMessage").textContent = added + " task(s) added" + (skipped ? "; " + skipped + " existing task(s) skipped." : ".");
      $("hubDailyPlanMessage").className = "hub-error hub-success";
      window.dispatchEvent(new Event("studysense:data-changed"));
      renderDailyPlan();
    } catch (error) {
      $("hubDailyPlanMessage").textContent = error.message || "Could not add all suggested tasks. Check your task list for successful additions before retrying.";
      $("hubDailyPlanMessage").className = "hub-error";
    } finally { button.disabled = false; }
  });

  function csvEscape(value) {
    return '"' + String(value == null ? "" : value).replace(/"/g, '""') + '"';
  }
  $("hubDownloadSummary").addEventListener("click", async () => {
    const button = $("hubDownloadSummary");
    button.disabled = true;
    try {
      if (!cache.exams.length && !cache.tasks.length && !cache.practice.length) await refreshData();
      const today = new Date().toLocaleDateString();
      const mastered = cache.chapters.filter(c => c.status === "mastered").length;
      const taskDone = cache.tasks.filter(t => t.done || Number(t.completed) === 1).length;
      const questions = cache.practice.reduce((sum, p) => sum + (Number(p.questions) || 0), 0);
      const correct = cache.practice.reduce((sum, p) => sum + (Number(p.correct) || 0), 0);
      const rows = [
        ["StudySense student progress summary"], ["Generated", today],
        ["Class", cache.profile ? cache.profile.grade : ""],
        ["Exams", cache.exams.length], ["Chapters tracked", cache.chapters.length],
        ["Chapters mastered", mastered], ["Tasks completed", taskDone + "/" + cache.tasks.length],
        ["Practice questions logged", questions], ["Practice accuracy", questions ? Math.round(correct / questions * 100) + "%" : "No practice logged"],
        [], ["Exam", "Date", "Chapters", "Chapter readiness"],
        ...cache.exams.map(exam => {
          const own = cache.chapters.filter(c => c.exam_id === exam.id);
          const values = { not_started: 0, learning: 35, revising: 70, mastered: 100 };
          const score = own.length ? Math.round(own.reduce((n,c)=>n+(values[c.status]||0),0)/own.length) + "%" : "No chapter data";
          return [exam.name, exam.exam_date, own.length, score];
        }),
        [], ["This report is a voluntary local export. It is not sent to a parent or teacher automatically."]
      ];
      const csv = rows.map(row => row.map(csvEscape).join(",")).join("\r\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "studysense-progress-" + new Date().toISOString().slice(0,10) + ".csv";
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      $("hubReadinessMessage").textContent = "Progress summary downloaded. Share it only with someone you trust.";
      $("hubReadinessMessage").className = "hub-error hub-success";
    } catch (error) {
      $("hubReadinessMessage").textContent = error.message || "Could not create the summary.";
    } finally { button.disabled = false; }
  });

  function clearPrivateCache() {
    accountGeneration++;
    cache = { exams: [], chapters: [], practice: [], flashcards: [], tasks: [], revisions: [], library: [], profile: null };
    renderMetricsSummary();
  }
  const observer = new MutationObserver(() => {
    if (appPanel.hidden) {
      clearPrivateCache();
      return;
    }
    refreshData().catch(error => {
      $("hubReadinessMessage").textContent = error.message || "Could not load study tools.";
    });
  });
  window.addEventListener("studysense:data-changed", () => {
    if (!appPanel.hidden) refreshData().catch(() => {});
  });
  observer.observe(appPanel, { attributes: true, attributeFilter: ["hidden"] });
  if (!appPanel.hidden) refreshData().catch(() => {});
})();