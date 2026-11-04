(() => {
  const App = window.CineCena;
  const UI = window.CineCenaComponents;
  if (!App || !UI) return;

  const { Data, state, collectionMovies, findMovie, genresText, movieYear, escapeHTML } = App;
  const params = new URLSearchParams(window.location.search);
  const catalog = document.querySelector("[data-list-catalog]");
  const search = document.querySelector("[data-list-search]");
  const title = document.querySelector("[data-list-title]");
  const description = document.querySelector("[data-list-description]");
  const count = document.querySelector("[data-list-count]");

  function requestedCollection() {
    const listSlug = params.get("list");
    const type = params.get("type");
    const source = params.get("source");

    if (listSlug) {
      const list = Data.curatedLists.find(item => item.slug === listSlug);
      return {
        title: list?.title || "Lista",
        description: list?.description || "Filmes desta lista.",
        movies: (list?.movies || []).map(findMovie).filter(Boolean)
      };
    }

    if (type === "favorites") return { title: "Filmes favoritos", description: "Os filmes escolhidos para representar seu gosto.", movies: collectionMovies("favorites") };
    if (type === "loved") return { title: "Filmes curtidos", description: "Todos os filmes que você marcou com “Amei”, do mais recente ao mais antigo.", movies: collectionMovies("loved") };
    if (type === "watched") return { title: "Filmes assistidos", description: "Seu histórico de filmes assistidos, do mais recente ao mais antigo.", movies: collectionMovies("watched") };
    if (type === "listed") return { title: "Minha lista", description: "Todos os filmes adicionados à sua lista.", movies: collectionMovies("listed") };
    if (source === "home") {
      const list = Data.curatedLists.find(item => item.slug === "mais-vistos");
      return { title: "O que está movimentando o CineCena", description: "Filmes em destaque na página inicial.", movies: (list?.movies || []).map(findMovie).filter(Boolean) };
    }

    return { title: "Filmes", description: "Coleção selecionada do CineCena.", movies: state.movies };
  }

  function render() {
    if (!catalog) return;
    const request = requestedCollection();
    const term = String(search?.value || "").trim().toLocaleLowerCase("pt-BR");
    const movies = request.movies.filter(movie => !term || `${movie.title} ${movieYear(movie)} ${genresText(movie, 4)}`.toLocaleLowerCase("pt-BR").includes(term));
    if (title) title.textContent = request.title;
    if (description) description.textContent = request.description;
    if (count) count.textContent = `${movies.length} ${movies.length === 1 ? "filme" : "filmes"}`;
    catalog.innerHTML = movies.length
      ? movies.map(movie => UI.movieCard(movie)).join("")
      : `<div class="empty-state"><div><strong>Nenhum filme encontrado</strong><p>Tente outro termo ou volte para o catálogo.</p></div></div>`;
  }

  search?.addEventListener("input", render);
  render();
  window.addEventListener("cinecena:movies-updated", render);
  window.addEventListener("cinecena:movie-state-updated", render);
  window.addEventListener("cinecena:favorites-updated", render);
})();
