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

const subjectTopics = {
  "English Language": ["Paper 1: Explorations in creative reading and writing", "Paper 2: Writers' viewpoints and perspectives", "Spoken Language endorsement"],
  "English Literature": ["Macbeth", "A Christmas Carol", "An Inspector Calls", "Power and Conflict poetry", "Unseen poetry"],
  "Maths": ["Number", "Algebra", "Ratio, proportion and rates of change", "Geometry and measures", "Probability", "Statistics"],
  "Physics": ["Energy", "Electricity", "Particle model of matter", "Atomic structure", "Forces", "Waves", "Magnetism and electromagnetism", "Space physics"],
  "Biology": ["Cell biology", "Organisation", "Infection and response", "Bioenergetics", "Homeostasis and response", "Inheritance, variation and evolution", "Ecology"],
  "Chemistry": ["Atomic structure and the periodic table", "Bonding, structure and properties", "Quantitative chemistry", "Chemical changes", "Energy changes", "Rate and extent of chemical change", "Organic chemistry", "Chemical analysis", "Chemistry of the atmosphere", "Using resources"],
  "History": ["Migrants in Britain, c800-present", "Notting Hill, c1948-c1970", "Superpower relations and the Cold War, 1941-91", "Weimar and Nazi Germany, 1918-39", "Edexcel exam skills"],
  "Geography": ["Natural hazards", "Living world", "Physical landscapes", "Urban issues", "Fieldwork"],
  "Information Technology": ["R050: Design tools", "R050: Human Computer Interface", "R050: Data and testing", "R050: Cyber-security and legislation", "R050: Digital communications and Internet of Everything", "R060: Data manipulation using spreadsheets", "R070: Augmented Reality"],
  "Design Technology": ["Core technical principles", "Specialist technical principles", "Designing and making principles", "Maths and science in DT", "Non-exam assessment"]
};

const subjectPlaceholders = {
  "English Language": ["Paper 1 creative writing plan", "Write your English Language revision notes here..."],
  "English Literature": ["Macbeth ambition quotes", "Write quotes, context, themes and essay plans here..."],
  "Maths": ["Quadratic equations practice", "Write methods, worked examples and formula notes here..."],
  "Physics": ["Forces equation practice", "Write physics definitions, equations and required practical notes here..."],
  "Biology": ["Cell biology required practical", "Write biology processes, diagrams and key terms here..."],
  "Chemistry": ["Bonding and structure notes", "Write chemistry equations, tests and reaction notes here..."],
  "History": ["Weimar Germany timeline", "Write timelines, causes, consequences and exam answers here..."],
  "Geography": ["Natural hazards case study", "Write geography case studies, processes and data notes here..."],
  "Information Technology": ["R050 cyber-security notes", "Write OCR J836 IT knowledge and NEA planning notes here..."],
  "Design Technology": ["NEA design ideas", "Write DT materials, processes and prototype notes here..."]
};

const subjectList = document.querySelector("#subjectList");
const subjectTitle = document.querySelector("#subjectTitle");
const syllabusLink = document.querySelector("#syllabusLink");
const myNotesLink = document.querySelector("#myNotesLink");
const noteForm = document.querySelector("#noteForm");
const noteTitle = document.querySelector("#noteTitle");
const noteTopic = document.querySelector("#noteTopic");
const noteContent = document.querySelector("#noteContent");
const notePriority = document.querySelector("#notePriority");
const noteExamDate = document.querySelector("#noteExamDate");
const newNoteButton = document.querySelector("#newNoteButton");
const clearFormButton = document.querySelector("#clearFormButton");
const deleteNoteButton = document.querySelector("#deleteNoteButton");
const toolbarButtons = document.querySelectorAll(".doc-toolbar button");
const fontSizeSelect = document.querySelector("#fontSizeSelect");
const textColour = document.querySelector("#textColour");
const highlightColour = document.querySelector("#highlightColour");
const mathInsertSelect = document.querySelector("#mathInsertSelect");
const pageParams = new URLSearchParams(window.location.search);

let subjects = [];
let notes = [];
let activeSubject = pageParams.get("subject") || "English Language";
let activeNoteId = pageParams.get("noteId") || null;

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (response.status === 401) {
    window.location.href = "login.html";
    return null;
  }

  if (!response.ok) {
    throw new Error((await response.json()).error || "Request failed");
  }

  return response.json();
}

async function loadAccountData() {
  const [subjectData, noteData] = await Promise.all([
    api("/api/subjects"),
    api("/api/notes")
  ]);

  subjects = (subjectData.subjects || []).map((name) => (
    allSubjects.find((subject) => subject.name === name) || { name, color: "#334155" }
  ));
  notes = noteData.notes || [];

  if (!subjects.some((subject) => subject.name === activeSubject)) {
    activeSubject = subjects[0]?.name || "English Language";
  }

  if (!notes.some((note) => note.id === activeNoteId)) {
    activeNoteId = notes.find((note) => note.subject === activeSubject)?.id || null;
  }

  const draftTopic = pageParams.get("topic");
  if (draftTopic) {
    await openOrCreateSyllabusNote(draftTopic, pageParams.get("detail") || "");
  }

  render();
}

function makeId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function renderSubjects() {
  subjectList.innerHTML = "";

  subjects.forEach((subject) => {
    const subjectNotes = notes.filter((note) => note.subject === subject.name).length;
    const button = document.createElement("button");
    button.className = `subject-button${subject.name === activeSubject ? " is-active" : ""}`;
    button.type = "button";
    button.innerHTML = `
      <span>${subject.name}</span>
      <span class="subject-chip" style="background:${subject.color}">${subjectNotes}</span>
    `;
    button.addEventListener("click", () => {
      activeSubject = subject.name;
      activeNoteId = notes.find((note) => note.subject === activeSubject)?.id || null;
      render();
    });
    subjectList.appendChild(button);
  });
}

function fillForm(note) {
  populateTopicOptions(note?.topic || pageParams.get("topic") || "");

  if (!note) {
    noteTitle.value = "";
    noteContent.innerHTML = "";
    notePriority.value = "Core";
    noteExamDate.value = "";
    deleteNoteButton.disabled = true;
    return;
  }

  noteTitle.value = note.title;
  noteTopic.value = note.topic;
  noteContent.innerHTML = textToDocumentHtml(note.content);
  notePriority.value = note.priority;
  noteExamDate.value = note.examDate;
  deleteNoteButton.disabled = false;
}

function render() {
  const currentNote = notes.find((note) => note.id === activeNoteId);
  subjectTitle.textContent = activeSubject;
  syllabusLink.href = `syllabus.html?subject=${encodeURIComponent(activeSubject)}`;
  myNotesLink.href = `notes.html?subject=${encodeURIComponent(activeSubject)}`;
  history.replaceState(null, "", `index.html?subject=${encodeURIComponent(activeSubject)}${activeNoteId ? `&noteId=${encodeURIComponent(activeNoteId)}` : ""}`);
  localStorage.setItem("gcse-last-page", `index.html?subject=${encodeURIComponent(activeSubject)}${activeNoteId ? `&noteId=${encodeURIComponent(activeNoteId)}` : ""}`);
  updatePlaceholders();
  renderSubjects();
  fillForm(currentNote);
}

function updatePlaceholders() {
  const [title, content] = subjectPlaceholders[activeSubject] || subjectPlaceholders["English Language"];
  noteTitle.placeholder = title;
  noteContent.dataset.placeholder = content;
}

function populateTopicOptions(selectedTopic = "") {
  const topics = subjectTopics[activeSubject] || [];
  noteTopic.innerHTML = `<option value="">Choose a topic</option>`;

  topics.forEach((topic) => {
    const option = document.createElement("option");
    option.value = topic;
    option.textContent = topic;
    noteTopic.appendChild(option);
  });

  if (selectedTopic && !topics.includes(selectedTopic)) {
    const option = document.createElement("option");
    option.value = selectedTopic;
    option.textContent = selectedTopic;
    noteTopic.appendChild(option);
  }

  noteTopic.value = selectedTopic;
}

function createNoteFromForm(existingId) {
  return {
    id: existingId || makeId(),
    subject: activeSubject,
    title: noteTitle.value.trim(),
    topic: noteTopic.value,
    content: cleanDocumentHtml(noteContent.innerHTML),
    priority: notePriority.value,
    examDate: noteExamDate.value,
    source: existingId ? notes.find((note) => note.id === existingId)?.source : undefined
  };
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function stripHtml(value) {
  const temp = document.createElement("div");
  temp.innerHTML = value || "";
  return temp.textContent || temp.innerText || "";
}

function textToDocumentHtml(value) {
  if (!value) return "";
  if (/<[a-z][\s\S]*>/i.test(value)) return cleanDocumentHtml(value);

  return value
    .split("\n")
    .map((line) => line.trim() ? `<p>${escapeHtml(line)}</p>` : "<p><br></p>")
    .join("");
}

function cleanDocumentHtml(value) {
  const allowedTags = ["P", "BR", "STRONG", "B", "EM", "I", "U", "UL", "OL", "LI", "H3", "SUP", "SUB", "FONT", "SPAN", "DIV"];
  const allowedStyles = ["text-align", "background-color", "color"];
  const source = document.createElement("div");
  const target = document.createElement("div");
  source.innerHTML = value || "";

  function copyCleanNode(node, parent) {
    if (node.nodeType === Node.TEXT_NODE) {
      parent.appendChild(document.createTextNode(node.textContent));
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    if (!allowedTags.includes(node.tagName)) {
      node.childNodes.forEach((child) => copyCleanNode(child, parent));
      return;
    }

    const cleanNode = document.createElement(node.tagName.toLowerCase());
    allowedStyles.forEach((styleName) => {
      const styleValue = node.style.getPropertyValue(styleName);
      if (styleValue) cleanNode.style.setProperty(styleName, styleValue);
    });

    if (node.tagName === "FONT") {
      if (node.color) cleanNode.color = node.color;
      if (node.size) cleanNode.size = node.size;
    }

    node.childNodes.forEach((child) => copyCleanNode(child, cleanNode));
    parent.appendChild(cleanNode);
  }

  source.childNodes.forEach((child) => copyCleanNode(child, target));
  return target.innerHTML.trim();
}

async function openOrCreateSyllabusNote(topic, detail) {
  const existing = notes.find((note) => note.subject === activeSubject && note.topic === topic && note.source === "syllabus");
  if (existing) {
    activeNoteId = existing.id;
    return;
  }

  const note = {
    id: makeId(),
    subject: activeSubject,
    title: topic,
    topic,
    content: detail ? `<h3>${escapeHtml(topic)}</h3><p>${escapeHtml(detail)}</p><p><br></p>` : `<h3>${escapeHtml(topic)}</h3><p><br></p>`,
    priority: "Core",
    examDate: "",
    source: "syllabus"
  };

  await api("/api/notes", { method: "POST", body: JSON.stringify(note) });
  notes.unshift(note);
  activeNoteId = note.id;
}

noteForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!stripHtml(noteContent.innerHTML).trim()) {
    noteContent.focus();
    return;
  }

  const currentIndex = notes.findIndex((note) => note.id === activeNoteId);
  const savedNote = createNoteFromForm(activeNoteId);
  const method = currentIndex >= 0 ? "PUT" : "POST";

  await api("/api/notes", { method, body: JSON.stringify(savedNote) });

  if (currentIndex >= 0) {
    notes[currentIndex] = savedNote;
  } else {
    notes.unshift(savedNote);
  }

  activeNoteId = savedNote.id;
  render();
});

newNoteButton.addEventListener("click", () => {
  activeNoteId = null;
  fillForm(null);
  noteTitle.focus();
  render();
});

clearFormButton.addEventListener("click", () => {
  activeNoteId = null;
  fillForm(null);
  render();
});

deleteNoteButton.addEventListener("click", async () => {
  if (!activeNoteId) return;

  await api(`/api/notes?id=${encodeURIComponent(activeNoteId)}`, { method: "DELETE" });
  notes = notes.filter((note) => note.id !== activeNoteId);
  activeNoteId = notes.find((note) => note.subject === activeSubject)?.id || null;
  render();
});

toolbarButtons.forEach((button) => {
  button.addEventListener("click", () => {
    noteContent.focus();
    document.execCommand(button.dataset.command, false, button.dataset.value || null);
  });
});

fontSizeSelect.addEventListener("change", () => {
  if (!fontSizeSelect.value) return;
  noteContent.focus();
  document.execCommand("fontSize", false, fontSizeSelect.value);
  fontSizeSelect.value = "";
});

textColour.addEventListener("input", () => {
  noteContent.focus();
  document.execCommand("foreColor", false, textColour.value);
});

highlightColour.addEventListener("input", () => {
  noteContent.focus();
  document.execCommand("hiliteColor", false, highlightColour.value);
});

mathInsertSelect.addEventListener("change", () => {
  if (!mathInsertSelect.value) return;
  noteContent.focus();
  document.execCommand("insertText", false, mathInsertSelect.value);
  mathInsertSelect.value = "";
});

loadAccountData();
