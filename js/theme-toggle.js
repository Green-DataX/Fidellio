(function () {
  var STORAGE_KEY = "fideliio-theme";

  function getTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}
    syncToggleUI();
  }

  function syncToggleUI() {
    var btn = document.getElementById("navThemeToggle");
    if (!btn) return;
    var dark = getTheme() === "dark";
    btn.setAttribute("aria-pressed", dark ? "true" : "false");
    var moon = btn.querySelector(".nav-theme-icon--moon");
    var sun = btn.querySelector(".nav-theme-icon--sun");
    if (moon) moon.classList.toggle("is-visible", !dark);
    if (sun) sun.classList.toggle("is-visible", dark);
  }

  window.toggleTheme = function () {
    applyTheme(getTheme() === "dark" ? "light" : "dark");
  };

  document.addEventListener("DOMContentLoaded", syncToggleUI);
  document.addEventListener("fideliio:components-loaded", syncToggleUI);
})();
