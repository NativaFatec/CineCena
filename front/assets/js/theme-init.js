/* Aplica o tema ANTES da primeira pintura e limpa estados presos */
(function () {
  var KEY = "cinecena-theme";
  var theme = "light"; // Força o claro como padrão absoluto

  try {
    var saved = localStorage.getItem(KEY);
    // Se o usuário escolheu explicitamente claro, mantemos. Se estava dark, resetamos para light.
    if (saved === "light") {
      theme = "light";
    } else {
      localStorage.setItem(KEY, "light");
    }
  } catch (e) {}

  document.documentElement.setAttribute("data-theme", theme);
})();