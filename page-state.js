(function () {
  const key = "gcse-last-page";
  const fileName = window.location.pathname.split("/").pop() || "index.html";
  const currentPage = `${fileName}${window.location.search}${window.location.hash}`;
  const internalNavKey = "gcse-internal-navigation";
  const cameFromInternalLink = sessionStorage.getItem(internalNavKey) === "true";

  sessionStorage.removeItem(internalNavKey);

  if (fileName === "index.html" && !window.location.search && !window.location.hash && !cameFromInternalLink) {
    const lastPage = localStorage.getItem(key);

    if (lastPage && !lastPage.startsWith("index.html")) {
      window.location.replace(lastPage);
      return;
    }
  }

  localStorage.setItem(key, currentPage);

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;

    const destination = new URL(link.href, window.location.href);
    if (destination.origin === window.location.origin && destination.pathname.endsWith(".html")) {
      sessionStorage.setItem(internalNavKey, "true");
    }
  });
})();
