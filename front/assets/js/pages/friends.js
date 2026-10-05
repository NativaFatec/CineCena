(() => {
  const App = window.CineCena;
  const UI = window.CineCenaComponents;
  if (!App || !UI) return;

  const { Data, state, escapeHTML, icon, setFriend } = App;
  const target = document.querySelector("[data-friend-results]");
  const search = document.querySelector("[data-friend-search]");

  function render() {
    if (!target) return;
    const term = (search?.value || "").trim().toLocaleLowerCase("pt-BR");
    const matches = !term || `${Data.glauber.name} ${Data.glauber.handle}`.toLocaleLowerCase("pt-BR").includes(term);

    if (!matches) {
      target.innerHTML = `<div class="empty-state"><div class="empty-icon">${icon("search")}</div><div><strong>Nenhum perfil encontrado</strong><p>Nesta fase, Glauber Rocha é o perfil social demonstrativo disponível na busca.</p></div></div>`;
      return;
    }

    target.innerHTML = `<article class="friend-card">
      <div class="friend-card-main">${UI.profileAvatar("xl")}<div><h2>${Data.glauber.name}</h2><small>${Data.glauber.handle}</small><p>${escapeHTML(Data.glauber.description)}</p></div></div>
      <div class="friend-card-stats"><span><strong>${Data.glauber.friends}</strong> amigos</span><span><strong>${Data.glauber.watched}</strong> filmes</span><span><strong>${Data.glauber.reviews}</strong> reviews</span></div>
      <div class="friend-card-actions"><button class="btn ${state.friend ? "btn-secondary" : "btn-primary"}" type="button" data-toggle-friend>${state.friend ? "Remover amizade" : `${icon("plus")} Adicionar amizade`}</button><a class="btn btn-ghost" href="profileusers.html">Ver perfil</a></div>
    </article>`;

    target.querySelector("[data-toggle-friend]")?.addEventListener("click", () => {
      setFriend(!state.friend);
      render();
    });
  }

  search?.addEventListener("input", render);
  render();
  window.addEventListener("cinecena:movies-updated", render);
})();
