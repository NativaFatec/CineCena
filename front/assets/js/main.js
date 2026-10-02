const body = document.body;
const themeToggle = document.getElementById("themeToggle");
const mobileThemeToggle = document.getElementById("mobileThemeToggle");

function updateThemeButtons() {
  const isDark = body.classList.contains("theme-dark");

  if (themeToggle) {
    const icon = themeToggle.querySelector(".theme-toggle-icon");

    if (icon) {
      icon.textContent = isDark ? "☼" : "☽";
    }
  }

  if (mobileThemeToggle) {
    const icon = mobileThemeToggle.querySelector(".theme-toggle-icon");

    if (icon) {
      icon.textContent = isDark ? "☼" : "☽";
    }
  }
}

function toggleTheme() {
  body.classList.toggle("theme-light");
  body.classList.toggle("theme-dark");
  updateThemeButtons();
}

if (themeToggle) {
  themeToggle.addEventListener("click", toggleTheme);
}

if (mobileThemeToggle) {
  mobileThemeToggle.addEventListener("click", toggleTheme);
}

updateThemeButtons();