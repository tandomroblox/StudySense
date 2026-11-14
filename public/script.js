const curriculumGrade = document.querySelector("#curriculumGrade");
const curriculumDetails = document.querySelector("#curriculumDetails");
const curriculumSources = {
  "6": {
    title: "Class 6 · 2026–27",
    note: "Use the new NCERT middle-stage textbooks. Language books can vary by the school's R1/R2/R3 choices.",
    links: [
      ["NCERT 2026–27 textbook catalogue", "https://ncert.nic.in/list-publication.php?ln=en"],
      ["NCERT e-textbooks (Classes 1–12)", "https://ncert.nic.in/textbook.php"],
      ["NCERT Grade 6 bridge programme", "https://www.ncert.nic.in/bridge_programme.php?ln=en"]
    ]
  },
  "7": {
    title: "Class 7 · 2026–27",
    note: "NCERT's 2026–27 rollout introduces new Science textbooks for Classes 7 and 8; other titles follow the published NCERT rollout/catalogue.",
    links: [
      ["NCERT 2026–27 textbook catalogue", "https://ncert.nic.in/list-publication.php?ln=en"],
      ["NCERT e-textbooks (Classes 1–12)", "https://ncert.nic.in/textbook.php"],
      ["NCERT textbook portal", "https://ncertbooks.ncert.gov.in/"]
    ]
  },
  "8": {
    title: "Class 8 · 2026–27",
    note: "Use the new NCERT Science textbook for 2026–27. For Social Science and other subjects, check the latest catalogue and school booklist; NCERT has issued a correction/recall notice for the Grade 8 Social Science Part 2 book.",
    links: [
      ["NCERT 2026–27 textbook catalogue", "https://ncert.nic.in/list-publication.php?ln=en"],
      ["NCERT e-textbooks (Classes 1–12)", "https://ncert.nic.in/textbook.php"],
      ["NCERT Class 8 Social Science Part 2 notice", "https://www.ncert.nic.in/pdf/announcement/notices/ncert_pressrelease_class8_sstp2.pdf"]
    ]
  },
  "9": {
    title: "Class 9 · 2026–27",
    note: "The 2026–27 Grade 9 catalogue follows NCF-SE 2023. The official syllabus documents are organised into Languages (Part 1), Science/Mathematics/Social Science (Part 2), and vocational/arts/physical education/Individuals in Society (Part 3). Confirm your school’s prescribed subjects and language options.",
    links: [
      ["NCERT Grade 9 syllabus · Languages (Part 1)", "https://www.ncert.nic.in/pdf/announcement/Syllabus_Secondary_Stage_Phase_I_Grade_9_Part_1_Languages.pdf"],
      ["NCERT Grade 9 syllabus · Science, Mathematics & Social Science (Part 2)", "https://www.ncert.nic.in/pdf/announcement/Syllabus_Secondary_Stage_Phase_I_Grade_9_Part_2.pdf"],
      ["NCERT Grade 9 syllabus · Part 3", "https://www.ncert.nic.in/pdf/announcement/Syllabus_Secondary_Stage_Phase_I_Part%203_Grade_9-DRAFT.pdf"],
      ["NCERT textbook portal", "https://ncertbooks.ncert.gov.in/"],
      ["CBSE 2026–27 curriculum (Classes IX–X)", "https://cbseacademic.nic.in/curriculum_2027.html"]
    ]
  },
  "10": {
    title: "Class 10 · 2026–27",
    note: "Use the prescribed Class 10 textbook and the current CBSE Class X curriculum for the 2026–27 academic year. Confirm the subject syllabus and exam requirements with your school.",
    links: [
      ["NCERT e-textbooks (Classes 1–12)", "https://ncert.nic.in/textbook.php"],
      ["CBSE 2026–27 curriculum · Class X", "https://cbseacademic.nic.in/curriculum_2027.html"],
      ["NCERT textbook portal", "https://ncertbooks.ncert.gov.in/"]
    ]
  }
};
function renderCurriculumLibrary() {
  if (!curriculumGrade || !curriculumDetails) return;
  const item = curriculumSources[curriculumGrade.value] || curriculumSources["6"];
  curriculumDetails.replaceChildren();
  const heading = document.createElement("h3");
  heading.textContent = item.title;
  const note = document.createElement("p");
  note.className = "muted";
  note.textContent = item.note;
  const list = document.createElement("div");
  list.className = "curriculum-links";
  item.links.forEach(([label, url]) => {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "curriculum-link";
    link.textContent = label;
    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "↗";
    link.append(icon);
    list.append(link);
  });
  curriculumDetails.append(heading, note, list);
}
if (curriculumGrade) {
  curriculumGrade.addEventListener("change", renderCurriculumLibrary);
  renderCurriculumLibrary();
}

const publicLanding = document.querySelector("#publicLanding");
const isAuthPage = window.location.pathname === "/login.html";
const landingSignIn = document.querySelector("#landingSignIn");
const authLoadingPanel = document.querySelector("#authLoadingPanel");
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
const taskFilter = document.querySelector("#taskFilter");
const visibleTaskCount = document.querySelector("#visibleTaskCount");
let taskFilterMode = "all";

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

function clearSessionHint() {
  try { localStorage.removeItem("studysense-session-hint"); } catch (_) {}
  try { sessionStorage.removeItem("studysense-session-user"); } catch (_) {}
}
function readSessionHintUser() {
  try {
    if (localStorage.getItem("studysense-session-hint") !== "1") return null;
    const saved = JSON.parse(sessionStorage.getItem("studysense-session-user") || "null");
    return saved && typeof saved.email === "string" ? saved : { email: "" };
  } catch (_) {
    return null;
  }
}
function openAuth(mode = "login") {
  if (!isAuthPage) {
    window.location.assign("/login.html?mode=" + encodeURIComponent(mode));
    return;
  }
  authPanel.hidden = false;
  appPanel.hidden = true;
  setAuthMode(mode);
}
if (isAuthPage) {
  document.body.classList.add("auth-page");
  if (publicLanding) publicLanding.hidden = true;
  authPanel.hidden = false;
  appPanel.hidden = true;
  const requestedMode = new URLSearchParams(location.search).get("mode");
  setAuthMode(requestedMode === "register" ? "register" : "login");
}

function showSignedOut(message = "") {
  clearSessionHint();
  if (!isAuthPage) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    window.location.replace("/login.html?mode=login&return=" + returnTo);
    return;
  }
  authLoadingPanel.hidden = true;
  document.body.classList.remove("is-signed-in");
  authPanel.hidden = false;
  appPanel.hidden = true;
  connectGoogleButton.hidden = true;
  if (message) authMessage.textContent = message;
  tasks = [];
}
function showSignedIn(user) {
  if (isAuthPage) {
    window.location.replace("/dashboard.html");
    return;
  }
  authLoadingPanel.hidden = true;
  document.body.classList.add("is-signed-in");
  authPanel.hidden = true;
  appPanel.hidden = false;
  connectGoogleButton.hidden = false;
  signedInAs.textContent = user && user.email ? `Signed in as ${user.email}` : "Restoring your session…";
  try {
    localStorage.setItem("studysense-session-hint", "1");
    if (user && typeof user.email === "string" && user.email) {
      sessionStorage.setItem("studysense-session-user", JSON.stringify({ email: user.email }));
    }
  } catch (_) {}
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
    await Promise.all([loadTasks(), loadExams(), loadLearningTools(), loadProfile(), loadTutorChats()]);
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
    window.location.replace("/login.html?mode=login");
  } catch (error) {
    taskMessage.textContent = error.message;
  } finally {
    logoutButton.disabled = false;
  }
});

taskFilter.addEventListener("change", () => { taskFilterMode = taskFilter.value; renderTasks(); });

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
  const visibleTasks = tasks.filter(task => taskFilterMode === "all" || (taskFilterMode === "active" && !task.done) || (taskFilterMode === "completed" && task.done));
  visibleTaskCount.textContent = `${visibleTasks.length} shown`;
  if (tasks.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No tasks yet. Add your first study task above!";
    taskList.append(empty);
  }

  if (tasks.length > 0 && visibleTasks.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = taskFilterMode === "completed" ? "No completed tasks yet." : "Everything is complete. Nice work!";
    taskList.append(empty);
  }

  for (const task of visibleTasks) {
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
    window.dispatchEvent(new Event("studysense:data-changed"));
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


const examForm=document.querySelector("#examForm"), examName=document.querySelector("#examName"), customExamName=document.querySelector("#customExamName"), examSubject=document.querySelector("#examSubject"), examDate=document.querySelector("#examDate"), examList=document.querySelector("#examList"), examMessage=document.querySelector("#examMessage");
const chapterForm=document.querySelector("#chapterForm"), chapterExam=document.querySelector("#chapterExam"), chapterName=document.querySelector("#chapterName"), chapterList=document.querySelector("#chapterList"), chapterMessage=document.querySelector("#chapterMessage"), studyPlan=document.querySelector("#studyPlan");
const syllabusClass=document.querySelector("#syllabusClass"), syllabusSubject=document.querySelector("#syllabusSubject"), chapterSubject=syllabusSubject, syllabusBookNote=document.querySelector("#syllabusBookNote"), importSyllabusButton=document.querySelector("#importSyllabusButton"), syllabusImportMessage=document.querySelector("#syllabusImportMessage");
function renderSyllabusOptions(){
 const grade=syllabusClass.value, entries=window.STUDYSENSE_SYLLABUS?.[grade]||{};
 const previous=syllabusSubject.value;
 syllabusSubject.replaceChildren();
 Object.keys(entries).forEach(subject=>syllabusSubject.append(new Option(subject,subject)));
 if(entries[previous]) syllabusSubject.value=previous;
 renderSyllabusBookNote();
}
function renderSyllabusBookNote(){
 const entry=window.STUDYSENSE_SYLLABUS?.[syllabusClass.value]?.[syllabusSubject.value];
 chapterName.replaceChildren();
 chapterName.append(new Option(entry?.chapters?.length?"Choose a chapter":"No verified chapters available",""));
 if(!entry){
  syllabusBookNote.textContent="This subject's chapter list has not been verified for this edition. No chapters will be guessed or imported.";
  importSyllabusButton.disabled=true;chapterName.disabled=true;return;
 }
 syllabusBookNote.textContent=entry.book+" · "+(entry.chapters.length?entry.chapters.length+" chapters available":"Chapter list pending verification — no chapters will be guessed.")+(entry.sourceNote?"\n"+entry.sourceNote:"");
 entry.chapters.forEach(title=>chapterName.append(new Option(title,title)));
 importSyllabusButton.disabled=!entry.chapters.length;
 chapterName.disabled=!entry.chapters.length;
}
syllabusClass.addEventListener("change",renderSyllabusOptions);
syllabusSubject.addEventListener("change",renderSyllabusBookNote);
importSyllabusButton.addEventListener("click",async()=>{
 const grade=syllabusClass.value,subject=syllabusSubject.value,entry=window.STUDYSENSE_SYLLABUS?.[grade]?.[subject];
 if(!chapterExam.value){syllabusImportMessage.textContent="Add an exam first, then select it in the Exam field.";return}
 if(!entry?.chapters?.length){syllabusImportMessage.textContent="No verified chapter list is available for this subject yet.";return}
 importSyllabusButton.disabled=true;
 try{
  const existing=new Set(chapters.filter(c=>c.exam_id===chapterExam.value&&c.subject===subject).map(c=>c.title.trim().toLocaleLowerCase()));
  const pending=entry.chapters.filter(title=>!existing.has(title.trim().toLocaleLowerCase()));
  for(const title of pending){
   await api("/api/chapters",{method:"POST",body:JSON.stringify({exam_id:chapterExam.value,subject,title})});
  }
  await loadExams();
  syllabusImportMessage.textContent=pending.length?("Added "+pending.length+" chapters from "+entry.book+". Existing chapters were skipped."):"All chapters from this list are already in the selected exam.";
 }catch(e){syllabusImportMessage.textContent="Import stopped: "+e.message+" You can click again; already-added chapters will be skipped."}
 finally{renderSyllabusBookNote()}
});
renderSyllabusOptions();
let exams=[], chapters=[];
const statuses=[["not_started","Not started"],["learning","Learning"],["revising","Revising"],["mastered","Mastered"]];
examDate.min=new Date().toISOString().slice(0,10);
function makeNode(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el}
function examReadiness(id){const list=chapters.filter(c=>c.exam_id===id);return list.length?Math.round(list.reduce((n,c)=>n+({not_started:0,learning:35,revising:70,mastered:100}[c.status]),0)/list.length):0}
function renderExams(){
 const today=new Date();today.setHours(0,0,0,0);const upcoming=exams.filter(e=>new Date(e.exam_date+"T00:00:00")>=today);
 document.querySelector("#upcomingExams").textContent=upcoming.length;
 document.querySelector("#syllabusCoverage").textContent=(chapters.length?Math.round(chapters.filter(c=>c.status==="mastered").length/chapters.length*100):0)+"%";
 document.querySelector("#readinessScore").textContent=(upcoming.length?Math.round(upcoming.reduce((n,e)=>n+examReadiness(e.id),0)/upcoming.length):0)+"%";
 document.querySelector("#examCount").textContent=exams.length+" exams";
 chapterExam.replaceChildren();if(!exams.length)chapterExam.append(new Option("Add an exam first",""));else exams.forEach(e=>chapterExam.append(new Option(e.name,e.id)));
 examList.replaceChildren();if(!exams.length)examList.append(makeNode("p","empty","No exams yet. Add your next exam above."));
 exams.forEach(e=>{const card=makeNode("article","exam-card"),top=makeNode("div","exam-card-top"),info=makeNode("div"),title=makeNode("div","exam-title",e.name+" · "+(e.subject||"Subject not set")),date=new Date(e.exam_date+"T00:00:00"),days=Math.ceil((date-today)/86400000),meta=makeNode("div","exam-meta",(days<0?"Date passed":days===0?"Today":days+" days remaining")+" · Readiness "+examReadiness(e.id)+"%"),del=makeNode("button","small-delete","Delete"),bar=makeNode("div","exam-progress"),fill=makeNode("span");del.onclick=async()=>{if(!confirm("Delete this exam and its chapters?"))return;try{await api("/api/exams/"+e.id,{method:"DELETE"});await loadExams()}catch(err){examMessage.textContent=err.message}};fill.style.width=examReadiness(e.id)+"%";bar.append(fill);info.append(title,meta);top.append(info,del);card.append(top,bar);examList.append(card)});
 chapterList.replaceChildren();if(!chapters.length)chapterList.append(makeNode("p","empty","Add chapters to track your syllabus."));
 chapters.forEach(c=>{const row=makeNode("div","chapter-row"),main=makeNode("div","chapter-main"),title=makeNode("div","exam-title",c.title),meta=makeNode("div","chapter-meta",c.subject+" · "+(exams.find(e=>e.id===c.exam_id)?.name||"Exam")),controls=makeNode("div","chapter-controls"),select=document.createElement("select"),del=makeNode("button","small-delete","×");statuses.forEach(s=>select.append(new Option(s[1],s[0])));select.value=c.status;select.onchange=async()=>{try{await api("/api/chapters/"+c.id,{method:"PATCH",body:JSON.stringify({status:select.value})});await loadExams()}catch(err){chapterMessage.textContent=err.message;select.value=c.status}};del.onclick=async()=>{try{await api("/api/chapters/"+c.id,{method:"DELETE"});await loadExams()}catch(err){chapterMessage.textContent=err.message}};main.append(title,meta);controls.append(select,del);row.append(main,controls);chapterList.append(row)});
 studyPlan.replaceChildren();const pending=chapters.filter(c=>c.status!=="mastered").map(c=>({...c,exam:exams.find(e=>e.id===c.exam_id)})).filter(c=>c.exam&&new Date(c.exam.exam_date+"T00:00:00")>=today).sort((a,b)=>a.exam.exam_date.localeCompare(b.exam.exam_date)).slice(0,7);
 if(!pending.length){studyPlan.append(makeNode("p","empty",exams.length?"No unfinished chapters for upcoming exams.":"Add exams and chapters to generate a plan."));return}
 pending.forEach((c,i)=>{const row=makeNode("div","plan-row"),day=makeNode("div","plan-day",i===0?"TODAY":new Date(today.getTime()+i*86400000).toLocaleDateString(undefined,{weekday:"short"}).toUpperCase()),copy=makeNode("div","plan-copy"),title=makeNode("div","exam-title",c.title),meta=makeNode("p","",c.subject+" · "+c.exam.name+" · "+statuses.find(s=>s[0]===c.status)[1]);copy.append(title,meta);row.append(day,copy);studyPlan.append(row)});
 studyPlan.append(makeNode("p","readiness-note","Readiness is an estimate based on chapter status, not a prediction of exam marks. Suggested chapters are ordered by upcoming exam date."));
}
async function loadExams(){const data=await api("/api/exams");exams=data.exams;chapters=data.chapters;renderExams();window.dispatchEvent(new Event("studysense:data-changed"))}
examName.addEventListener("change",()=>{const custom=examName.value==="__custom__";customExamName.hidden=!custom;customExamName.required=custom;if(!custom)customExamName.value=""});
examForm.addEventListener("submit",async ev=>{ev.preventDefault();const b=examForm.querySelector('button[type="submit"]');const name=examName.value==="__custom__"?customExamName.value.trim():examName.value;if(!name){examMessage.textContent="Choose an exam type or enter a custom name.";return}b.disabled=true;examMessage.textContent="";try{await api("/api/exams",{method:"POST",body:JSON.stringify({name,subject:examSubject.value,exam_date:examDate.value})});examName.value="";customExamName.value="";examSubject.value="";customExamName.hidden=true;customExamName.required=false;await loadExams()}catch(e){examMessage.textContent=e.message}finally{b.disabled=false}});
chapterForm.addEventListener("submit",async ev=>{ev.preventDefault();const b=chapterForm.querySelector('button[type="submit"]');b.disabled=true;try{await api("/api/chapters",{method:"POST",body:JSON.stringify({exam_id:chapterExam.value,subject:chapterSubject.value,title:chapterName.value.trim()})});chapterName.value="";await loadExams()}catch(e){chapterMessage.textContent=e.message}finally{b.disabled=false}});


const profileForm=document.querySelector("#profileForm"),profileName=document.querySelector("#profileName"),profileGrade=document.querySelector("#profileGrade"),profileSchool=document.querySelector("#profileSchool"),profileGoal=document.querySelector("#profileGoal"),profileMessage=document.querySelector("#profileMessage");
const tutorForm=document.querySelector("#tutorForm"),tutorInput=document.querySelector("#tutorInput"),tutorSubmit=document.querySelector("#tutorSubmit"),tutorMessage=document.querySelector("#tutorMessage"),tutorTranscript=document.querySelector("#tutorTranscript"),tutorGradeLabel=document.querySelector("#tutorGradeLabel"),tutorVoiceInput=document.querySelector("#tutorVoiceInput"),tutorSpeak=document.querySelector("#tutorSpeak");
let tutorSending=false;
let tutorConversation=[];
let tutorChatId=null;
let tutorChats=[];
const tutorHistoryList=document.querySelector("#tutorHistoryList");
const tutorHistoryStatus=document.querySelector("#tutorHistoryStatus");
const tutorNewChat=document.querySelector("#tutorNewChat");
function makeTutorTitle(prompt){
  const cleaned=String(prompt||"").replace(/\s+/g," ").replace(/^(please\s+)?(can you|could you|would you|explain|help me|tell me|what is|what are)\s+/i,"").trim();
  const words=cleaned.split(" ").filter(Boolean);
  let title=words.slice(0,7).join(" ");
  if(title.length>48)title=title.slice(0,45).trimEnd()+"…";
  return title||"New conversation";
}
function renderTutorHistory(){
  if(!tutorHistoryList)return;
  tutorHistoryList.replaceChildren();
  if(!tutorChats.length){const empty=document.createElement("p");empty.className="empty";empty.textContent="Your conversations will appear here.";tutorHistoryList.append(empty);return;}
  for(const chat of tutorChats){
    const row=document.createElement("div");row.className="tutor-history-item"+(chat.id===tutorChatId?" active":"");
    const open=document.createElement("button");open.type="button";open.className="tutor-history-open";open.textContent=chat.title;open.title=chat.title;open.addEventListener("click",()=>openTutorChat(chat.id));
    const rename=document.createElement("button");rename.type="button";rename.className="tutor-history-action";rename.textContent="✎";rename.title="Rename chat";rename.setAttribute("aria-label","Rename "+chat.title);rename.addEventListener("click",()=>renameTutorChat(chat));
    const remove=document.createElement("button");remove.type="button";remove.className="tutor-history-action";remove.textContent="×";remove.title="Delete chat";remove.setAttribute("aria-label","Delete "+chat.title);remove.addEventListener("click",()=>deleteTutorChat(chat));
    row.append(open,rename,remove);tutorHistoryList.append(row);
  }
}
async function loadTutorChats(){
  if(!tutorHistoryList)return;
  try{const data=await api("/api/chats");tutorChats=Array.isArray(data.chats)?data.chats:[];renderTutorHistory();}
  catch(error){tutorHistoryStatus.textContent=error.message;}
}
function showTutorWelcome(){
  tutorTranscript.replaceChildren();
  const article=document.createElement("article");article.className="tutor-message assistant";
  const speaker=document.createElement("span");speaker.className="tutor-speaker";speaker.textContent="StudySense";
  const p=document.createElement("p");p.textContent="Hey! What are you studying today? Ask a doubt, paste a problem, or ask me to quiz you one question at a time.";
  article.append(speaker,p);tutorTranscript.append(article);
}
function startTutorChat(){
  tutorChatId=null;tutorConversation=[];showTutorWelcome();renderTutorHistory();tutorMessage.textContent="New chat";
  tutorInput.value="";resizeTutorInput();tutorInput.focus();
}
async function openTutorChat(id){
  if(tutorSending)return;
  tutorHistoryStatus.textContent="Loading…";
  try{
    const data=await api("/api/chats/"+encodeURIComponent(id));
    const chat=data.chat;if(!chat)throw new Error("Chat not found.");
    tutorChatId=chat.id;tutorConversation=Array.isArray(chat.messages)?chat.messages:[];
    tutorTranscript.replaceChildren();
    for(const message of tutorConversation)appendTutorMessage(message.role,message.content);
    renderTutorHistory();tutorHistoryStatus.textContent="";
    tutorMessage.textContent="Conversation restored.";
  }catch(error){tutorHistoryStatus.textContent=error.message;}
}
async function persistTutorChat(firstPrompt){
  if(tutorConversation.length<2)return;
  const title=tutorChatId?(tutorChats.find(c=>c.id===tutorChatId)?.title||makeTutorTitle(firstPrompt)):makeTutorTitle(firstPrompt);
  const data=await api("/api/chats",{method:"POST",body:JSON.stringify({id:tutorChatId||undefined,title,messages:tutorConversation})});
  tutorChatId=data.id;
  const existing=tutorChats.find(c=>c.id===data.id);
  const item={id:data.id,title:data.title,updated_at:new Date().toISOString()};
  tutorChats=[item,...tutorChats.filter(c=>c.id!==data.id)];
  renderTutorHistory();
}
async function renameTutorChat(chat){
  const title=window.prompt("Rename this conversation:",chat.title);
  if(title===null||!title.trim())return;
  try{await api("/api/chats/"+encodeURIComponent(chat.id),{method:"PATCH",body:JSON.stringify({title:title.trim()})});chat.title=title.trim();renderTutorHistory();}
  catch(error){tutorHistoryStatus.textContent=error.message;}
}
async function deleteTutorChat(chat){
  if(!window.confirm("Delete '"+chat.title+"'? This cannot be undone."))return;
  try{await api("/api/chats/"+encodeURIComponent(chat.id),{method:"DELETE"});tutorChats=tutorChats.filter(c=>c.id!==chat.id);if(tutorChatId===chat.id)startTutorChat();else renderTutorHistory();}
  catch(error){tutorHistoryStatus.textContent=error.message;}
}
if(tutorNewChat)tutorNewChat.addEventListener("click",startTutorChat);

function appendTutorMath(parent, expression, display = false) {
  const wrapper = document.createElement(display ? "div" : "span");
  wrapper.className = display ? "tutor-math tutor-math-display" : "tutor-math tutor-math-inline";
  if (display) wrapper.setAttribute("role", "math");
  else wrapper.setAttribute("aria-label", expression);
  const source = String(expression || "")
    .replace(/\\left|\\right/g, "")
    .replace(/\\times/g, "×").replace(/\\cdot/g, "·")
    .replace(/\\div/g, "÷").replace(/\\pm/g, "±")
    .replace(/\\leq?/g, "≤").replace(/\\geq?/g, "≥")
    .replace(/\\neq/g, "≠").replace(/\\pi/g, "π")
    .replace(/\\theta/g, "θ").replace(/\\sqrt\{([^{}]+)\}/g, "√($1)")
    .replace(/\\,/g, " ").replace(/\\;/g, " ");
  const token = /(\^\{([^{}]+)\}|\^([A-Za-z0-9+\-=])|_\{([^{}]+)\}|_([A-Za-z0-9]+))/g;
  let cursor = 0, match;
  while ((match = token.exec(source))) {
    if (match.index > cursor) wrapper.append(document.createTextNode(source.slice(cursor, match.index)));
    const node = document.createElement(match[1].startsWith("^") ? "sup" : "sub");
    node.textContent = match[2] ?? match[3] ?? match[4] ?? match[5] ?? "";
    wrapper.append(node);
    cursor = token.lastIndex;
  }
  if (cursor < source.length) wrapper.append(document.createTextNode(source.slice(cursor)));
  if (display) {
    wrapper.style.display = "block";
    wrapper.style.textAlign = "center";
    wrapper.style.margin = "0.65rem 0";
    wrapper.style.padding = "0.65rem 0.9rem";
    wrapper.style.borderRadius = "0.65rem";
    wrapper.style.background = "rgba(148, 163, 184, 0.10)";
    wrapper.style.fontSize = "1.12em";
    wrapper.style.fontWeight = "600";
    wrapper.style.overflowX = "auto";
  } else {
    wrapper.style.fontFamily = "Cambria Math, STIX Two Math, serif";
    wrapper.style.fontStyle = "italic";
    wrapper.style.whiteSpace = "nowrap";
  }
  parent.append(wrapper);
}
function appendTutorInline(parent, text) {
  const pattern=/\$\$([\s\S]+?)\$\$|\$([^$\n]+)\$|\*\*([^*]+)\*\*|\*([^*]+)\*|\x60([^\x60]+)\x60|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let cursor=0, match;
  while((match=pattern.exec(text))) {
    if(match.index>cursor) parent.append(document.createTextNode(text.slice(cursor,match.index)));
    if(match[1]!==undefined) appendTutorMath(parent,match[1],true);
    else if(match[2]!==undefined) appendTutorMath(parent,match[2],false);
    else {
      let node;
      if(match[3]!==undefined){node=document.createElement("strong");node.textContent=match[3];}
      else if(match[4]!==undefined){node=document.createElement("em");node.textContent=match[4];}
      else if(match[5]!==undefined){node=document.createElement("code");node.textContent=match[5];}
      else {node=document.createElement("a");node.textContent=match[6];node.href=match[7];node.target="_blank";node.rel="noopener noreferrer";}
      parent.append(node);
    }
    cursor=pattern.lastIndex;
  }
  if(cursor<text.length) parent.append(document.createTextNode(text.slice(cursor)));
}

function renderTutorMarkdown(target, markdown) {
  target.replaceChildren();
  const lines = String(markdown || "").replace(/\r\n?/g, "\n").split("\n");
  let paragraph = [], list = null, codeLines = null;
  const flushParagraph = () => {
    if (!paragraph.length) return;
    const p = document.createElement("p");
    appendTutorInline(p, paragraph.join(" "));
    target.append(p); paragraph = [];
  };
  const flushList = () => { if (list) { target.append(list); list = null; } };
  for (const line of lines) {
    if (line.trim().startsWith(String.fromCharCode(96).repeat(3))) {
      flushParagraph(); flushList();
      if (codeLines) {
        const pre = document.createElement("pre"), code = document.createElement("code");
        code.textContent = codeLines.join("\n"); pre.append(code); target.append(pre); codeLines = null;
      } else codeLines = [];
      continue;
    }
    if (codeLines) { codeLines.push(line); continue; }
    const trimmed = line.trim();
    if (!trimmed) { flushParagraph(); flushList(); continue; }
    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph(); flushList();
      const h = document.createElement("h" + heading[1].length);
      appendTutorInline(h, heading[2]); target.append(h); continue;
    }
    const item = trimmed.match(/^([-*+]\s+|\d+[.)]\s+)(.+)$/);
    if (item) {
      flushParagraph();
      const ordered = /^\d/.test(item[1]);
      if (!list || list.tagName !== (ordered ? "OL" : "UL")) {
        flushList(); list = document.createElement(ordered ? "OL" : "UL");
      }
      const li = document.createElement("li");
      appendTutorInline(li, item[2]); list.append(li); continue;
    }
    if (/^[-*_]{3,}$/.test(trimmed)) {
      flushParagraph(); flushList(); target.append(document.createElement("hr")); continue;
    }
    flushList(); paragraph.push(trimmed);
  }
  flushParagraph(); flushList();
  if (codeLines) {
    const pre = document.createElement("pre"), code = document.createElement("code");
    code.textContent = codeLines.join("\n"); pre.append(code); target.append(pre);
  }
}

function appendTutorMessage(role, content, pending=false) {
  const article=document.createElement("article");
  article.className="tutor-message "+role+(pending?" is-pending":"");
  const speaker=document.createElement("span");
  speaker.className="tutor-speaker";
  speaker.textContent=role==="user"?"You":"StudySense";
  const body=document.createElement("div");
  body.className="tutor-content";
  if(pending) body.textContent=content;
  else if(role==="assistant") renderTutorMarkdown(body,content);
  else body.textContent=content;
  article.append(speaker,body);
  tutorTranscript.append(article);
  tutorTranscript.scrollTop=tutorTranscript.scrollHeight;
  return {article,paragraph:body};
}
function resizeTutorInput() {
  tutorInput.style.height="auto";
  tutorInput.style.height=Math.min(tutorInput.scrollHeight,150)+"px";
}
function syncTutorGrade() {
  tutorGradeLabel.textContent=String(Number(profileGrade.value)||9);
}
profileGrade.addEventListener("change",syncTutorGrade);
syncTutorGrade();
document.querySelectorAll("[data-tutor-prompt]").forEach(button=>button.addEventListener("click",()=>{
  tutorInput.value=button.dataset.tutorPrompt||"";
  tutorInput.focus();
  resizeTutorInput();
}));
tutorInput.addEventListener("input",resizeTutorInput);
tutorInput.addEventListener("keydown",event=>{
  if(event.key==="Enter"&&!event.shiftKey&&!event.isComposing){
    event.preventDefault();
    tutorForm.requestSubmit();
  }
});
async function sendTutorMessage(event) {
  event.preventDefault();
  const question=tutorInput.value.trim();
  if(!question||tutorSending)return;
  tutorSending=true;
  tutorSubmit.disabled=true;
  tutorInput.disabled=true;
  tutorMessage.textContent="";
  appendTutorMessage("user",question);
  const pending=appendTutorMessage("assistant","Thinking…",true);
  tutorInput.value="";
  resizeTutorInput();
  const outgoing=[...tutorConversation,{role:"user",content:question}].slice(-14);
  try {
    const response=await api("/api/tutor",{method:"POST",body:JSON.stringify({grade:Number(profileGrade.value)||9,messages:outgoing})});
    const answer=typeof response.answer==="string"&&response.answer.trim()?response.answer.trim():"I couldn't produce a reply. Please try again.";
    renderTutorMarkdown(pending.paragraph,answer);
    pending.article.classList.remove("is-pending");
    tutorConversation=[...outgoing,{role:"assistant",content:answer}].slice(-14);
    try{await persistTutorChat(question);tutorMessage.textContent="Saved to chat history.";}
    catch(saveError){tutorMessage.textContent="Reply received, but chat couldn't be saved: "+saveError.message;}
  } catch(error) {
    pending.paragraph.textContent="I couldn't send that just now. "+(error.message||"Please try again.");
    pending.article.classList.remove("is-pending");
    pending.article.classList.add("is-error");
    tutorMessage.textContent="Message not sent. Check your connection and try again.";
  } finally {
    tutorSending=false;
    tutorSubmit.disabled=false;
    tutorInput.disabled=false;
    tutorInput.focus();
    resizeTutorInput();
  }
}
tutorForm.addEventListener("submit",sendTutorMessage);

let speechRecognition=null;
if(tutorVoiceInput){
 const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(SpeechRecognition){
  speechRecognition=new SpeechRecognition();speechRecognition.lang="en-IN";speechRecognition.interimResults=true;speechRecognition.continuous=false;
  speechRecognition.addEventListener("start",()=>{tutorVoiceInput.textContent="⏺";tutorVoiceInput.setAttribute("aria-label","Stop voice input");tutorMessage.textContent="Listening…";});
  speechRecognition.addEventListener("result",event=>{let text="";for(let i=event.resultIndex;i<event.results.length;i++)text+=event.results[i][0].transcript;tutorInput.value=text;resizeTutorInput();});
  speechRecognition.addEventListener("end",()=>{tutorVoiceInput.textContent="🎙";tutorVoiceInput.setAttribute("aria-label","Use voice input");tutorMessage.textContent="";tutorInput.focus();});
  speechRecognition.addEventListener("error",event=>{tutorMessage.textContent=event.error==="not-allowed"?"Microphone permission was denied. Allow microphone access in your browser.":"Voice input stopped. You can still type your message.";});
  tutorVoiceInput.addEventListener("click",()=>{try{if(tutorVoiceInput.textContent==="⏺")speechRecognition.stop();else speechRecognition.start();}catch{tutorMessage.textContent="Voice input is already active."; }});
 }else{tutorVoiceInput.disabled=true;tutorVoiceInput.title="Voice input is not supported in this browser";}
}
if(tutorSpeak)tutorSpeak.addEventListener("click",()=>{
 if(!("speechSynthesis" in window)){tutorMessage.textContent="Speech playback is not supported in this browser.";return;}
 const answers=[...tutorTranscript.querySelectorAll(".tutor-message.assistant:not(.is-pending):not(.is-error) p")];
 const latest=answers[answers.length-1]?.textContent;
 if(!latest){tutorMessage.textContent="There is no answer to read yet.";return;}
 speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(latest);utterance.lang="en-IN";speechSynthesis.speak(utterance);
});

async function loadProfile(){try{const d=await api("/api/profile"),p=d.profile||{};profileName.value=p.display_name||"";profileGrade.value=String(p.grade||9);profileSchool.value=p.school||"";profileGoal.value=String(p.daily_goal_minutes||60);document.querySelector("#syllabusClass").value=profileGrade.value;document.querySelector("#curriculumGrade").value=profileGrade.value;renderSyllabusOptions();renderSyllabusBookNote();renderCurriculumLibrary();}catch(e){profileMessage.textContent=e.message;}}
profileGrade.addEventListener("change",()=>{document.querySelector("#syllabusClass").value=profileGrade.value;document.querySelector("#curriculumGrade").value=profileGrade.value;renderSyllabusOptions();renderSyllabusBookNote();renderCurriculumLibrary();});
profileForm.addEventListener("submit",async e=>{e.preventDefault();const b=profileForm.querySelector('button[type="submit"]');b.disabled=true;profileMessage.textContent="Saving…";try{await api("/api/profile",{method:"PUT",body:JSON.stringify({display_name:profileName.value.trim(),grade:Number(profileGrade.value),school:profileSchool.value.trim(),daily_goal_minutes:Number(profileGoal.value)})});profileMessage.textContent="Profile saved.";}catch(err){profileMessage.textContent=err.message;}finally{b.disabled=false;}});


async function start() {
  const cachedUser = readSessionHintUser();
  if (isAuthPage) { authLoadingPanel.hidden = true; authPanel.hidden = false; appPanel.hidden = true; }
  if (cachedUser) showSignedIn(cachedUser);
  try {
    const data = await api("/api/auth/me");
    if (data.user) {
      showSignedIn(data.user);
      await Promise.all([loadTasks(), loadExams(), loadLearningTools(), loadProfile()]);
      if (googleStatus === "linked") taskMessage.textContent = googleMessages.linked;
    } else {
      showSignedOut(googleStatus && googleMessages[googleStatus] ? googleMessages[googleStatus] : "");
    }
  } catch {
    if (cachedUser) {
      document.querySelector("#connectionStatus").textContent = "CONNECTION ISSUE · SESSION NOT VERIFIED";
      taskMessage.textContent = "StudySense could not verify the session. Check your connection and refresh; private account data has not been loaded.";
    } else {
      showSignedOut("Could not connect to StudySense. Refresh the page and try again.");
    }
  }
}
start();


// Register the offline app shell. API responses and account data are never cached.
if ("serviceWorker" in navigator && window.isSecureContext) {
  navigator.serviceWorker.register("/sw.js").catch(error => {
    console.warn("StudySense offline support could not be enabled:", error);
  });
}


// Focus timer: use an end timestamp so background-tab throttling does not stretch sessions.
const focusClock=document.querySelector("#focusClock"),focusStart=document.querySelector("#focusStart"),focusPause=document.querySelector("#focusPause"),focusReset=document.querySelector("#focusReset"),focusSessions=document.querySelector("#focusSessions"),focusNote=document.querySelector("#focusNote");
let focusRemaining=25*60,focusInterval=null,focusEndAt=0,focusCount=0;
try {
  const savedCount=Number(localStorage.getItem("studysense-focus-sessions")||0);
  focusCount=Number.isSafeInteger(savedCount)&&savedCount>=0?savedCount:0;
} catch {}
function renderFocus(){
  focusClock.textContent=String(Math.floor(focusRemaining/60)).padStart(2,"0")+":"+String(focusRemaining%60).padStart(2,"0");
  focusSessions.textContent=focusCount+" session"+(focusCount===1?"":"s");
  focusStart.disabled=focusInterval!==null||focusRemaining<=0;
  focusPause.disabled=focusInterval===null;
}
function stopFocus(){if(focusInterval!==null){clearInterval(focusInterval);focusInterval=null;}}
function tickFocus(){
  focusRemaining=Math.max(0,Math.ceil((focusEndAt-Date.now())/1000));
  renderFocus();
  if(focusRemaining<=0){
    stopFocus();focusEndAt=0;focusCount++;
    try{localStorage.setItem("studysense-focus-sessions",String(focusCount));}catch{}
    renderFocus();
    focusNote.textContent="Session complete! Take a short break, then reset for another round.";
    try{if("Notification"in window&&Notification.permission==="granted")new Notification("StudySense focus session complete",{body:"Nice work. Take a short break."});}catch{}
  }
}
focusStart.addEventListener("click",()=>{
  if(focusInterval!==null||focusRemaining<=0)return;
  focusNote.textContent="Focus time — you've got this!";
  focusEndAt=Date.now()+focusRemaining*1000;
  focusInterval=setInterval(tickFocus,250);
  tickFocus();
});
focusPause.addEventListener("click",()=>{
  if(focusInterval===null)return;
  focusRemaining=Math.max(0,Math.ceil((focusEndAt-Date.now())/1000));
  stopFocus();focusEndAt=0;renderFocus();
  focusNote.textContent="Paused — resume when you're ready.";
});
focusReset.addEventListener("click",()=>{
  stopFocus();focusEndAt=0;focusRemaining=25*60;renderFocus();
  focusNote.textContent="25-minute focus session";
});
renderFocus();


// Flashcards and practice history are account-scoped on the server.
const flashcardForm=document.querySelector("#flashcardForm"),flashSubject=document.querySelector("#flashSubject"),flashPrompt=document.querySelector("#flashPrompt"),flashAnswer=document.querySelector("#flashAnswer"),flashcardList=document.querySelector("#flashcardList"),flashMessage=document.querySelector("#flashMessage"),dueFlashcards=document.querySelector("#dueFlashcards");
const practiceForm=document.querySelector("#practiceForm"),practiceSubject=document.querySelector("#practiceSubject"),practiceTopic=document.querySelector("#practiceTopic"),practiceQuestions=document.querySelector("#practiceQuestions"),practiceCorrect=document.querySelector("#practiceCorrect"),practiceNotes=document.querySelector("#practiceNotes"),practiceList=document.querySelector("#practiceList"),practiceMessage=document.querySelector("#practiceMessage"),practiceAccuracy=document.querySelector("#practiceAccuracy");
function renderFlashcards(cards){flashcardList.replaceChildren();const today=new Date().toISOString().slice(0,10),due=cards.filter(c=>c.next_review<=today);dueFlashcards.textContent=due.length+" due";if(!cards.length){flashcardList.append(makeNode("p","empty","No flashcards yet. Add one above to start active recall."));return;}cards.forEach(c=>{const card=makeNode("article","learning-card"),title=makeNode("div","exam-title",c.prompt),sub=makeNode("p","chapter-meta",c.subject+" · Due "+c.next_review),details=document.createElement("details"),summary=makeNode("summary","","Reveal answer"),answer=makeNode("p","",c.answer),actions=makeNode("div","learning-actions"),again=makeNode("button","secondary-button","Review tomorrow"),week=makeNode("button","secondary-button","Review in 7 days"),del=makeNode("button","small-delete","Delete");details.append(summary,answer);again.onclick=async()=>{try{await api("/api/flashcards/"+c.id,{method:"PATCH",body:JSON.stringify({review_in_days:1})});await loadLearningTools()}catch(e){flashMessage.textContent=e.message}};week.onclick=async()=>{try{await api("/api/flashcards/"+c.id,{method:"PATCH",body:JSON.stringify({review_in_days:7})});await loadLearningTools()}catch(e){flashMessage.textContent=e.message}};del.onclick=async()=>{try{await api("/api/flashcards/"+c.id,{method:"DELETE"});await loadLearningTools()}catch(e){flashMessage.textContent=e.message}};actions.append(again,week,del);card.append(title,sub,details,actions);flashcardList.append(card);});}
function renderPractice(items){practiceList.replaceChildren();const total=items.reduce((n,p)=>n+p.questions,0),correct=items.reduce((n,p)=>n+p.correct,0);practiceAccuracy.textContent=(total?Math.round(correct/total*100):0)+"% accuracy";if(!items.length){practiceList.append(makeNode("p","empty","Your practice sessions will appear here."));return;}items.slice(0,10).forEach(p=>{const row=makeNode("article","learning-card"),title=makeNode("div","exam-title",p.topic),meta=makeNode("p","chapter-meta",p.subject+" · "+p.correct+"/"+p.questions+" correct · "+p.practiced_on),notes=makeNode("p","chapter-meta",p.notes||"");row.append(title,meta);if(p.notes)row.append(notes);practiceList.append(row);});}
async function loadLearningTools(){try{const [f,p]=await Promise.all([api("/api/flashcards"),api("/api/practice")]);renderFlashcards(f.flashcards);renderPractice(p.practice);window.dispatchEvent(new Event("studysense:data-changed"))}catch(e){flashMessage.textContent=e.message;practiceMessage.textContent=e.message;}}
flashcardForm.addEventListener("submit",async ev=>{ev.preventDefault();const b=flashcardForm.querySelector('button[type="submit"]');b.disabled=true;try{await api("/api/flashcards",{method:"POST",body:JSON.stringify({subject:flashSubject.value.trim(),prompt:flashPrompt.value.trim(),answer:flashAnswer.value.trim()})});flashPrompt.value="";flashAnswer.value="";await loadLearningTools()}catch(e){flashMessage.textContent=e.message}finally{b.disabled=false}});
practiceForm.addEventListener("submit",async ev=>{ev.preventDefault();const q=Number(practiceQuestions.value),c=Number(practiceCorrect.value);if(c>q){practiceMessage.textContent="Correct answers cannot exceed questions attempted.";return;}const b=practiceForm.querySelector('button[type="submit"]');b.disabled=true;try{await api("/api/practice",{method:"POST",body:JSON.stringify({subject:practiceSubject.value.trim(),topic:practiceTopic.value.trim(),questions:q,correct:c,notes:practiceNotes.value.trim()})});practiceTopic.value="";practiceQuestions.value="";practiceCorrect.value="";practiceNotes.value="";practiceMessage.textContent="Practice saved.";await loadLearningTools()}catch(e){practiceMessage.textContent=e.message}finally{b.disabled=false}});


// Progressive Web App installation: browsers that support the install prompt get a button.
// Browsers without that API simply keep the normal website experience.
const installAppButton = document.querySelector("#installAppButton");
let pendingInstallPrompt = null;
window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  pendingInstallPrompt = event;
  installAppButton.hidden = false;
});
installAppButton.addEventListener("click", async () => {
  if (!pendingInstallPrompt) return;
  installAppButton.disabled = true;
  try {
    await pendingInstallPrompt.prompt();
    await pendingInstallPrompt.userChoice;
    pendingInstallPrompt = null;
    installAppButton.hidden = true;
  } catch (error) {
    console.warn("StudySense installation prompt was unavailable:", error);
  } finally {
    installAppButton.disabled = false;
  }
});
window.addEventListener("appinstalled", () => {
  pendingInstallPrompt = null;
  installAppButton.hidden = true;
});


// Make the offline limitation clear: the app shell may load offline, but account data
// and changes still require a connection because private API responses are never cached.
const connectionStatus = document.querySelector("#connectionStatus");
function updateConnectionStatus() {
  const online = navigator.onLine;
  connectionStatus.textContent = online ? "YOUR STUDY SPACE" : "OFFLINE · RECONNECT TO SYNC";
  connectionStatus.classList.toggle("offline", !online);
  connectionStatus.title = online
    ? "Connected. Your account data can sync."
    : "The app shell may still open, but account data and saving changes need an internet connection.";
}
window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);
updateConnectionStatus();

const screenTimeClock=document.querySelector("#screenTimeClock"),screenTimeStart=document.querySelector("#screenTimeStart"),screenTimeReset=document.querySelector("#screenTimeReset"),screenTimeStatus=document.querySelector("#screenTimeStatus"),screenTimeNote=document.querySelector("#screenTimeNote");
let screenTimePhase="ready",screenTimeRemaining=900,screenTimeInterval=null,screenTimeEndAt=0;
function renderScreenTime(){screenTimeClock.textContent=String(Math.floor(screenTimeRemaining/60)).padStart(2,"0")+":"+String(screenTimeRemaining%60).padStart(2,"0");screenTimeStatus.textContent=screenTimePhase==="ready"?"Ready":screenTimePhase==="entertainment"?"Entertainment":screenTimePhase==="cooldown"?"Cooldown":"Complete";screenTimeStart.textContent=screenTimePhase==="entertainment"?"Session running":screenTimePhase==="cooldown"?"Cooldown active":"Start entertainment";screenTimeStart.disabled=["entertainment","cooldown"].includes(screenTimePhase);screenTimeReset.disabled=["entertainment","cooldown"].includes(screenTimePhase);}
function stopScreenTime(){if(screenTimeInterval!==null){clearInterval(screenTimeInterval);screenTimeInterval=null;}}
function tickScreenTime(){screenTimeRemaining=Math.max(0,Math.ceil((screenTimeEndAt-Date.now())/1000));if(screenTimeRemaining===0){if(screenTimePhase==="entertainment"){screenTimePhase="cooldown";screenTimeRemaining=2100;screenTimeEndAt=Date.now()+screenTimeRemaining*1000;screenTimeNote.textContent="Your 15-minute allowance is over. Cooldown: 35 minutes.";}else if(screenTimePhase==="cooldown"){screenTimePhase="complete";screenTimeNote.textContent="Cooldown complete. You can start another session.";stopScreenTime();}}renderScreenTime();try{localStorage.setItem("studysense-screen-time",JSON.stringify({phase:screenTimePhase,endAt:screenTimeEndAt}));}catch{}}
screenTimeStart.addEventListener("click",()=>{if(!["ready","complete"].includes(screenTimePhase))return;screenTimePhase="entertainment";screenTimeRemaining=900;screenTimeEndAt=Date.now()+900000;screenTimeNote.textContent="15-minute session running. The 35-minute cooldown starts automatically.";screenTimeInterval=setInterval(tickScreenTime,1000);tickScreenTime();});
screenTimeReset.addEventListener("click",()=>{stopScreenTime();screenTimePhase="ready";screenTimeRemaining=900;screenTimeEndAt=0;screenTimeNote.textContent="The 35-minute cooldown begins when the session expires.";try{localStorage.removeItem("studysense-screen-time");}catch{}renderScreenTime();});
try{const saved=JSON.parse(localStorage.getItem("studysense-screen-time")||"null");if(saved&&saved.phase==="entertainment"){if(saved.endAt>Date.now()){screenTimePhase="entertainment";screenTimeEndAt=saved.endAt;screenTimeRemaining=Math.ceil((saved.endAt-Date.now())/1000);screenTimeInterval=setInterval(tickScreenTime,1000);tickScreenTime();}else{screenTimePhase="cooldown";screenTimeRemaining=2100;screenTimeEndAt=Date.now()+2100000;screenTimeNote.textContent="Your entertainment session ended while this page was closed. The 35-minute cooldown starts now.";screenTimeInterval=setInterval(tickScreenTime,1000);tickScreenTime();}}else if(saved&&saved.phase==="cooldown"){if(saved.endAt>Date.now()){screenTimePhase="cooldown";screenTimeEndAt=saved.endAt;screenTimeRemaining=Math.ceil((saved.endAt-Date.now())/1000);screenTimeInterval=setInterval(tickScreenTime,1000);tickScreenTime();}else{screenTimePhase="complete";screenTimeRemaining=0;screenTimeNote.textContent="Cooldown complete. You can start another session.";localStorage.removeItem("studysense-screen-time");}}}catch{}renderScreenTime();
