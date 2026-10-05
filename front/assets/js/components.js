(() => {
  const App = window.CineCena;
  if (!App) return;

  const { Data, TMDB, state, escapeHTML, movieYear, posterURL, initials, movieKey, genresText, icon, movieStateFor, updateMovieState, mountModal, closeModal, toast, savePost, saveReview, saveProfile } = App;

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

  function movieRail(id, movies, limit = 12) {
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

  function reviewActivity(review) {
    return `<article class="activity-card">
      <div class="activity-person">${profileAvatar("sm")}<div><a href="profileusers.html"><strong>${Data.glauber.name}</strong></a><small>${escapeHTML(review.date)}</small></div></div>
      <div class="activity-type">publicou uma review de <strong>${escapeHTML(review.movie)}</strong></div>
      <p>${escapeHTML(review.text)}</p>
      <div class="activity-meta"><span>${icon("movie")} ${escapeHTML(review.movie)} · ${review.year}</span>${review.loved ? `<span class="loved">${icon("heart")} Amei</span>` : ""}</div>
    </article>`;
  }

  function listCard(list) {
    const listMovies = list.movies.map(title => state.movies.find(movie => movie.title === title)).filter(Boolean).slice(0, 4);
    return `<a class="list-card accent-${list.accent}" href="lists.html#${list.slug}">
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
    return `<article class="feed-card" data-feed-kind="review ${own ? "own" : "friend"}">
      <header class="feed-card-head"><a href="${href}" class="feed-author">${avatar}<span><strong>${escapeHTML(name)}</strong><small>${escapeHTML(review.date || "Agora")}</small></span></a><span class="content-badge">Review</span></header>
      <div class="review-movie-line">${icon("movie")} <strong>${escapeHTML(review.movie)}</strong>${review.year ? ` <span>· ${review.year}</span>` : ""}</div>
      <p class="feed-text">${escapeHTML(review.text)}</p>
      <footer class="feed-actions"><button type="button">${icon("heart")} Amei</button><button type="button">${icon("comment")} Comentar</button></footer>
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

  function openReviewModal(preselectedMovie = "") {
    const options = state.movies.map(movie => `<option value="${escapeHTML(movie.title)}" ${movie.title === preselectedMovie ? "selected" : ""}>${escapeHTML(movie.title)} (${movieYear(movie)})</option>`).join("");
    const modal = mountModal("review", `
      <div class="modal-form-head"><h2>Escrever review</h2><p>Conte como foi sua experiência. O CineCena não usa estrelas nem notas.</p></div>
      <form class="modal-form" data-review-form>
        <label>Filme<select name="movie" required><option value="">Selecione um filme</option>${options}</select></label>
        <label>Sua review<textarea name="text" rows="6" maxlength="1200" required placeholder="O que ficou com você depois do filme?"></textarea></label>
        <label class="check-line"><input type="checkbox" name="spoiler"><span>Esta review contém spoilers</span></label>
        <div class="form-footer"><small>Sem nota: o texto é o centro da experiência.</small><button class="btn btn-primary" type="submit">Publicar review ${icon("arrow")}</button></div>
      </form>
    `, "md");

    modal.querySelector("[data-review-form]")?.addEventListener("submit", event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const movieTitle = String(form.get("movie") || "");
      const movie = state.movies.find(item => item.title === movieTitle);
      const text = String(form.get("text") || "").trim();
      if (!movieTitle || !text) return;
      saveReview({ movie: movieTitle, year: movie ? movieYear(movie) : "", text, date: "Agora", spoiler: form.get("spoiler") === "on" });
      closeModal(modal);
      toast("Review publicada no protótipo.");
    });
  }

  function openEditProfileModal() {
    const modal = mountModal("profile-edit", `
      <div class="modal-form-head"><h2>Editar perfil</h2><p>Nesta etapa, nome e descrição são os únicos campos preenchidos inicialmente.</p></div>
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

  function movieModalContent(movie, detailed = movie) {
    const interaction = movieStateFor(movie);
    const poster = posterURL(detailed) || posterURL(movie);
    const backdrop = detailed.backdrop || TMDB.backdropUrl(detailed.backdrop_path || "");
    const director = detailed.credits?.crew?.find(person => person.job === "Director")?.name || (movie.id === 598 ? "Fernando Meirelles, Kátia Lund" : "Informação disponível via TMDB");
    const cast = detailed.credits?.cast?.slice(0, 8).map(person => person.name).join(", ") || "Elenco disponível quando o TMDB estiver conectado.";
    const genres = genresText(detailed, 4) || genresText(movie, 4);
    const runtime = detailed.runtime ? `${Math.floor(detailed.runtime / 60)}h ${String(detailed.runtime % 60).padStart(2, "0")}min` : "—";
    const companies = detailed.production_companies?.slice(0, 4).map(company => company.name).join(", ") || "—";
    const synopsis = detailed.overview || movie.overview || "Sinopse indisponível nesta demonstração.";

    return `
      ${backdrop ? `<div class="movie-modal-backdrop" style="background-image:linear-gradient(90deg, rgba(7,24,46,.96), rgba(7,24,46,.72)),url('${backdrop}')"></div>` : `<div class="movie-modal-backdrop fallback"></div>`}
      <div class="movie-modal-content">
        <div class="movie-modal-poster">${poster ? `<img src="${poster}" alt="Pôster de ${escapeHTML(detailed.title || movie.title)}">` : `<span class="poster-fallback"><small>CineCena</small><strong>${escapeHTML(detailed.title || movie.title)}</strong><i>${movieYear(detailed)}</i></span>`}</div>
        <div class="movie-modal-main">
          <h2>${escapeHTML(movie.title)}</h2>
          <div class="movie-meta"><span>${movieYear(movie)}</span><span>${escapeHTML(runtime)}</span><span>${escapeHTML(genres)}</span></div>
          <p class="movie-synopsis">${escapeHTML(synopsis)}</p>
          <div class="movie-actions">
            <button class="movie-action ${interaction.watched ? "active" : ""}" type="button" data-movie-action="watched">${icon("eye")}<span>${interaction.watched ? "Visto" : "Marcar como visto"}</span></button>
            <button class="movie-action ${interaction.loved ? "active love" : ""}" type="button" data-movie-action="loved">${icon("heart")}<span>Amei</span></button>
            <button class="movie-action ${interaction.listed ? "active" : ""}" type="button" data-movie-action="listed">${icon("bookmark")}<span>${interaction.listed ? "Na sua lista" : "Adicionar em lista"}</span></button>
            <button class="movie-action primary" type="button" data-modal-review>${icon("pen")}<span>Criar review</span></button>
          </div>
          <div class="movie-info-grid">
            <div><small>Direção</small><strong>${escapeHTML(director)}</strong></div>
            <div><small>Gênero</small><strong>${escapeHTML(genres)}</strong></div>
            <div><small>Elenco</small><strong>${escapeHTML(cast)}</strong></div>
            <div><small>Produção</small><strong>${escapeHTML(companies)}</strong></div>
          </div>
          <section class="friend-activity-movie"><div><h3>Atividade dos amigos</h3><p>Quando uma amizade interagir com este filme, a atividade aparecerá nesta seção.</p></div>${icon("friends")}</section>
        </div>
      </div>
    `;
  }

  function bindMovieModalActions(modal, movie, details = movie) {
    modal.querySelectorAll("[data-movie-action]").forEach(button => {
      button.addEventListener("click", () => {
        updateMovieState(movie, button.dataset.movieAction);
        modal.querySelector(".movie-modal-shell").innerHTML = movieModalContent(movie, details);
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
    const modal = mountModal("movie", `<div class="movie-modal-shell">${movieModalContent(movie)}</div>`, "movie-size");
    bindMovieModalActions(modal, movie);

    const detailsId = Number(movie.id);
    if (TMDB.isConfigured() && Number.isInteger(detailsId)) {
      try {
        const details = await TMDB.getMovieDetails(detailsId);
        if (!document.body.contains(modal)) return;
        modal.querySelector(".movie-modal-shell").innerHTML = movieModalContent(movie, { ...details, title: movie.title, year: movie.year });
        bindMovieModalActions(modal, movie, details);
      } catch (error) {
        console.warn("CineCena: não foi possível carregar detalhes do TMDB.", error);
      }
    }
  }

  function bindGlobalEvents() {
    document.addEventListener("click", event => {
      const card = event.target.closest("[data-movie-key]");
      if (card) {
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
    profileAvatar,
    reviewActivity,
    listCard,
    feedEntryFromReview,
    feedEntryFromPost,
    feedEntries,
    openPostModal,
    openReviewModal,
    openEditProfileModal,
    openMovieModal
  };

  bindGlobalEvents();
})();
