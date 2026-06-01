const resetConfirmForm = document.querySelector("#resetConfirmForm");
const resetConfirmMessage = document.querySelector("#resetConfirmMessage");
const password = document.querySelector("#password");
const token = new URLSearchParams(window.location.search).get("token");

resetConfirmForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  resetConfirmMessage.textContent = "";

  const response = await fetch("/api/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      password: password.value
    })
  });

  const data = await response.json();

  if (!response.ok) {
    resetConfirmMessage.textContent = data.error || "Something went wrong.";
    return;
  }

  resetConfirmMessage.textContent = "Password reset. You can now log in.";
  setTimeout(() => {
    window.location.href = "login.html";
  }, 900);
});
