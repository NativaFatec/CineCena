(() => {
  const App = window.CineCena;
  if (!App) return;

  const {
    Data, TMDB, state, escapeHTML, movieYear, posterURL, initials, movieKey,
    genresText, icon, movieStateFor, updateMovieState, addFavorite, removeFavoriteAt, mountModal,
    closeModal, toast, savePost, saveReview, saveProfile
  } = App;

  function moviePageURL(movie) {
    return `movie.html?movie=${encodeURIComponent(movie.title)}`;
  }

  function movieCard(movie, options = {}) {
    const poster = posterURL(movie);
    const compact = options.compact ? " compact" : "";
    return `<button class="movie-card${compact}" type="button" data-movie-key="${escapeHTML(movieKey(movie))}" aria-label="Abrir ${escapeHTML(movie.title)}">
      <span class="movie-poster">
        ${poster
          ? `<img src="${poster}" alt="Pôster de ${escapeHTML(movie.title)}" loading="lazy">`
          : `<span class="poster-fallback"><small>CineCena</small><strong>${escapeHTML(movie.title)}</strong><i>${escapeHTML(movieYear(movie))}</i></span>`}
      </span>
      <span class="movie-card-copy">
        <strong>${escapeHTML(movie.title)}</strong>
        <small>${escapeHTML(movieYear(movie))}</small>
        <span class="movie-card-genres">${escapeHTML(genresText(movie))}</span>
      </span>
    </button>`;
  }

  function movieRail(id, movies, limit = 15) {
    return `<div class="rail-wrap">
      <button class="rail-arrow left" type="button" data-rail-prev="${id}" aria-label="Voltar">${icon("chevronLeft")}</button>
      <div class="movie-rail" id="${id}">${movies.slice(0, limit).map(movie => movieCard(movie)).join("")}</div>
      <button class="rail-arrow right" type="button" data-rail-next="${id}" aria-label="Avançar">${icon("chevronRight")}</button>
    </div>`;
  }

  function profileAvatar(size = "lg", person = Data.glauber) {
    if (person === Data.glauber && state.glauberPhoto) {
      return `<span class="person-avatar ${size}"><img src="${state.glauberPhoto}" alt="Foto de Glauber Rocha"></span>`;
    }
    return `<span class="person-avatar ${size}">${initials(person.name)}</span>`;
  }

  function reviewMovieCard(review, options = {}) {
    const movie = state.movies.find(item => item.title === review.movie);
    const poster = movie ? posterURL(movie) : "";
    const year = review.year || (movie ? movieYear(movie) : "");
    const featured = options.featured ? " featured" : "";
    return `<button class="review-movie-card${featured}" type="button" ${movie ? `data-movie-key="${escapeHTML(movieKey(movie))}"` : "disabled"}>
      <span class="review-movie-poster">${poster ? `<img src="${poster}" alt="Pôster de ${escapeHTML(review.movie)}" loading="lazy">` : `<span>${escapeHTML((review.movie || "C").slice(0, 1))}</span>`}</span>
      <span class="review-movie-copy"><strong>${escapeHTML(review.movie)}</strong><small>${escapeHTML(year)}</small></span>
    </button>`;
  }

  function reviewActivity(review) {
    return `<article class="activity-card">
      <div class="activity-person">${profileAvatar("sm")}<div><a href="profileusers.html"><strong>${Data.glauber.name}</strong></a><small>${escapeHTML(review.date)}</small></div></div>
      <div class="activity-type">publicou uma review</div>
      <div class="review-content-layout">${reviewMovieCard(review)}<p>${escapeHTML(review.text)}</p></div>
      ${review.loved ? `<div class="activity-meta"><span class="loved">${icon("heart")} Curtiu este filme</span></div>` : ""}
    </article>`;
  }

  function listCard(list) {
    const listMovies = list.movies.map(title => state.movies.find(movie => movie.title === title)).filter(Boolean).slice(0, 4);
    return `<a class="list-card accent-${list.accent}" href="list.html?list=${encodeURIComponent(list.slug)}">
      <div class="poster-stack">${listMovies.map(movie => {
        const url = posterURL(movie);
        return url ? `<img src="${url}" alt="" loading="lazy">` : `<span>${escapeHTML(movie.title.slice(0, 1))}</span>`;
      }).join("") || `<span>C</span><span>C</span><span>B</span>`}</div>
      <h3>${escapeHTML(list.title)}</h3>
      <p>${escapeHTML(list.description)}</p>
      <span class="list-link">Explorar lista ${icon("arrow")}</span>
    </a>`;
  }

  function feedEntryFromReview(review, own = false) {
    const avatar = own ? `<span class="person-avatar sm own">${initials(state.profile.name)}</span>` : profileAvatar("sm");
    const name = own ? state.profile.name : Data.glauber.name;
    const href = own ? "profile.html" : "profileusers.html";
    return `<article class="feed-card feed-review-card" data-feed-kind="review ${own ? "own" : "friend"}">
      <div class="feed-review-main">
        <header class="feed-card-head"><a href="${href}" class="feed-author">${avatar}<span><strong>${escapeHTML(name)}</strong><small>${escapeHTML(review.date || "Agora")}</small></span></a><span class="content-badge">Review</span></header>
        <p class="feed-text">${escapeHTML(review.text)}</p>
        <footer class="feed-actions"><button type="button">${icon("heart")} Amei</button><button type="button">${icon("comment")} Comentar</button></footer>
      </div>
      <aside class="feed-review-movie">${reviewMovieCard(review, { featured: true })}</aside>
    </article>`;
  }

  function feedEntryFromPost(post, own = false) {
    const avatar = own ? `<span class="person-avatar sm own">${initials(state.profile.name)}</span>` : profileAvatar("sm");
    const name = own ? state.profile.name : Data.glauber.name;
    const href = own ? "profile.html" : "profileusers.html";
    return `<article class="feed-card" data-feed-kind="post ${own ? "own" : "friend"}">
      <header class="feed-card-head"><a href="${href}" class="feed-author">${avatar}<span><strong>${escapeHTML(name)}</strong><small>${escapeHTML(post.date || "Agora")}</small></span></a><span class="content-badge neutral">Post</span></header>
      <p class="feed-text">${escapeHTML(post.text)}</p>
      <footer class="feed-actions"><button type="button">${icon("heart")} Amei</button><button type="button">${icon("comment")} Comentar</button></footer>
    </article>`;
  }

  function feedEntries() {
    return [
      ...state.posts.map(post => feedEntryFromPost(post, true)),
      ...state.reviews.map(review => feedEntryFromReview(review, true)),
      ...Data.glauberPosts.map(post => feedEntryFromPost(post)),
      ...Data.glauberReviews.map(review => feedEntryFromReview(review))
    ].join("");
  }

  function openPostModal() {
    const modal = mountModal("post", `
      <div class="modal-form-head"><h2>Novo post</h2><p>Compartilhe uma ideia, descoberta ou conversa relacionada ao cinema.</p></div>
      <form class="modal-form" data-post-form>
        <label>Publicação<textarea name="text" rows="5" maxlength="600" required placeholder="O que você quer compartilhar?"></textarea></label>
        <div class="form-footer"><small>Máximo de 600 caracteres.</small><button class="btn btn-primary" type="submit">Publicar ${icon("arrow")}</button></div>
      </form>
    `, "md");

    modal.querySelector("[data-post-form]")?.addEventListener("submit", event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const text = String(form.get("text") || "").trim();
      if (!text) return;
      savePost({ text, date: "Agora", type: "post" });
      closeModal(modal);
      toast("Post publicado no protótipo.");
    });
  }

  function pickerRows(movies) {
    return movies.map(movie => {
      const poster = posterURL(movie);
      return `<button class="movie-picker-row" type="button" data-picker-movie="${escapeHTML(movieKey(movie))}">
        <span class="movie-picker-poster">${poster ? `<img src="${poster}" alt="" loading="lazy">` : `<span>${escapeHTML(movie.title.slice(0, 1))}</span>`}</span>
        <span class="movie-picker-copy"><strong>${escapeHTML(movie.title)}</strong><small>${escapeHTML(movieYear(movie))} · ${escapeHTML(genresText(movie))}</small></span>
        ${icon("arrow")}
      </button>`;
    }).join("");
  }

  function bindMoviePicker(modal, { preselectedMovie = "", onSelect }) {
    const search = modal.querySelector("[data-picker-search]");
    const results = modal.querySelector("[data-picker-results]");
    const selected = modal.querySelector("[data-picker-selected]");
    let selectedMovie = preselectedMovie ? state.movies.find(movie => movie.title === preselectedMovie) : null;

    function renderSelected() {
      if (!selected) return;
      selected.innerHTML = selectedMovie ? reviewMovieCard({ movie: selectedMovie.title, year: movieYear(selectedMovie) }) : "";
      selected.classList.toggle("hidden", !selectedMovie);
      onSelect?.(selectedMovie);
    }

    function renderResults() {
      if (!results) return;
      const term = String(search?.value || "").trim().toLocaleLowerCase("pt-BR");
      const movies = state.movies.filter(movie => !term || `${movie.title} ${movieYear(movie)} ${genresText(movie, 4)}`.toLocaleLowerCase("pt-BR").includes(term)).slice(0, 18);
      results.innerHTML = movies.length ? pickerRows(movies) : `<div class="picker-empty">Nenhum filme encontrado.</div>`;
    }

    modal.addEventListener("click", event => {
      const row = event.target.closest("[data-picker-movie]");
      if (!row) return;
      selectedMovie = state.movies.find(movie => movieKey(movie) === row.dataset.pickerMovie) || null;
      renderSelected();
    });
    search?.addEventListener("input", renderResults);
    renderSelected();
    renderResults();
    return () => selectedMovie;
  }

  function openReviewModal(preselectedMovie = "") {
    let selectedMovie = null;
    const modal = mountModal("review", `
      <div class="modal-form-head"><h2>Escrever review</h2><p>Escolha um filme e escreva o que ficou com você depois da sessão.</p></div>
      <form class="modal-form" data-review-form>
        <div class="movie-picker-block">
          <label for="review-movie-search">Filme</label>
          <div class="search-field picker-search">${icon("search")}<input id="review-movie-search" type="search" data-picker-search placeholder="Pesquisar filme por nome, ano ou gênero" autocomplete="off"></div>
          <div class="picker-selected hidden" data-picker-selected></div>
          <div class="movie-picker-results" data-picker-results></div>
        </div>
        <label>Sua review<textarea name="text" rows="6" maxlength="1200" required placeholder="O que ficou com você depois do filme?"></textarea></label>
        <label class="check-line"><input type="checkbox" name="spoiler"><span>Esta review contém spoilers</span></label>
        <div class="form-footer"><small>Máximo de 1200 caracteres.</small><button class="btn btn-primary" type="submit">Publicar review ${icon("arrow")}</button></div>
      </form>
    `, "md");

    const getSelected = bindMoviePicker(modal, { preselectedMovie, onSelect: movie => { selectedMovie = movie; } });

    modal.querySelector("[data-review-form]")?.addEventListener("submit", event => {
      event.preventDefault();
      selectedMovie = getSelected() || selectedMovie;
      const form = new FormData(event.currentTarget);
      const text = String(form.get("text") || "").trim();
      if (!selectedMovie) return toast("Selecione um filme para publicar a review.");
      if (!text) return;
      saveReview({
        movie: selectedMovie.title,
        movieKey: movieKey(selectedMovie),
        year: movieYear(selectedMovie),
        text,
        date: "Agora",
        spoiler: form.get("spoiler") === "on"
      });
      closeModal(modal);
      toast("Review publicada no protótipo.");
    });
  }

  function openFavoriteModal(slotIndex = null) {
    let selectedMovie = null;
    const modal = mountModal("favorite", `
      <div class="modal-form-head"><h2>Adicionar filme aos favoritos</h2><p>Escolha um filme do catálogo. Os favoritos são independentes dos filmes curtidos.</p></div>
      <div class="movie-picker-block">
        <div class="search-field picker-search">${icon("search")}<input type="search" data-picker-search placeholder="Pesquisar entre os ${state.movies.length} filmes" autocomplete="off"></div>
        <div class="picker-selected hidden" data-picker-selected></div>
        <div class="movie-picker-results tall" data-picker-results></div>
      </div>
      <div class="form-footer"><small>Seu perfil exibe até cinco favoritos.</small><button class="btn btn-primary" type="button" data-confirm-favorite>Adicionar aos favoritos</button></div>
    `, "md");

    const getSelected = bindMoviePicker(modal, { onSelect: movie => { selectedMovie = movie; } });
    modal.querySelector("[data-confirm-favorite]")?.addEventListener("click", () => {
      selectedMovie = getSelected() || selectedMovie;
      if (!selectedMovie) return toast("Selecione um filme primeiro.");
      if (!addFavorite(selectedMovie, slotIndex)) return toast("Esse filme já está nos favoritos ou a vaga não está disponível.");
      closeModal(modal);
      toast("Filme adicionado aos favoritos.");
    });
  }

  function openEditProfileModal() {
    const modal = mountModal("profile-edit", `
      <div class="modal-form-head"><h2>Editar perfil</h2><p>Atualize as informações principais do seu perfil.</p></div>
      <form class="modal-form" data-profile-form>
        <label>Nome<input type="text" name="name" maxlength="60" required value="${escapeHTML(state.profile.name)}"></label>
        <label>Descrição<textarea name="description" rows="4" maxlength="240" required>${escapeHTML(state.profile.description)}</textarea></label>
        <div class="form-footer"><span></span><button class="btn btn-primary" type="submit">Salvar alterações</button></div>
      </form>
    `, "md");

    modal.querySelector("[data-profile-form]")?.addEventListener("submit", event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      saveProfile({
        name: String(form.get("name") || "Usuário CineCena").trim(),
        description: String(form.get("description") || "").trim()
      });
      closeModal(modal);
      toast("Perfil atualizado.");
    });
  }

  function movieDirector(detailed, movie) {
    return detailed?.credits?.crew?.find(person => person.job === "Director")?.name
      || detailed?.director
      || (movie.title === "Cidade de Deus" ? "Fernando Meirelles, Kátia Lund" : "Disponível via TMDB");
  }

  function compactMovieModalContent(movie, detailed = movie) {
    const interaction = movieStateFor(movie);
    const poster = posterURL(detailed) || posterURL(movie);
    const backdrop = detailed?.backdrop || TMDB.backdropUrl(detailed?.backdrop_path || "") || movie?.backdrop || TMDB.backdropUrl(movie?.backdrop_path || "");
    const director = movieDirector(detailed, movie);
    const genres = genresText(detailed, 4) || genresText(movie, 4);

    return `<div class="quick-movie-card">
      <div class="quick-movie-poster">${poster ? `<img src="${poster}" alt="Pôster de ${escapeHTML(movie.title)}">` : `<span class="poster-fallback"><small>CineCena</small><strong>${escapeHTML(movie.title)}</strong><i>${movieYear(movie)}</i></span>`}</div>
      <div class="quick-movie-main">
        <div><h2>${escapeHTML(movie.title)}</h2><div class="quick-movie-meta"><span>${escapeHTML(movieYear(movie))}</span><span>${escapeHTML(genres)}</span></div></div>
        <dl class="quick-movie-info"><div><dt>Direção</dt><dd>${escapeHTML(director)}</dd></div><div><dt>Gênero</dt><dd>${escapeHTML(genres)}</dd></div></dl>
        <div class="quick-movie-actions">
          <button class="movie-action ${interaction.watched ? "active" : ""}" type="button" data-movie-action="watched">${icon("eye")}<span>${interaction.watched ? "Assistido" : "Marcar como assistido"}</span></button>
          <button class="movie-action ${interaction.loved ? "active love" : ""}" type="button" data-movie-action="loved">${icon("heart")}<span>${interaction.loved ? "Curtido" : "Amei"}</span></button>
          <button class="movie-action ${interaction.listed ? "active" : ""}" type="button" data-movie-action="listed">${icon("bookmark")}<span>${interaction.listed ? "Na lista" : "Adicionar em lista"}</span></button>
          <button class="movie-action primary" type="button" data-modal-review>${icon("pen")}<span>Criar review</span></button>
        </div>
        <a class="btn btn-primary quick-more" href="${moviePageURL(movie)}">Ver mais ${icon("arrow")}</a>
      </div>
    </div>
    <div class="quick-movie-backdrop${backdrop ? "" : " fallback"}" ${backdrop ? `style="background-image:linear-gradient(90deg, rgba(5,24,48,.3), rgba(5,24,48,.08)),url('${backdrop}')"` : ""}></div>`;
  }

  function bindMovieModalActions(modal, movie, details = movie) {
    modal.querySelectorAll("[data-movie-action]").forEach(button => {
      button.addEventListener("click", () => {
        updateMovieState(movie, button.dataset.movieAction);
        modal.querySelector(".movie-modal-shell").innerHTML = compactMovieModalContent(movie, details);
        bindMovieModalActions(modal, movie, details);
        toast("Interação salva localmente.");
      });
    });
    modal.querySelector("[data-modal-review]")?.addEventListener("click", () => {
      closeModal(modal);
      openReviewModal(movie.title);
    });
  }

  async function openMovieModal(movie) {
    if (!movie) return;
    const modal = mountModal("movie", `<div class="movie-modal-shell">${compactMovieModalContent(movie)}</div>`, "movie-quick-size");
    bindMovieModalActions(modal, movie);

    const detailsId = Number(movie.id);
    if (TMDB.isConfigured() && Number.isInteger(detailsId)) {
      try {
        const details = await TMDB.getMovieDetails(detailsId);
        if (!document.body.contains(modal)) return;
        modal.querySelector(".movie-modal-shell").innerHTML = compactMovieModalContent(movie, { ...details, title: movie.title, year: movie.year });
        bindMovieModalActions(modal, movie, details);
      } catch (error) {
        console.warn("CineCena: não foi possível carregar detalhes rápidos do TMDB.", error);
      }
    }
  }

  function bindGlobalEvents() {
    document.addEventListener("click", event => {
      const removeFavoriteButton = event.target.closest("[data-remove-favorite]");
      if (removeFavoriteButton) {
        removeFavoriteAt(Number(removeFavoriteButton.dataset.removeFavorite));
        toast("Filme removido dos favoritos.");
        return;
      }

      const addFavoriteButton = event.target.closest("[data-new-favorite]");
      if (addFavoriteButton) {
        const slot = Number(addFavoriteButton.dataset.favoriteSlot);
        openFavoriteModal(Number.isInteger(slot) ? slot : null);
        return;
      }

      const card = event.target.closest("[data-movie-key]");
      if (card && !card.closest("[data-picker-selected]")) {
        const movie = state.movies.find(item => movieKey(item) === card.dataset.movieKey);
        openMovieModal(movie);
        return;
      }

      const prev = event.target.closest("[data-rail-prev]");
      if (prev) {
        document.getElementById(prev.dataset.railPrev)?.scrollBy({ left: -620, behavior: "auto" });
        return;
      }

      const next = event.target.closest("[data-rail-next]");
      if (next) {
        document.getElementById(next.dataset.railNext)?.scrollBy({ left: 620, behavior: "auto" });
        return;
      }

      if (event.target.closest("[data-new-post]")) openPostModal();
      if (event.target.closest("[data-new-review]")) openReviewModal();
      if (event.target.closest("[data-edit-profile]")) openEditProfileModal();
    });
  }

  window.CineCenaComponents = {
    movieCard,
    movieRail,
    moviePageURL,
    profileAvatar,
    reviewMovieCard,
    reviewActivity,
    listCard,
    feedEntryFromReview,
    feedEntryFromPost,
    feedEntries,
    openPostModal,
    openReviewModal,
    openFavoriteModal,
    openEditProfileModal,
    openMovieModal
  };

  bindGlobalEvents();
})();
