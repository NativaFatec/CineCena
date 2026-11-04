(() => {
  const App = window.CineCena;
  const UI = window.CineCenaComponents;
  if (!App || !UI) return;

  const { state, genresText, movieYear } = App;
  const catalog = document.querySelector("[data-movie-catalog]");
  const search = document.querySelector("[data-movie-search]");
  const count = document.querySelector("[data-movie-count]");
  const status = document.querySelector("[data-tmdb-status]");

  function filteredMovies() {
    const term = (search?.value || "").trim().toLocaleLowerCase("pt-BR");
    if (!term) return state.movies;
    return state.movies.filter(movie => `${movie.title} ${movieYear(movie)} ${genresText(movie, 4)}`.toLocaleLowerCase("pt-BR").includes(term));
  }

  function render() {
    if (!catalog) return;
    const movies = filteredMovies();
    catalog.innerHTML = movies.map(movie => UI.movieCard(movie)).join("");
    if (count) count.textContent = `${movies.length} ${movies.length === 1 ? "filme" : "filmes"}`;
    if (status) {
      status.classList.toggle("success", state.tmdbReady);
      status.innerHTML = `<i></i>${state.tmdbReady ? "TMDB conectado" : "Dados locais"}`;
    }
  }

  search?.addEventListener("input", render);
  render();
  window.addEventListener("cinecena:movies-updated", render);
})();
