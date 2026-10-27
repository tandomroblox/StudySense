
const form = document.querySelector("#taskForm");
const taskInput = document.querySelector("#taskInput");
const subjectInput = document.querySelector("#subjectInput");
const taskList = document.querySelector("#taskList");

// Subject-specific examples
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

// Persistent storage
const STORAGE_KEY = "studysense_tasks";

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return [];

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed.filter(task =>
      task &&
      typeof task.id === "string" &&
      typeof task.title === "string" &&
      typeof task.subject === "string" &&
      typeof task.done === "boolean"
    ) : [];
  } catch (error) {
    console.error("Could not load saved tasks:", error);
    return [];
  }
}

let tasks = loadTasks();

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Could not save tasks:", error);
    alert("Your changes could not be saved. Check browser storage.");
  }
}

// Update placeholder when subject changes
function updateTaskPlaceholder() {
  taskInput.placeholder =
    subjectExamples[subjectInput.value] || "Enter a study task";
}

subjectInput.addEventListener("change", updateTaskPlaceholder);
updateTaskPlaceholder();

function renderTasks() {
  taskList.replaceChildren();

  if (tasks.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Your study tasks will appear here.";
    taskList.append(empty);
  }

  tasks.forEach(task => {
    const row = document.createElement("div");
    row.className = `task${task.done ? " done" : ""}`;

    // Completion checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.setAttribute(
      "aria-label",
      `Complete ${task.title}`
    );

    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      saveTasks();
      renderTasks();
    });

    // Task information
    const info = document.createElement("div");
    info.className = "task-info";

    const title = document.createElement("div");
    title.className = "task-title";
    title.textContent = task.title;

    const subject = document.createElement("p");
    subject.textContent = task.subject;

    info.append(title, subject);

    // Delete button
    const remove = document.createElement("button");
    remove.className = "delete-btn";
    remove.textContent = "Delete";

    remove.addEventListener("click", () => {
      tasks = tasks.filter(item => item.id !== task.id);
      saveTasks();
      renderTasks();
    });

    row.append(checkbox, info, remove);
    taskList.append(row);
  });

  // Dashboard statistics
  const completed = tasks.filter(task => task.done).length;
  const total = tasks.length;
  const rate = total
    ? Math.round((completed / total) * 100)
    : 0;

  document.querySelector("#totalTasks").textContent = total;
  document.querySelector("#completedTasks").textContent = completed;
  document.querySelector("#completionRate").textContent = `${rate}%`;

  document.querySelector("#taskCount").textContent =
    `${total} task${total === 1 ? "" : "s"}`;
}

// Add a new task
form.addEventListener("submit", event => {
  event.preventDefault();

  const title = taskInput.value.trim();
  if (!title) return;

  tasks.push({
    id: crypto.randomUUID(),
    title,
    subject: subjectInput.value,
    done: false
  });

  saveTasks();

  taskInput.value = "";
  updateTaskPlaceholder();
  renderTasks();
});

// Initial display
renderTasks();
