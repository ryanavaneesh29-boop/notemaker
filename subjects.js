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

const subjectChoices = document.querySelector("#subjectChoices");

let selectedSubjects = [];

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

  if (!response.ok) throw new Error("Request failed");
  return response.json();
}

async function loadSubjects() {
  const data = await api("/api/subjects");
  selectedSubjects = data.subjects || [];
  renderSubjectChoices();
}

function renderSubjectChoices() {
  subjectChoices.innerHTML = "";

  allSubjects.forEach((subject) => {
    const isSelected = selectedSubjects.includes(subject.name);
    const button = document.createElement("button");
    button.className = `choice-card${isSelected ? " is-selected" : ""}`;
    button.type = "button";
    button.innerHTML = `
      <span class="choice-colour" style="background:${subject.color}" aria-hidden="true"></span>
      <span>
        <strong>${subject.name}</strong>
        <small>${isSelected ? "Added to your account" : "Press to add this subject"}</small>
      </span>
    `;

    button.addEventListener("click", async () => {
      if (!selectedSubjects.includes(subject.name)) {
        await api("/api/subjects", {
          method: "POST",
          body: JSON.stringify({ name: subject.name })
        });
        selectedSubjects.push(subject.name);
      }

      renderSubjectChoices();
    });

    subjectChoices.appendChild(button);
  });
}

loadSubjects();
