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
        ${review.title ? `<h3 class="feed-review-title">${escapeHTML(review.title)}</h3>` : ""}
        ${review.rating ? `<div class="feed-review-rating" aria-label="Nota ${Number(review.rating)} de 5">${[1,2,3,4,5].map(n => `<span class="${n <= Number(review.rating) ? "is-active" : ""}">★</span>`).join("")}<small>${Number(review.rating)}/5</small></div>` : ""}
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
    const requestedTitle = typeof preselectedMovie === "string" ? preselectedMovie : preselectedMovie?.title;
    const pageTitle = new URLSearchParams(window.location.search).get("movie");
    const selectedMovie = state.movies.find(movie =>
      movie.title === requestedTitle || movie.title === pageTitle
    ) || null;
    const poster = selectedMovie ? posterURL(selectedMovie) : "";
    const modal = mountModal("review", `
      <div class="review-modal">
        <div class="review-modal-heading">
          <span class="review-eyebrow">${icon("clapperboard")} CINECENA</span>
          <div class="modal-form-head">
            <h2>Como foi sua experiência?</h2>
            <p>Sua opinião sobre o filme, em poucas palavras.</p>
          </div>
        </div>
        ${selectedMovie ? `<div class="review-selected-movie">
          <div class="review-selected-poster">${poster ? `<img src="${escapeHTML(poster)}" alt="Pôster de ${escapeHTML(selectedMovie.title)}">` : `<span>${escapeHTML(selectedMovie.title.slice(0, 1))}</span>`}</div>
          <div class="review-selected-copy"><strong>${escapeHTML(selectedMovie.title)}</strong><span>${escapeHTML(movieYear(selectedMovie))}</span><small>${escapeHTML(genresText(selectedMovie, 3))}</small></div>
        </div>` : `<div class="review-movie-required">${icon("film")}<span>Abra a página de um filme para avaliá-lo.</span></div>`}
        <form class="modal-form review-form" data-review-form novalidate>
          <fieldset class="review-rating">
            <legend>Sua nota</legend>
            <div class="review-stars" role="group" aria-label="Nota de 1 a 5 estrelas">
              ${[1,2,3,4,5].map(n => `<button type="button" class="review-star" data-rating="${n}" aria-label="${n} ${n === 1 ? 'estrela' : 'estrelas'}" aria-pressed="false">${icon("star")}</button>`).join("")}
            </div>
            <p class="review-rating-hint" data-rating-hint>Toque para avaliar</p>
            <input type="hidden" name="rating" value="">
            <p class="review-field-error" data-rating-error role="alert"></p>
          </fieldset>
          <label class="review-body-field">Seu comentário<textarea name="text" rows="5" maxlength="1200" required placeholder="O que você achou do filme? Fale sobre a história, atuações ou o que sentiu…"></textarea><span class="review-char-count"><span data-review-count>0</span>/1200</span></label>
          <p class="review-field-error" data-body-error role="alert"></p>
          <div class="review-form-footer"><small>Respeite outras opiniões e evite spoilers sem aviso.</small><button class="btn btn-primary" type="submit" ${selectedMovie ? "" : "disabled"}>Publicar review ${icon("arrow")}</button></div>
        </form>
      </div>
    `, "md");

    const form = modal.querySelector("[data-review-form]");
    const ratingInput = form.querySelector('[name="rating"]');
    const ratingHint = modal.querySelector("[data-rating-hint]");
    const ratingLabels = ["", "Não gostei", "Poderia ser melhor", "Bom", "Muito bom", "Obra-prima!"];
    const stars = [...modal.querySelectorAll("[data-rating]")];
    stars.forEach((star, index) => {
      star.addEventListener("click", () => {
        const rating = Number(star.dataset.rating);
        ratingInput.value = String(rating);
        stars.forEach((item, i) => {
          item.classList.toggle("is-active", i < rating);
          item.setAttribute("aria-pressed", String(i < rating));
        });
        ratingHint.textContent = ratingLabels[rating];
        modal.querySelector("[data-rating-error]").textContent = "";
      });
      star.addEventListener("keydown", event => {
        if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        stars[Math.max(0, Math.min(4, index + (event.key === "ArrowRight" ? 1 : -1)))].focus();
      });
    });

    const textarea = form.querySelector('[name="text"]');
    const count = modal.querySelector("[data-review-count]");
    textarea.addEventListener("input", () => {
      count.textContent = String(textarea.value.length);
      modal.querySelector("[data-body-error]").textContent = "";
    });

    form.addEventListener("submit", async event => {
      event.preventDefault();
      const text = textarea.value.trim();
      const rating = Number(ratingInput.value);
      let valid = true;
      if (!selectedMovie) return;
      if (!rating) {
        modal.querySelector("[data-rating-error]").textContent = "Escolha uma nota para o filme.";
        valid = false;
      }
      if (text.length < 10) {
        modal.querySelector("[data-body-error]").textContent = "Escreva pelo menos 10 caracteres.";
        valid = false;
      }
      if (!valid) return;

      const token = localStorage.getItem("token");
      if (!token) {
        toast("Entre na sua conta para publicar uma review.");
        return;
      }

      const submitButton = form.querySelector('[type="submit"]');
      const originalButton = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.textContent = "Publicando…";
      form.setAttribute("aria-busy", "true");

      try {
        const api = window.CINECENA_API;
        if (!api?.endpoint) throw new Error("A configuração da API do CineCena não foi carregada.");
        const headers = { "Authorization": `Token ${token}`, "Content-Type": "application/json" };
        const numericMovieId = Number(selectedMovie.tmdb_id ?? selectedMovie.id);
        const hasTmdbId = Number.isSafeInteger(numericMovieId) && numericMovieId > 0;

        // Resolve o filme no banco Django. O id usado na review precisa ser a PK do Django,
        // não o id do TMDB recebido pelo frontend.
        const searchResponse = await fetch(`${api.endpoint("movies/")}?search=${encodeURIComponent(selectedMovie.title)}`);
        if (!searchResponse.ok) throw new Error("Não foi possível consultar o catálogo do CineCena.");
        const searchData = await searchResponse.json();
        const movies = Array.isArray(searchData) ? searchData : (searchData.results || []);
        let dbMovie = movies.find(item => hasTmdbId && Number(item.tmdb_id) === numericMovieId)
          || movies.find(item => String(item.title || "").trim().toLocaleLowerCase("pt-BR") === selectedMovie.title.trim().toLocaleLowerCase("pt-BR"));

        if (!dbMovie) {
          const releaseDate = /^\d{4}-\d{2}-\d{2}$/.test(selectedMovie.release_date || "")
            ? selectedMovie.release_date : (selectedMovie.year ? `${selectedMovie.year}-01-01` : null);
          const poster = posterURL(selectedMovie);
          const moviePayload = {
            title: selectedMovie.title,
            original_title: selectedMovie.original_title || selectedMovie.title,
            synopsis: selectedMovie.overview || "",
            release_date: releaseDate,
            poster_url: /^https?:\/\//i.test(poster || "") ? poster : "",
            genres: Array.isArray(selectedMovie.genres) ? selectedMovie.genres.map(g => typeof g === "string" ? g : g.name).filter(Boolean) : [],
            country: "Brasil",
            ...(hasTmdbId ? { tmdb_id: numericMovieId } : {})
          };
          const createMovieResponse = await fetch(api.endpoint("movies/"), {
            method: "POST", headers, body: JSON.stringify(moviePayload)
          });
          const createdMovie = await createMovieResponse.json().catch(() => ({}));
          if (!createMovieResponse.ok) {
            const detail = createdMovie.detail || Object.values(createdMovie).flat().find(value => typeof value === "string");
            throw new Error(detail || "Não foi possível registrar este filme no catálogo.");
          }
          dbMovie = createdMovie;
        }

        const response = await fetch(api.endpoint("reviews/"), {
          method: "POST",
          headers,
          body: JSON.stringify({ movie: dbMovie.id, rating, body: text, title: "", is_spoiler: false })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          const detail = result.detail || result.movie?.[0] || result.non_field_errors?.[0]
            || Object.values(result).flat().find(value => typeof value === "string");
          if (response.status === 401 || response.status === 403) throw new Error("Sua sessão expirou. Entre novamente para publicar.");
          throw new Error(detail || "Não foi possível salvar sua review. Tente novamente.");
        }

        // Atualiza o feed da sessão somente depois que o Django confirmar o salvamento.
        saveReview({
          id: result.id,
          movie: selectedMovie.title,
          movieKey: movieKey(selectedMovie),
          year: movieYear(selectedMovie),
          rating: result.rating,
          text: result.body,
          date: "Agora"
        });
        closeModal(modal);
        toast("Review salva no CineCena com sucesso.");
      } catch (error) {
        console.error("CineCena: falha ao publicar review", error);
        let errorMessage = error.message || "Erro ao publicar a review.";
        if (error instanceof TypeError) errorMessage = "Não foi possível conectar à API. Confira a URL do backend e as configurações de CORS no Render.";
        toast(errorMessage);
      } finally {
        if (modal.isConnected) {
          submitButton.disabled = false;
          submitButton.innerHTML = originalButton;
          form.removeAttribute("aria-busy");
        }
      }
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
