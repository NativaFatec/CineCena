(() => {
  const App = window.CineCena;
  const UI = window.CineCenaComponents;
  if (!App || !UI) return;

  const { Data, state, findMovie, initials, escapeHTML, icon, setFriend } = App;
  const params = new URLSearchParams(window.location.search);
  const creatorKey = params.get("creator");

  function renderCreator(person) {
    document.querySelector("[data-user-profile]").innerHTML = `
      <section class="profile-hero shell">
        <span class="person-avatar xxl">${initials(person.name)}</span>
        <div class="profile-identity"><h1>${escapeHTML(person.name)}</h1><span>${escapeHTML(person.handle)}</span><p>${escapeHTML(person.description)}</p></div>
      </section>
      <section class="shell profile-stats"><div><strong>0</strong><span>Amigos</span></div><div><strong>0</strong><span>Filmes assistidos</span></div><div><strong>0</strong><span>Reviews</span></div><div><strong>0</strong><span>Listas</span></div></section>
      <section class="shell profile-content"><div class="section-heading"><div><h2>Atividade</h2><p>O perfil da equipe está preparado para receber dados reais futuramente.</p></div></div><div class="empty-state"><div class="empty-icon">${icon("user")}</div><div><strong>Perfil da equipe</strong><p>Nesta etapa, o perfil serve como destino direto para os links da página Sobre.</p></div></div></section>`;
  }

  function renderGlauber() {
    const favorites = Data.glauber.favorites.map(findMovie).filter(Boolean);
    document.querySelector("[data-user-profile]").innerHTML = `
      <section class="profile-hero shell">
        ${UI.profileAvatar("xxl")}
        <div class="profile-identity"><h1>${Data.glauber.name}</h1><span>${Data.glauber.handle}</span><p>${escapeHTML(Data.glauber.description)}</p></div>
        <div class="profile-hero-actions"><button class="btn ${state.friend ? "btn-secondary" : "btn-primary"}" type="button" data-public-friend>${state.friend ? "Remover amizade" : `${icon("plus")} Adicionar amizade`}</button></div>
      </section>
      <section class="shell profile-stats"><div><strong>${Data.glauber.friends}</strong><span>Amigos</span></div><div><strong>${Data.glauber.watched}</strong><span>Filmes assistidos</span></div><div><strong>${Data.glauber.reviews}</strong><span>Reviews</span></div><div><strong>3</strong><span>Listas</span></div></section>
      <section class="shell profile-content">
        <div class="profile-section"><div class="section-heading"><div><h2>4 filmes favoritos</h2></div></div><div class="profile-movie-grid">${favorites.map(movie => UI.movieCard(movie, { compact: true })).join("")}</div></div>
        <div class="profile-section"><div class="section-heading"><div><h2>Reviews</h2></div></div><div class="feed-stream">${Data.glauberReviews.map(review => UI.feedEntryFromReview(review)).join("")}</div></div>
        <div class="profile-section"><div class="section-heading"><div><h2>Listas</h2></div></div><div class="profile-list-summary"><strong>Cinema brasileiro essencial</strong><span>12 filmes</span></div><div class="profile-list-summary"><strong>Filmes para rever</strong><span>8 filmes</span></div></div>
      </section>`;

    document.querySelector("[data-public-friend]")?.addEventListener("click", () => {
      setFriend(!state.friend);
      renderGlauber();
    });
  }

  function render() {
    const creator = creatorKey ? Data.creators[creatorKey] : null;
    if (creator) renderCreator(creator);
    else renderGlauber();
  }

  render();
  window.addEventListener("cinecena:movies-updated", render);
})();
