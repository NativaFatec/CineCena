(() => {
  const App = window.CineCena;
  const UI = window.CineCenaComponents;
  if (!App || !UI) return;

  const { state, movieStateFor, initials, icon, escapeHTML } = App;

  function stats() {
    const interactions = state.movies.filter(movie => movieStateFor(movie).watched);
    const loved = state.movies.filter(movie => movieStateFor(movie).loved);
    const listed = state.movies.filter(movie => movieStateFor(movie).listed);
    return { watched: interactions, loved, listed };
  }

  function render() {
    const current = stats();
    const avatar = document.querySelector("[data-profile-avatar]");
    if (avatar) avatar.textContent = initials(state.profile.name);
    const name = document.querySelector("[data-profile-name]");
    const description = document.querySelector("[data-profile-description]");
    if (name) name.textContent = state.profile.name;
    if (description) description.textContent = state.profile.description;

    const counters = document.querySelector("[data-profile-counters]");
    if (counters) counters.innerHTML = `
      <div><strong>${state.friend ? 1 : 0}</strong><span>Amigos</span></div>
      <div><strong>${current.watched.length}</strong><span>Filmes assistidos</span></div>
      <div><strong>${state.reviews.length}</strong><span>Reviews</span></div>
      <div><strong>${current.listed.length ? 1 : 0}</strong><span>Listas</span></div>`;

    const favorites = document.querySelector("[data-profile-favorites]");
    if (favorites) favorites.innerHTML = current.loved.length
      ? `<div class="profile-movie-grid">${current.loved.slice(0, 4).map(movie => UI.movieCard(movie, { compact: true })).join("")}</div>`
      : empty("Nenhum filme favorito ainda", "Use “Amei” em um filme para começar a construir seus favoritos.", `<a class="btn btn-secondary" href="movies.html">Adicionar filmes</a>`);

    const reviews = document.querySelector("[data-profile-reviews]");
    if (reviews) reviews.innerHTML = state.reviews.length
      ? `<div class="feed-stream">${state.reviews.map(review => UI.feedEntryFromReview(review, true)).join("")}</div>`
      : empty("Nenhuma review publicada", "Quando você escrever uma review, ela aparecerá aqui.", `<button class="btn btn-secondary" type="button" data-new-review>Adicionar review</button>`);

    const lists = document.querySelector("[data-profile-lists]");
    if (lists) lists.innerHTML = current.listed.length
      ? `<div class="profile-list-summary"><strong>Minha lista</strong><span>${current.listed.length} ${current.listed.length === 1 ? "filme" : "filmes"}</span></div><div class="profile-movie-grid">${current.listed.slice(0, 4).map(movie => UI.movieCard(movie, { compact: true })).join("")}</div>`
      : empty("Nenhuma lista criada", "Adicione filmes à sua lista e organize suas próximas sessões.", `<a class="btn btn-secondary" href="movies.html">Adicionar filmes</a>`);
  }

  function empty(title, text, action) {
    return `<div class="empty-state slim"><div class="empty-icon">${icon("plus")}</div><div><strong>${escapeHTML(title)}</strong><p>${escapeHTML(text)}</p></div>${action}</div>`;
  }

  render();
  window.addEventListener("cinecena:profile-updated", render);
  window.addEventListener("cinecena:social-updated", render);
  window.addEventListener("cinecena:movies-updated", render);
  window.addEventListener("cinecena:movie-state-updated", render);
  window.addEventListener("cinecena:friend-updated", render);
})();
