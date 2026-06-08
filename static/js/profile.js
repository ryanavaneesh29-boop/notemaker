const profileForm = document.querySelector("#profileForm");
const profileUsername = document.querySelector("#profileUsername");
const profileEmail = document.querySelector("#profileEmail");
const profileLastLogin = document.querySelector("#profileLastLogin");
const profileMessage = document.querySelector("#profileMessage");

function formatTimestamp(value) {
  if (!value) return "Never logged in";
  const date = new Date(value * 1000);
  return date.toLocaleString();
}

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

async function loadProfile() {
  try {
    const data = await api("/api/me");
    if (!data) return;

    profileUsername.value = data.user.username || "";
    profileEmail.value = data.user.email || "";
    profileLastLogin.textContent = formatTimestamp(data.user.last_login);
  } catch (err) {
    profileMessage.textContent = err.message;
  }
}

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  profileMessage.textContent = "";

  try {
    const username = profileUsername.value.trim();
    const email = profileEmail.value.trim().toLowerCase();
    await api("/api/me", {
      method: "PUT",
      body: JSON.stringify({ username, email }),
    });
    profileMessage.textContent = "Profile saved.";
    profileMessage.style.color = "#0f766e";
  } catch (err) {
    profileMessage.style.color = "#b4234c";
    profileMessage.textContent = err.message;
  }
});

loadProfile();
