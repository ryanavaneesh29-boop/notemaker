const registerForm = document.querySelector("#registerForm");
const registerError = document.querySelector("#registerError");
const username = document.querySelector("#username");
const email = document.querySelector("#email");
const password = document.querySelector("#password");

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  registerError.textContent = "";

  const response = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: username.value.trim(),
      email: email.value.trim(),
      password: password.value
    })
  });

  const data = await response.json();

  if (!response.ok) {
    registerError.textContent = data.error || "Something went wrong.";
    return;
  }

  window.location.href = "index.html";
});
