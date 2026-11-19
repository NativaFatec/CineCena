(function () {
  const KEY = "cinecena-theme";
  let theme = "light";

  try {
    const savedTheme = localStorage.getItem(KEY);

    if (savedTheme === "dark" || savedTheme === "light") {
      theme = savedTheme;
    } else {
      localStorage.setItem(KEY, theme);
    }
  } catch (error) {
  }

  document.documentElement.setAttribute("data-theme", theme);
})();
