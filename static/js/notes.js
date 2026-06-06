const allSubjects = [
  { name: "English Language", color: "#0f766e" },
  { name: "English Literature", color: "#b4234c" },
  { name: "Maths", color: "#2563eb" },
  { name: "Physics", color: "#c47f17" },
  { name: "Biology", color: "#16803c" },
  { name: "Chemistry", color: "#7c3aed" },
  { name: "History", color: "#9a3412" },
  { name: "Geography", color: "#047857" },
  { name: "Information Technology", color: "#334155" },
  { name: "Design Technology", color: "#be123c" }
];

const params = new URLSearchParams(window.location.search);
const notesPageTitle = document.querySelector("#notesPageTitle");
const notesSubjectTabs = document.querySelector("#notesSubjectTabs");
const notesSearch = document.querySelector("#notesSearch");
const notesTabList = document.querySelector("#notesTabList");
const backToEditor = document.querySelector("#backToEditor");

let notes = [];
let subjects = [];
let activeSubject = params.get("subject") || "English Language";

async function api(path) {
  const response = await fetch(path);
  if (response.status === 401) {
    window.location.href = "login.html";
    return null;
  }
  if (!response.ok) throw new Error("Request failed");
  return response.json();
}

async function loadData() {
  const [subjectData, noteData] = await Promise.all([api("/api/subjects"), api("/api/notes")]);
  subjects = (subjectData.subjects || []).map((name) => (
    allSubjects.find((subject) => subject.name === name) || { name, color: "#334155" }
  ));
  notes = noteData.notes || [];

  if (!subjects.some((subject) => subject.name === activeSubject)) {
    activeSubject = subjects[0]?.name || "English Language";
  }

  render();
}

function stripHtml(value) {
  const temp = document.createElement("div");
  temp.innerHTML = value || "";
  return temp.textContent || temp.innerText || "";
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderSubjectTabs() {
  notesSubjectTabs.innerHTML = "";

  subjects.forEach((subject) => {
    const count = notes.filter((note) => note.subject === subject.name).length;
    const button = document.createElement("button");
    button.className = `notes-subject-tab${subject.name === activeSubject ? " is-active" : ""}`;
    button.type = "button";
    button.innerHTML = `<span>${subject.name}</span><strong>${count}</strong>`;
    button.addEventListener("click", () => {
      activeSubject = subject.name;
      notesSearch.value = "";
      render();
    });
    notesSubjectTabs.appendChild(button);
  });
}

function renderNotes() {
  const query = notesSearch.value.trim().toLowerCase();
  const subjectNotes = notes.filter((note) => {
    const searchable = `${note.title} ${note.topic} ${stripHtml(note.content)}`.toLowerCase();
    return note.subject === activeSubject && searchable.includes(query);
  });

  notesTabList.innerHTML = "";

  if (subjectNotes.length === 0) {
    notesTabList.innerHTML = `<p class="empty-state">No notes for ${activeSubject} yet.</p>`;
    return;
  }

  subjectNotes.forEach((note) => {
    const preview = stripHtml(note.content).slice(0, 160);
    const link = document.createElement("a");
    link.className = "note-tab";
    link.href = `index.html?subject=${encodeURIComponent(note.subject)}&noteId=${encodeURIComponent(note.id)}`;
    link.innerHTML = `
      <strong>${escapeHtml(note.title)}</strong>
      <span>${escapeHtml(note.topic || "General")}</span>
      <p>${escapeHtml(preview)}${stripHtml(note.content).length > 160 ? "..." : ""}</p>
    `;
    notesTabList.appendChild(link);
  });
}

function render() {
  notesPageTitle.textContent = `${activeSubject} Notes`;
  backToEditor.href = `index.html?subject=${encodeURIComponent(activeSubject)}`;
  history.replaceState(null, "", `notes.html?subject=${encodeURIComponent(activeSubject)}`);
  localStorage.setItem("gcse-last-page", `notes.html?subject=${encodeURIComponent(activeSubject)}`);
  renderSubjectTabs();
  renderNotes();
}

notesSearch.addEventListener("input", renderNotes);

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "p") {
    event.preventDefault();
    window.print();
  }
});

loadData();
