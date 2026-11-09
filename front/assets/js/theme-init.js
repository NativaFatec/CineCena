/* Aplica o tema ANTES da primeira pintura (evita "flash" de tema claro/escuro).
   Incluir no <head> de TODAS as páginas, sem defer/async:
   <script src="assets/js/theme-init.js"></script> */
(function () {
  var KEY = "cinecena-theme";
  var theme = "light"; // Define o branco/claro como padrão absoluto

  try {
    var saved = localStorage.getItem(KEY);
    // Se o usuário já tiver escolhido explicitamente antes, respeitamos a escolha
    if (saved === "dark" || saved === "light") {
      theme = saved;
    }
  } catch (e) {}

  document.documentElement.setAttribute("data-theme", theme);
})();