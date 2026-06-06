const deleteAccountButton = document.querySelector("#deleteAccountButton");
const deleteAccountMessage = document.querySelector("#deleteAccountMessage");

if (deleteAccountButton) {
  deleteAccountButton.addEventListener("click", async () => {
    if (!window.confirm("This will permanently delete your account and all saved data. Continue?")) {
      return;
    }

    deleteAccountButton.disabled = true;
    deleteAccountMessage.textContent = "Deleting account...";

    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not delete account.");
      }

      window.location.href = "/login.html";
    } catch (error) {
      deleteAccountButton.disabled = false;
      deleteAccountMessage.textContent = error.message;
    }
  });
}
