const notesCount = document.querySelector("#notesCount");
const subjectsCount = document.querySelector("#subjectsCount");
const mindmapsCount = document.querySelector("#mindmapsCount");
const lastLogin = document.querySelector("#lastLogin");
const upcomingExams = document.querySelector("#upcomingExams");
const presetBoardList = document.querySelector("#presetBoardList");
const presetMessage = document.querySelector("#presetMessage");

const presetBoards = [
  {
    name: "Edexcel English",
    subjects: ["English Language", "English Literature"],
  },
  {
    name: "OCR Science",
    subjects: ["Biology", "Chemistry", "Physics"],
  },
  {
    name: "Maths & Technology",
    subjects: ["Maths", "Information Technology", "Design Technology"],
  },
];

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
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Request failed");
  }

  return response.json();
}

function formatTimestamp(value) {
  if (!value) return "Never";
  const date = new Date(value * 1000);
  return date.toLocaleString();
}

function renderUpcoming(exams) {
  upcomingExams.innerHTML = "";
  if (!exams.length) {
    upcomingExams.textContent = "No upcoming exams saved.";
    return;
  }
  exams.forEach((exam) => {
    const card = document.createElement("div");
    card.className = "upcoming-card";
    card.innerHTML = `
      <strong>${exam.title}</strong>
      <p>${exam.subject}</p>
      <p>${exam.examDate}</p>
    `;
    upcomingExams.appendChild(card);
  });
}

function renderPresets() {
  presetBoardList.innerHTML = "";
  presetBoards.forEach((board) => {
    const button = document.createElement("button");
    button.className = "preset-card";
    button.type = "button";
    button.textContent = `${board.name} — ${board.subjects.join(", ")}`;
    button.addEventListener("click", async () => {
      try {
        presetMessage.textContent = "";
        for (const subject of board.subjects) {
          await api("/api/subjects", {
            method: "POST",
            body: JSON.stringify({ name: subject }),
          });
        }
        presetMessage.style.color = "#0f766e";
        presetMessage.textContent = `Saved preset ${board.name}.`;
      } catch (err) {
        presetMessage.style.color = "#b4234c";
        presetMessage.textContent = err.message;
      }
    });
    presetBoardList.appendChild(button);
  });
}

async function loadDashboard() {
  try {
    const data = await api("/api/dashboard");
    if (!data) return;

    notesCount.textContent = data.notesCount || 0;
    subjectsCount.textContent = data.subjectsCount || 0;
    mindmapsCount.textContent = data.mindmapsCount || 0;
    lastLogin.textContent = formatTimestamp(data.lastLogin);
    renderUpcoming(data.upcomingExams || []);
    renderPresets();
  } catch (err) {
    presetMessage.style.color = "#b4234c";
    presetMessage.textContent = err.message;
  }
}

loadDashboard();
