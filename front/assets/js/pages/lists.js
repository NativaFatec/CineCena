(() => {
  const App = window.CineCena;
  const UI = window.CineCenaComponents;
  if (!App || !UI) return;

  const { Data, findMovie, escapeHTML } = App;
  const target = document.querySelector("[data-lists-page]");
  const LIMIT = 15;

  function render() {
    if (!target) return;
    target.innerHTML = Data.curatedLists.map((list, index) => {
      const movies = list.movies.map(findMovie).filter(Boolean);
      return `<section class="list-showcase" id="${list.slug}">
        <header class="list-showcase-head accent-${list.accent}">
          <div><h2>${escapeHTML(list.title)}</h2><p>${escapeHTML(list.description)}</p></div>
          <span class="list-number">${String(index + 1).padStart(2, "0")}</span>
        </header>
        <div class="list-showcase-body">${UI.movieRail(`list-${list.slug}`, movies, LIMIT)}${movies.length > LIMIT ? `<div class="section-more"><a class="btn btn-secondary" href="list.html?list=${encodeURIComponent(list.slug)}">Ver mais</a></div>` : ""}</div>
      </section>`;
    }).join("");
  }

  render();
  window.addEventListener("cinecena:movies-updated", render);
})();
