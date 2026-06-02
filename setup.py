import os
import shutil
from pathlib import Path

root = Path(r"c:\Users\ryana\OneDrive\Документы\revision")

# HTML file contents with updated paths
templates = {
    "index.html": '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Note Maker</title>
  <link rel="stylesheet" href="/static/css/styles.css">
</head>
<body>
  <aside class="sidebar" aria-label="Subjects">
    <div class="brand">
      <div class="brand-mark" aria-hidden="true">G</div>
      <div>
          <h1>Note Maker</h1>
        <p>Subject revision desk</p>
      </div>
    </div>

    <button class="new-note" id="newNoteButton" type="button">
      <span aria-hidden="true">+</span>
      New note
    </button>

    <a class="add-subject-link" href="subjects.html">
      <span aria-hidden="true">+</span>
      Add subject
    </a>

    <a class="add-subject-link" href="mindmaps.html">Mind Maps</a>

    <a class="add-subject-link" href="/logout">Logout</a>

    <nav class="subject-list" id="subjectList" aria-label="GCSE subjects"></nav>
  </aside>

  <main class="workspace">
    <section class="topbar" aria-label="Current subject tools">
      <div>
        <p class="eyebrow">Current subject</p>
        <h2 id="subjectTitle">English Language</h2>
      </div>
      <div class="topbar-tools">
        <a class="my-notes-button" id="myNotesLink" href="notes.html?subject=English%20Language">My notes</a>
        <a class="syllabus-link" id="syllabusLink" href="syllabus.html?subject=English%20Language">View syllabus</a>
      </div>
    </section>

    <section class="desk">
      <article class="editor-panel">
        <form id="noteForm">
          <div class="form-row two-col">
            <div>
              <label for="noteTitle">Title</label>
              <input id="noteTitle" type="text" placeholder="Paper 1 creative writing plan" required>
            </div>
            <div>
              <label for="noteTopic">Topic</label>
              <select id="noteTopic"></select>
            </div>
          </div>

          <div class="form-row">
            <label for="noteContent">Notes</label>
            <div class="doc-shell">
              <div class="doc-toolbar" aria-label="Document tools">
                <div class="toolbar-group">
                  <button type="button" data-command="undo" title="Undo">Undo</button>
                  <button type="button" data-command="redo" title="Redo">Redo</button>
                </div>
                <div class="toolbar-group">
                  <button type="button" data-command="bold" title="Bold"><strong>B</strong></button>
                  <button type="button" data-command="italic" title="Italic"><em>I</em></button>
                  <button type="button" data-command="underline" title="Underline"><span class="underline-tool">U</span></button>
                  <button type="button" data-command="superscript" title="Superscript">x<sup>2</sup></button>
                  <button type="button" data-command="subscript" title="Subscript">x<sub>2</sub></button>
                </div>
                <div class="toolbar-group">
                  <button type="button" data-command="insertUnorderedList" title="Bullet list">Bullets</button>
                  <button type="button" data-command="insertOrderedList" title="Numbered list">1. List</button>
                  <button type="button" data-command="justifyLeft" title="Align left">Left</button>
                  <button type="button" data-command="justifyCenter" title="Centre">Centre</button>
                  <button type="button" data-command="justifyRight" title="Align right">Right</button>
                </div>
                <div class="toolbar-group">
                  <button type="button" data-command="formatBlock" data-value="h3" title="Heading">Heading</button>
                  <button type="button" data-command="formatBlock" data-value="p" title="Normal text">Text</button>
                  <select id="fontSizeSelect" title="Font size" aria-label="Font size">
                    <option value="">Size</option>
                    <option value="2">Small</option>
                    <option value="3">Normal</option>
                    <option value="5">Large</option>
                    <option value="6">Title</option>
                  </select>
                </div>
                <div class="toolbar-group">
                  <label class="colour-tool" for="textColour">Text <input id="textColour" type="color" value="#17202a"></label>
                  <label class="colour-tool" for="highlightColour">Highlight <input id="highlightColour" type="color" value="#fff2a8"></label>
                  <button type="button" data-command="removeFormat" title="Clear formatting">Clear</button>
                </div>
                <div class="toolbar-group">
                  <select id="mathInsertSelect" title="Insert maths or science" aria-label="Insert maths or science">
                    <option value="">Insert</option>
                    <option value="^2">Power 2</option>
                    <option value="^3">Power 3</option>
                    <option value="sqrt()">Square root</option>
                    <option value="pi">Pi</option>
                    <option value="+/-">Plus/minus</option>
                    <option value="&lt;=">Less than or equal</option>
                    <option value="&gt;=">Greater than or equal</option>
                    <option value="E = mc^2">E = mc^2</option>
                    <option value="v^2 - u^2 = 2as">v^2 - u^2 = 2as</option>
                  </select>
                </div>
              </div>
              <div class="document-page" id="noteContent" contenteditable="true" role="textbox" aria-multiline="true" data-placeholder="Write your English Language revision notes here..."></div>
            </div>
          </div>

          <div class="form-row two-col">
            <div>
              <label for="notePriority">Priority</label>
              <select id="notePriority">
                <option value="Core">Core</option>
                <option value="Needs practice">Needs practice</option>
                <option value="Exam ready">Exam ready</option>
              </select>
            </div>
            <div>
              <label for="noteExamDate">Exam date</label>
              <input id="noteExamDate" type="date">
            </div>
          </div>

          <div class="actions">
            <button class="secondary" id="deleteNoteButton" type="button">Delete</button>
            <button class="secondary" id="clearFormButton" type="button">Clear</button>
            <button class="primary" type="submit">Save note</button>
          </div>
        </form>
      </article>
    </section>
  </main>

  <script src="/static/js/page-state.js"></script>
  <script src="/static/js/script.js"></script>
</body>
</html>''',
    "login.html": '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - Note Maker</title>
  <link rel="stylesheet" href="/static/css/styles.css">
</head>
<body class="subject-page">
  <main class="login-page">
    <section class="login-card">
      <div class="brand login-brand">
        <div class="brand-mark" aria-hidden="true">G</div>
        <div>
          <h1>Note Maker</h1>
          <p>Sign in to save notes to your account</p>
        </div>
      </div>

      <form id="loginForm">
        <div>
          <label for="email">Email</label>
          <input id="email" type="email" autocomplete="email" required>
        </div>
        <div>
          <label for="password">Password</label>
          <input id="password" type="password" autocomplete="current-password" required>
        </div>
        <p class="login-error" id="loginError" role="alert"></p>
        <div class="actions">
          <button class="secondary" id="resetPasswordButton" type="button">Reset password</button>
          <button class="secondary" id="createAccountButton" type="button">Create account</button>
          <button class="primary" type="submit">Login</button>
        </div>
      </form>
    </section>
  </main>

  <script src="/static/js/login.js"></script>
</body>
</html>'''
}

# Create directories
print("Creating directories...")
os.makedirs(root / "data", exist_ok=True)
os.makedirs(root / "templates", exist_ok=True)
os.makedirs(root / "static" / "css", exist_ok=True)
os.makedirs(root / "static" / "js", exist_ok=True)
print("✓ Directories created")

# Write template files
print("\nWriting template files...")
for name, content in templates.items():
    path = root / "templates" / name
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✓ {name} created")

print("\n✓ Script complete!")
