/* Controle global do tema CineCena.
   O tema inicial é definido por theme-init.js no <head>. */
(() => {
  const root = document.documentElement;
  const key = "cinecena-theme";

  function currentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function updateButtons() {
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const dark = currentTheme() === "dark";
      const icon = button.querySelector(".theme-toggle-icon");
      if (icon) icon.textContent = dark ? "☼" : "☽";
      button.setAttribute("aria-pressed", String(dark));
      button.setAttribute("aria-label", dark ? "Ativar tema claro" : "Ativar tema escuro");
      button.title = dark ? "Tema claro" : "Tema escuro";
    });
  }

  function toggleTheme() {
    const next = currentTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem(key, next); } catch (_) {}
    updateButtons();
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-theme-toggle]");
    if (button) toggleTheme();
  });

  document.addEventListener("DOMContentLoaded", () => {
    // Cria o botão nas páginas com cabeçalho compartilhado, sem duplicar controles.
    const header = document.querySelector(".header-inner");
    if (header && !header.querySelector("[data-theme-toggle]")) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "theme-toggle";
      button.setAttribute("data-theme-toggle", "");
      button.innerHTML = '<span class="theme-toggle-icon" aria-hidden="true">☽</span>';
      const nav = header.querySelector(".header-actions, .header-nav, nav");
      (nav || header).appendChild(button);
    }
    updateButtons();
  });
})();