(() => {
  const App = window.CineCena;
  const UI = window.CineCenaComponents;
  if (!App || !UI) return;

  const { TMDB, state, findMovie, escapeHTML, movieYear, posterURL, genresText, icon, movieStateFor, updateMovieState } = App;
  const params = new URLSearchParams(window.location.search);
  const requestedTitle = params.get("movie") || "Cidade de Deus";
  const target = document.querySelector("[data-movie-page]");
  let detailsCache = null;
  let loadingFor = "";

  function director(details, movie) {
    return details?.credits?.crew?.find(person => person.job === "Director")?.name
      || (movie.title === "Cidade de Deus" ? "Fernando Meirelles, Kátia Lund" : "Informação disponível via TMDB");
  }

  function render(movie, detailed = movie) {
    if (!target || !movie) return;
    const interaction = movieStateFor(movie);
    const poster = posterURL(detailed) || posterURL(movie);
    const backdrop = detailed.backdrop || TMDB.backdropUrl(detailed.backdrop_path || "");
    const genres = genresText(detailed, 6) || genresText(movie, 6);
    const runtime = detailed.runtime ? `${Math.floor(detailed.runtime / 60)}h ${String(detailed.runtime % 60).padStart(2, "0")}min` : "—";
    const cast = detailed.credits?.cast?.slice(0, 12) || [];
    const companies = detailed.production_companies?.slice(0, 5).map(company => company.name).join(", ") || "—";
    const synopsis = detailed.overview || movie.overview || "Sinopse indisponível nesta demonstração.";

    target.innerHTML = `
      <section class="movie-page-banner ${backdrop ? "has-image" : ""}" ${backdrop ? `style="background-image:linear-gradient(90deg, rgba(5,24,48,.94), rgba(5,24,48,.48)),url('${backdrop}')"` : ""}>
        <div class="shell movie-page-banner-inner">
          <div class="movie-page-poster">${poster ? `<img src="${poster}" alt="Pôster de ${escapeHTML(movie.title)}">` : `<span class="poster-fallback"><strong>${escapeHTML(movie.title)}</strong><i>${movieYear(movie)}</i></span>`}</div>
          <div class="movie-page-heading">
            <div class="movie-page-meta"><span>${escapeHTML(movieYear(movie))}</span><span>${escapeHTML(runtime)}</span><span>${escapeHTML(genres)}</span></div>
            <h1>${escapeHTML(movie.title)}</h1>
            <p><strong>Direção:</strong> ${escapeHTML(director(detailed, movie))}</p>
            <div class="movie-page-actions">
              <button class="movie-action ${interaction.watched ? "active" : ""}" type="button" data-page-movie-action="watched">${icon("eye")} ${interaction.watched ? "Assistido" : "Marcar como assistido"}</button>
              <button class="movie-action ${interaction.loved ? "active love" : ""}" type="button" data-page-movie-action="loved">${icon("heart")} ${interaction.loved ? "Curtido" : "Amei"}</button>
              <button class="movie-action ${interaction.listed ? "active" : ""}" type="button" data-page-movie-action="listed">${icon("bookmark")} ${interaction.listed ? "Na lista" : "Adicionar em lista"}</button>
              <button class="movie-action primary" type="button" data-page-review>${icon("pen")} Criar review</button>
            </div>
          </div>
        </div>
      </section>
      <section class="shell movie-page-body">
        <div class="movie-page-main-copy">
          <section><h2>Sinopse</h2><p>${escapeHTML(synopsis)}</p></section>
          <section><h2>Elenco</h2>${cast.length ? `<div class="cast-grid">${cast.map(person => `<div class="cast-person"><strong>${escapeHTML(person.name)}</strong><span>${escapeHTML(person.character || "")}</span></div>`).join("")}</div>` : `<p>O elenco completo será exibido quando o TMDB estiver conectado.</p>`}</section>
        </div>
        <aside class="movie-page-facts">
          <div><small>Direção</small><strong>${escapeHTML(director(detailed, movie))}</strong></div>
          <div><small>Gêneros</small><strong>${escapeHTML(genres)}</strong></div>
          <div><small>Duração</small><strong>${escapeHTML(runtime)}</strong></div>
          <div><small>Produção</small><strong>${escapeHTML(companies)}</strong></div>
          <div><small>Título original</small><strong>${escapeHTML(detailed.original_title || movie.title)}</strong></div>
          <div><small>Lançamento</small><strong>${escapeHTML(detailed.release_date || String(movieYear(movie)))}</strong></div>
        </aside>
      </section>
      <section class="shell movie-friend-section"><div><h2>Atividade dos amigos</h2><p>Reviews e interações das suas amizades com este filme aparecerão aqui.</p></div></section>`;

    target.querySelectorAll("[data-page-movie-action]").forEach(button => {
      button.addEventListener("click", () => {
        updateMovieState(movie, button.dataset.pageMovieAction);
        render(movie, detailed);
      });
    });
    target.querySelector("[data-page-review]")?.addEventListener("click", () => UI.openReviewModal(movie.title));
  }

  async function load() {
    const movie = findMovie(requestedTitle) || state.movies.find(item => item.title.toLocaleLowerCase("pt-BR") === requestedTitle.toLocaleLowerCase("pt-BR"));
    if (!movie) {
      if (target) target.innerHTML = `<div class="shell page-intro"><div class="page-intro-copy"><h1>Filme não encontrado</h1><p>Volte ao catálogo e escolha outro título.</p></div></div>`;
      return;
    }

    render(movie, detailsCache || movie);
    const id = Number(movie.id);
    if (!TMDB.isConfigured() || !Number.isInteger(id) || loadingFor === movie.title) return;
    loadingFor = movie.title;
    try {
      detailsCache = await TMDB.getMovieDetails(id);
      render(movie, { ...detailsCache, title: movie.title, year: movie.year });
    } catch (error) {
      console.warn("CineCena: detalhes completos do filme indisponíveis.", error);
    }
  }

  load();
  window.addEventListener("cinecena:movies-updated", () => { detailsCache = null; loadingFor = ""; load(); });
})();
