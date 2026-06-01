const loginForm = document.querySelector("#loginForm");
const loginError = document.querySelector("#loginError");
const email = document.querySelector("#email");
const password = document.querySelector("#password");
const createAccountButton = document.querySelector("#createAccountButton");
const resetPasswordButton = document.querySelector("#resetPasswordButton");

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

createAccountButton.addEventListener("click", () => {
  window.location.href = "register.html";
});

resetPasswordButton.addEventListener("click", () => {
  window.location.href = "reset.html";
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginError.textContent = "";
  const emailValue = email.value.trim();

  if (!isValidEmail(emailValue)) {
    loginError.textContent = "Please enter a valid email address.";
    email.focus();
    return;
  }

  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: emailValue,
      password: password.value
    })
  });

  const data = await response.json();

  if (!response.ok) {
    loginError.textContent = data.error || "Something went wrong.";
    return;
  }

  window.location.href = "index.html";
});
