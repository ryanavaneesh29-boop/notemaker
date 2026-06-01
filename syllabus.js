const allSubjects = [
  "English Language",
  "English Literature",
  "Maths",
  "Physics",
  "Biology",
  "Chemistry",
  "History",
  "Geography",
  "Information Technology",
  "Design Technology"
];

const syllabusTopics = {
  "English Language": [
    ["Paper 1: Explorations in creative reading and writing", "Unseen literary fiction, reading questions, descriptive or narrative writing"],
    ["Paper 2: Writers' viewpoints and perspectives", "Unseen non-fiction and literary non-fiction, comparison, viewpoint writing"],
    ["Spoken Language endorsement", "Presenting, responding to questions and feedback, using Standard English"]
  ],
  "English Literature": [
    ["Macbeth", "Shakespeare: ambition, guilt, kingship, the supernatural, violence, context and key quotes"],
    ["A Christmas Carol", "19th-century novel: Scrooge, poverty, redemption, social responsibility and context"],
    ["An Inspector Calls", "Modern drama: responsibility, class, gender, generations, socialism and capitalism"],
    ["Power and Conflict poetry", "AQA anthology poems: power, conflict, memory, identity, nature and comparison"],
    ["Unseen poetry", "Analyse one unseen poem and compare it with another unseen poem"]
  ],
  "Maths": [
    ["Number", "Integers, fractions, decimals, percentages, powers, roots, standard form"],
    ["Algebra", "Expressions, equations, inequalities, sequences, graphs, functions"],
    ["Ratio, proportion and rates of change", "Ratio, direct and inverse proportion, percentages, compound measures"],
    ["Geometry and measures", "Angles, constructions, transformations, area, volume, trigonometry, vectors"],
    ["Probability", "Probability scales, combined events, tree diagrams, Venn diagrams"],
    ["Statistics", "Sampling, averages, spread, charts, scatter graphs, interpreting data"]
  ],
  "Physics": [
    ["Energy", "Energy stores and transfers, work done, power, efficiency, resources"],
    ["Electricity", "Circuits, current, potential difference, resistance, domestic electricity"],
    ["Particle model of matter", "Density, changes of state, internal energy, specific heat capacity, pressure"],
    ["Atomic structure", "Atoms, isotopes, nuclear radiation, half-life, contamination and irradiation"],
    ["Forces", "Scalars and vectors, motion, Newton's laws, momentum, stopping distances"],
    ["Waves", "Wave properties, electromagnetic waves, lenses, sound and ultrasound"],
    ["Magnetism and electromagnetism", "Magnetic fields, motors, generators, transformers"],
    ["Space physics", "Solar system, life cycle of stars, orbital motion, red-shift"]
  ],
  "Biology": [
    ["Cell biology", "Eukaryotic and prokaryotic cells, microscopy, transport, cell division"],
    ["Organisation", "Digestive system, heart and blood, plant tissues, cancer"],
    ["Infection and response", "Pathogens, human defence systems, vaccination, antibiotics, monoclonal antibodies"],
    ["Bioenergetics", "Photosynthesis, limiting factors, aerobic and anaerobic respiration"],
    ["Homeostasis and response", "Nervous system, hormones, blood glucose, kidneys, reproduction, plant hormones"],
    ["Inheritance, variation and evolution", "DNA, genetics, selective breeding, genetic engineering, evolution, classification"],
    ["Ecology", "Ecosystems, sampling, cycles, biodiversity, food security"]
  ],
  "Chemistry": [
    ["Atomic structure and the periodic table", "Atoms, isotopes, electronic structure, periodic trends"],
    ["Bonding, structure and properties", "Ionic, covalent, metallic bonding, states, nanoparticles"],
    ["Quantitative chemistry", "Relative masses, moles, equations, concentration, atom economy"],
    ["Chemical changes", "Reactivity, acids, salts, electrolysis, redox"],
    ["Energy changes", "Exothermic and endothermic reactions, profiles, cells, fuel cells"],
    ["Rate and extent of chemical change", "Rate factors, collision theory, reversible reactions, equilibrium"],
    ["Organic chemistry", "Crude oil, alkanes, alkenes, alcohols, polymers"],
    ["Chemical analysis", "Pure substances, formulations, chromatography, gas tests, instrumental methods"],
    ["Chemistry of the atmosphere", "Earth's atmosphere, greenhouse gases, pollutants"],
    ["Using resources", "Finite resources, water, life-cycle assessment, recycling, Haber process"]
  ],
  "History": [
    ["Migrants in Britain, c800-present", "Medieval, early modern, industrial and modern migration; causes, experiences, impact"],
    ["Notting Hill, c1948-c1970", "Historic environment: Caribbean migration, housing, racism, resistance, community"],
    ["Superpower relations and the Cold War, 1941-91", "Origins of the Cold War, crises, detente, renewed tension, end of the Cold War"],
    ["Weimar and Nazi Germany, 1918-39", "Weimar Republic, Hitler's rise, Nazi control, life in Nazi Germany"],
    ["Edexcel exam skills", "Consequence, narrative account, source utility, interpretation analysis and judgement"]
  ],
  "Geography": [
    ["Natural hazards", "Tectonic hazards, weather hazards, climate"],
    ["Living world", "Ecosystems, rainforests, deserts"],
    ["Physical landscapes", "Rivers, coasts, glaciation"],
    ["Urban issues", "Cities, opportunities, challenges"],
    ["Fieldwork", "Methods, data, presentation, evaluation"]
  ],
  "Information Technology": [
    ["R050: Design tools", "Flowcharts, mind maps, visualisation diagrams, wireframes and planning tools"],
    ["R050: Human Computer Interface", "HCI features, accessibility, usability, user needs and interface design"],
    ["R050: Data and testing", "Data types, validation, verification, test plans and success criteria"],
    ["R050: Cyber-security and legislation", "Threats, prevention, legal responsibilities, privacy and data protection"],
    ["R050: Digital communications and Internet of Everything", "Networks, communication methods, IoE devices, benefits and risks"],
    ["R060: Data manipulation using spreadsheets", "Planning, designing, creating, testing and evaluating spreadsheet solutions"],
    ["R070: Augmented Reality", "AR uses, design, create, test and review an AR model prototype"]
  ],
  "Design Technology": [
    ["Core technical principles", "New and emerging technologies, energy, materials, systems, mechanisms"],
    ["Specialist technical principles", "Material categories, properties, forces, stock forms, scales of production"],
    ["Designing and making principles", "Investigation, specifications, ideas, development, communication, evaluation"],
    ["Maths and science in DT", "Calculations, dimensions, tolerances, material behaviour, energy and forces"],
    ["Non-exam assessment", "Identify, investigate, brief, specification, design ideas, prototype, analyse and evaluate"]
  ]
};

const examBoards = {
  "English Language": "AQA GCSE English Language 8700",
  "English Literature": "AQA GCSE English Literature 8702",
  "Maths": "AQA GCSE Mathematics 8300",
  "Physics": "AQA GCSE Physics 8463, separate science",
  "Biology": "AQA GCSE Biology 8461, separate science",
  "Chemistry": "AQA GCSE Chemistry 8462, separate science",
  "History": "Pearson Edexcel GCSE History: Migration, Weimar Germany and Cold War",
  "Geography": "General GCSE Geography",
  "Information Technology": "OCR Cambridge National in IT J836",
  "Design Technology": "AQA GCSE Design and Technology 8552"
};

const progressKey = "gcse-syllabus-progress";
const params = new URLSearchParams(window.location.search);
const initialSubject = params.get("subject");
const syllabusSubjects = document.querySelector("#syllabusSubjects");
const syllabusTitle = document.querySelector("#syllabusTitle");
const pageTitle = document.querySelector("#pageTitle");
const topicList = document.querySelector("#topicList");
const equationSheetLink = document.querySelector("#equationSheetLink");

let activeSubject = allSubjects.includes(initialSubject) ? initialSubject : "English Language";

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(progressKey)) || {};
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  localStorage.setItem(progressKey, JSON.stringify(progress));
}

function renderSubjectButtons() {
  syllabusSubjects.innerHTML = "";

  allSubjects.forEach((subject) => {
    const button = document.createElement("button");
    button.className = `syllabus-subject-button${subject === activeSubject ? " is-active" : ""}`;
    button.type = "button";
    button.textContent = subject;
    button.addEventListener("click", () => {
      activeSubject = subject;
      render();
    });
    syllabusSubjects.appendChild(button);
  });
}

function renderTopics() {
  const progress = loadProgress();
  const doneTopics = progress[activeSubject] || [];
  const topics = syllabusTopics[activeSubject] || [];
  const isPhysics = activeSubject === "Physics";

  syllabusTitle.textContent = `${activeSubject} - ${examBoards[activeSubject] || "Syllabus"}`;
  pageTitle.textContent = `${activeSubject} Syllabus`;
  history.replaceState(null, "", `syllabus.html?subject=${encodeURIComponent(activeSubject)}`);
  localStorage.setItem("gcse-last-page", `syllabus.html?subject=${encodeURIComponent(activeSubject)}`);
  equationSheetLink.style.display = isPhysics ? "inline-flex" : "none";
  topicList.innerHTML = "";

  if (isPhysics) {
    const equationRow = document.createElement("div");
    equationRow.className = "topic-row equation-topic-row";
    equationRow.innerHTML = `
      <span class="equation-icon" aria-hidden="true">fx</span>
      <div>
        <strong>AQA Physics equation sheet</strong>
        <span>Open the equation sheet on its own page.</span>
      </div>
      <a class="make-note-link" href="physics-equations.html">Open sheet</a>
    `;
    topicList.appendChild(equationRow);
  }

  topics.forEach(([topic, detail]) => {
    const isDone = doneTopics.includes(topic);
    const noteHref = `index.html?subject=${encodeURIComponent(activeSubject)}&topic=${encodeURIComponent(topic)}&detail=${encodeURIComponent(detail)}`;
    const row = document.createElement("div");
    row.className = `topic-row${isDone ? " is-done" : ""}`;
    row.innerHTML = `
      <input type="checkbox" ${isDone ? "checked" : ""} aria-label="Mark ${topic} as revised">
      <div>
        <strong>${topic}</strong>
        <span>${detail}</span>
      </div>
      <a class="make-note-link" href="${noteHref}">Make note</a>
    `;

    row.querySelector("input").addEventListener("change", (event) => {
      const currentProgress = loadProgress();
      const currentDoneTopics = currentProgress[activeSubject] || [];

      if (event.target.checked && !currentDoneTopics.includes(topic)) {
        currentDoneTopics.push(topic);
      }

      if (!event.target.checked) {
        currentProgress[activeSubject] = currentDoneTopics.filter((doneTopic) => doneTopic !== topic);
      } else {
        currentProgress[activeSubject] = currentDoneTopics;
      }

      saveProgress(currentProgress);
      renderTopics();
    });

    topicList.appendChild(row);
  });
}

function render() {
  renderSubjectButtons();
  renderTopics();
}

render();
