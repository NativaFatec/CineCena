(() => {
  const App = window.CineCena;
  const UI = window.CineCenaComponents;
  if (!App || !UI) return;

  const { Data, state, findMovie, icon } = App;

  function renderFeature() {
    const target = document.querySelector("[data-home-feature]");
    if (!target) return;
    const city = findMovie("Cidade de Deus") || state.movies[0];
    target.innerHTML = `
      <div class="hero-feature-poster">${UI.movieCard(city, { compact: true })}</div>
      <div class="hero-feature-copy">
        <h2>Cidade de Deus</h2>
        <p>Abra o filme para ver sinopse, direção, elenco, gêneros e as ações sociais do CineCena.</p>
        <button class="text-action" type="button" data-movie-key="${App.escapeHTML(App.movieKey(city))}">Abrir filme ${icon("arrow")}</button>
      </div>`;
  }

  function renderPopular() {
    const target = document.querySelector("[data-home-popular]");
    if (!target) return;
    const titles = Data.curatedLists.find(list => list.slug === "mais-vistos")?.movies || [];
    const selected = titles.map(findMovie).filter(Boolean);
    target.innerHTML = UI.movieRail("home-popular-rail", selected.length ? selected : state.movies, 12);
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
  }

  render();
  window.addEventListener("cinecena:movies-updated", render);
  window.addEventListener("cinecena:friend-updated", renderActivity);
})();
