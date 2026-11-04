/* Aplica o tema ANTES da primeira pintura (evita "flash" de tema claro).
   Incluir no <head> de TODAS as páginas, sem defer/async:
   <script src="../assets/js/theme-init.js"></script>   (index.html: assets/js/theme-init.js) */
(function () {
  var KEY = "cinecena-theme";
  var theme = null;
  try { theme = localStorage.getItem(KEY); } catch (e) {}
  if (theme !== "dark" && theme !== "light") {
    theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.setAttribute("data-theme", theme);
})();
