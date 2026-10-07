(() => {
  const App = window.CineCena;
  const UI = window.CineCenaComponents;
  const TMDB = window.CineCenaTMDB;
  if (!App || !UI) return;

  const { Data, state, findMovie, icon, escapeHTML, movieYear, genresText, posterURL, movieKey } = App;
  let featureIndex = 0;
  let featureTimer = null;

  function featureMovies() {
    return Data.featureMovies.map(findMovie).filter(Boolean);
  }

  function renderFeature() {
    const target = document.querySelector("[data-home-feature]");
    if (!target) return;
    const movies = featureMovies();
    if (!movies.length) return;
    const movie = movies[featureIndex % movies.length];
    const poster = posterURL(movie);
    const backdrop = movie.backdrop || TMDB?.backdropUrl(movie.backdrop_path || "") || "";
    target.innerHTML = `
      <div class="feature-carousel-card${backdrop ? " has-backdrop" : ""}" ${backdrop ? `style="background-image:linear-gradient(90deg, rgba(5,24,48,.94), rgba(5,24,48,.58)),url('${backdrop}')"` : ""}>
        <button class="feature-poster" type="button" data-movie-key="${escapeHTML(movieKey(movie))}">
          ${poster ? `<img src="${poster}" alt="Pôster de ${escapeHTML(movie.title)}">` : `<span class="poster-fallback"><strong>${escapeHTML(movie.title)}</strong></span>`}
        </button>
        <div class="feature-carousel-copy">
          <span>${escapeHTML(movieYear(movie))} · ${escapeHTML(genresText(movie))}</span>
          <h2>${escapeHTML(movie.title)}</h2>
          <button class="text-link button-link" type="button" data-movie-key="${escapeHTML(movieKey(movie))}">Abrir filme ${icon("arrow")}</button>
          <div class="feature-dots">${movies.map((_, index) => `<button type="button" class="${index === featureIndex ? "active" : ""}" data-feature-index="${index}" aria-label="Destaque ${index + 1}"></button>`).join("")}</div>
        </div>
      </div>`;
  }

  function startFeatureTimer() {
    clearInterval(featureTimer);
    const movies = featureMovies();
    if (movies.length < 2) return;
    featureTimer = setInterval(() => {
      featureIndex = (featureIndex + 1) % movies.length;
      renderFeature();
    }, 5500);
  }

  function renderPopular() {
    const target = document.querySelector("[data-home-popular]");
    if (!target) return;
    const titles = Data.curatedLists.find(list => list.slug === "mais-vistos")?.movies || [];
    const selected = titles.map(findMovie).filter(Boolean);
    target.innerHTML = UI.movieRail("home-popular-rail", selected.length ? selected : state.movies, 15);
  }

  function renderActivity() {
    const target = document.querySelector("[data-home-activity]");
    if (!target) return;
    target.innerHTML = state.friend
      ? `<div class="activity-grid">${Data.glauberReviews.slice(0, 3).map(UI.reviewActivity).join("")}</div>`
      : `<div class="empty-state social-empty"><div class="empty-icon">${icon("friends")}</div><div><strong>Sua atividade de amigos começa aqui</strong><p>Adicione Glauber Rocha em Amizades para ver as reviews recentes dele nesta área.</p></div><a class="btn btn-secondary" href="friends.html">Encontrar amizades ${icon("arrow")}</a></div>`;
  }

  function renderLists() {
    const target = document.querySelector("[data-home-lists]");
    if (!target) return;
    target.innerHTML = `<div class="rail-wrap list-carousel-wrap">
      <button class="rail-arrow left" type="button" data-rail-prev="home-list-rail" aria-label="Voltar listas">${icon("chevronLeft")}</button>
      <div class="lists-carousel" id="home-list-rail">${Data.curatedLists.map(UI.listCard).join("")}</div>
      <button class="rail-arrow right" type="button" data-rail-next="home-list-rail" aria-label="Avançar listas">${icon("chevronRight")}</button>
    </div>`;
  }

  function render() {
    renderFeature();
    renderPopular();
    renderActivity();
    renderLists();
    startFeatureTimer();
  }

  document.addEventListener("click", event => {
    const dot = event.target.closest("[data-feature-index]");
    if (!dot) return;
    featureIndex = Number(dot.dataset.featureIndex) || 0;
    renderFeature();
    startFeatureTimer();
  });

  render();
  window.addEventListener("cinecena:movies-updated", render);
  window.addEventListener("cinecena:friend-updated", renderActivity);
})();
