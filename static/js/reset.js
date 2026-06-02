const resetForm = document.querySelector("#resetForm");
const resetMessage = document.querySelector("#resetMessage");
const devResetLink = document.querySelector("#devResetLink");
const email = document.querySelector("#email");

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

resetForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  resetMessage.textContent = "";
  devResetLink.textContent = "";
  const emailValue = email.value.trim();

  if (!isValidEmail(emailValue)) {
    resetMessage.textContent = "Please enter a valid email address.";
    email.focus();
    return;
  }

  const response = await fetch("/api/request-password-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: emailValue })
  });

  const data = await response.json();
  resetMessage.textContent = data.message || "If that email has an account, a reset link has been sent.";

  if (data.devLink) {
    devResetLink.innerHTML = `Email is not configured locally, so use this reset link: <a href="${data.devLink}">${data.devLink}</a>`;
  }
});
