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
    const user = review.username || 'Usuário';
    return `<article class="activity-card">
      <div class="activity-person">${userAvatar(review)}<div><a href="profileusers.html?username=${encodeURIComponent(user)}"><strong>${escapeHTML(user)}</strong></a><small>${escapeHTML(review.date || '')}</small></div></div>
      <div class="activity-type">publicou uma review</div>
      <div class="review-content-layout">${reviewMovieCard(review)}<p>${escapeHTML(review.text || '')}</p></div>
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

  function userAvatar(person = {}) {
    const name = person.username || state.profile.name;
    const avatar = person.avatar || (person.own ? state.profile.avatar : "");
    return `<span class="person-avatar sm${person.own ? ' own' : ''}">${avatar
      ? `<img src="${escapeHTML(avatar)}" alt="${escapeHTML(name)}" loading="lazy">`
      : escapeHTML(initials(name))}</span>`;
  }
  function feedEntryFromReview(review, own = review.own) {
    const name = review.username || state.profile.name;
    const href = own ? "profile.html" : `profileusers.html?username=${encodeURIComponent(name)}`;
    return `<article class="feed-card feed-review-card" data-feed-kind="review ${own ? 'own' : 'community'}${review.friend ? ' friend' : ''}">
      <div class="feed-review-main">
        <header class="feed-card-head"><a href="${href}" class="feed-author">${userAvatar({ ...review, own })}<span><strong>${escapeHTML(name)}</strong><small>${escapeHTML(review.date || 'Agora')}</small></span></a><span class="content-badge">Review</span></header>
        ${review.title ? `<h3 class="feed-review-title">${escapeHTML(review.title)}</h3>` : ''}
        <div class="feed-review-reaction"><strong>${review.reaction === 'amei' ? '❤️ Amei' : review.reaction === 'nao_gostei' ? '👎 Não gostei' : '👍 Gostei'}</strong></div>
        <p class="feed-text">${escapeHTML(review.text || '')}</p>
        <footer class="feed-actions"><button type="button" data-like-review="${Number(review.id)}">${icon('heart')} Amei (${review.likesCount || 0})</button><button type="button" data-comment-review="${Number(review.id)}">${icon('comment')} Comentar</button></footer>
      </div><aside class="feed-review-movie">${reviewMovieCard(review, { featured: true })}</aside>
    </article>`;
  }
  function feedEntryFromPost(post, own = post.own) {
    const name = post.username || state.profile.name;
    const href = own ? "profile.html" : `profileusers.html?username=${encodeURIComponent(name)}`;
    return `<article class="feed-card" data-feed-kind="post ${own ? 'own' : 'community'}${post.friend ? ' friend' : ''}">
      <header class="feed-card-head"><a href="${href}" class="feed-author">${userAvatar({ ...post, own })}<span><strong>${escapeHTML(name)}</strong><small>${escapeHTML(post.date || 'Agora')}</small></span></a><span class="content-badge neutral">Post</span></header>
      <p class="feed-text">${escapeHTML(post.text)}</p>
      <footer class="feed-actions">
      <button type="button" class="like-button ${post.liked ? 'is-liked' : ''}" data-like-post="${Number(post.id)}" aria-pressed="${!!post.liked}" aria-label="${post.liked ? 'Remover curtida' : 'Curtir post'}">${icon('heart')} <span>${post.likesCount || 0}</span></button>      <button type="button" data-comment-post="${Number(post.id)}">${icon('comment')} Comentar (${post.commentsCount || 0})</button></footer>
    </article>`;
  }
  function feedEntries() {
    return [
      ...state.posts.map(post => feedEntryFromPost(post)),
      ...state.reviews.map(review => feedEntryFromReview(review))
    ].join('');
  }

  function openPostModal() {
    const modal = mountModal("post", `
      <div class="modal-form-head"><h2>Novo post</h2><p>Compartilhe uma ideia, descoberta ou conversa relacionada ao cinema.</p></div>
      <form class="modal-form" data-post-form>
        <label>Publicação<textarea name="text" rows="5" maxlength="600" required placeholder="O que você quer compartilhar?"></textarea></label>
        <div class="form-footer"><small>Máximo de 600 caracteres.</small><button class="btn btn-primary" type="submit">Publicar ${icon("arrow")}</button></div>
      </form>
    `, "md");

    modal.querySelector("[data-post-form]")?.addEventListener("submit", async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const button = form.querySelector('[type="submit"]');
      const text = String(new FormData(form).get("text") || "").trim();
      if (!text) return;
      button.disabled = true;
      try {
        const result = await window.CINECENA_API.request("posts/", { method: "POST", body: JSON.stringify({ body: text }) });
        savePost(result); closeModal(modal); toast("Post publicado.");
      } catch (error) { toast(error.message); }
      finally { button.disabled = false; }
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
    let selectedMovie = state.movies.find(movie =>
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
        </div>` : `<div class="movie-picker-block"><div class="search-field picker-search">${icon("search")}<input type="search" data-picker-search placeholder="Pesquisar filme" autocomplete="off"></div><div class="movie-picker-results" data-picker-results></div><div class="picker-selected hidden" data-picker-selected></div></div>`}
        <form class="modal-form review-form" data-review-form novalidate>
          <fieldset class="review-rating">
            <legend>O que você achou do filme?</legend>
            <div class="review-reactions" role="group" aria-label="Escolha sua reação">
              <button type="button" class="review-reaction" data-reaction="nao_gostei" data-rating="1" aria-pressed="false"><span aria-hidden="true">👎</span><strong>Não gostei</strong></button>
              <button type="button" class="review-reaction" data-reaction="gostei" data-rating="3" aria-pressed="false"><span aria-hidden="true">👍</span><strong>Gostei</strong></button>
              <button type="button" class="review-reaction" data-reaction="amei" data-rating="5" aria-pressed="false"><span aria-hidden="true">❤️</span><strong>Amei</strong></button>
            </div>
            <input type="hidden" name="rating" value="">
            <input type="hidden" name="reaction" value="">
            <p class="review-field-error" data-rating-error role="alert"></p>
          </fieldset>
          <label class="review-body-field">Seu comentário<textarea name="text" rows="5" maxlength="1200" required placeholder="O que você achou do filme? Fale sobre a história, atuações ou o que sentiu…"></textarea><span class="review-char-count"><span data-review-count>0</span>/1200</span></label>
          <p class="review-field-error" data-body-error role="alert"></p>
          <div class="review-form-footer"><small>Respeite outras opiniões e evite spoilers sem aviso.</small><button class="btn btn-primary" type="submit" ${selectedMovie ? "" : "disabled"}>Publicar review ${icon("arrow")}</button></div>
        </form>
      </div>
    `, "md");

    if (!selectedMovie) {
      bindMoviePicker(modal, {
        onSelect: movie => {
          selectedMovie = movie;
          modal.querySelector('[data-review-form] [type="submit"]').disabled = !movie;
        }
      });
    }
    const form = modal.querySelector("[data-review-form]");
    const ratingInput = form.querySelector('[name="rating"]');
    const reactionInput = form.querySelector('[name="reaction"]');
    const reactions = [...modal.querySelectorAll("[data-reaction]")];
    reactions.forEach(button => {
      button.addEventListener("click", () => {
        ratingInput.value = button.dataset.rating;
        reactionInput.value = button.dataset.reaction;
        reactions.forEach(item => {
          const active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });
        modal.querySelector("[data-rating-error]").textContent = "";
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
      const reaction = reactionInput.value;
      let valid = true;
      if (!selectedMovie) return;
      if (!rating) {
        modal.querySelector("[data-rating-error]").textContent = "Escolha uma reação para o filme.";
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
        const dbMovie = await api.ensureMovie(selectedMovie);
        const existing = await api.list(`reviews/?movie=${dbMovie.id}`);
        const mine = existing.find(r => Number(r.user) === Number(JSON.parse(localStorage.getItem('user') || 'null')?.id));
        const result = await api.request(mine ? `reviews/${mine.id}/` : "reviews/", {
          method: mine ? "PATCH" : "POST",
          body: JSON.stringify({ movie: dbMovie.id, rating, reaction, body: text, title: mine?.title || "", is_spoiler: false })
        });
        await App.loadSocial();
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
    modal.querySelector("[data-confirm-favorite]")?.addEventListener("click", async event => {
      selectedMovie = getSelected() || selectedMovie;
      if (!selectedMovie) return toast("Selecione um filme primeiro.");
      const button = event.currentTarget; button.disabled = true;
      try { if (await addFavorite(selectedMovie, slotIndex)) closeModal(modal); }
      finally { button.disabled = false; }
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

    modal.querySelector("[data-profile-form]")?.addEventListener("submit", async event => {
      event.preventDefault();
      const button = event.currentTarget.querySelector('[type="submit"]');
      const form = new FormData(event.currentTarget);
      button.disabled = true;
      try {
        await saveProfile({ name: String(form.get("name") || "").trim(), description: String(form.get("description") || "").trim() });
        closeModal(modal); toast("Perfil atualizado.");
      } catch (error) { toast(error.message); }
      finally { button.disabled = false; }
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
      button.addEventListener("click", async () => {
        button.disabled = true;
        if (await updateMovieState(movie, button.dataset.movieAction) && modal.isConnected) {
          modal.querySelector(".movie-modal-shell").innerHTML = compactMovieModalContent(movie, details);
          bindMovieModalActions(modal, movie, details);
          toast("Interação salva.");
        } else button.disabled = false;
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

  async function openCommentsModal(kind, id) {
    const route = kind === "post" ? `posts/${id}/comments/` : `comments/?review=${id}`;
    const modal = mountModal("comments", `<div class="modal-form-head"><h2>Comentários</h2><p>Participe da conversa.</p></div><div class="comment-list" data-comment-list>Carregando…</div><form class="modal-form" data-comment-form><label>Seu comentário<textarea name="body" maxlength="2000" rows="3" required></textarea></label><div class="form-footer"><span></span><button class="btn btn-primary" type="submit">Comentar</button></div></form>`, "md");
    const renderComments = async () => {
      const rows = await window.CINECENA_API.list(route);
      modal.querySelector("[data-comment-list]").innerHTML = rows.length ? rows.map(c => `<p class="comment-row"><strong>${escapeHTML(c.username)}</strong><span>${escapeHTML(c.body)}</span></p>`).join("") : '<p>Seja a primeira pessoa a comentar.</p>';
    };
    try { await renderComments(); } catch (error) { toast(error.message); }
    modal.querySelector('[data-comment-form]').addEventListener('submit', async event => {
      event.preventDefault();
      const button = event.currentTarget.querySelector('button');
      const body = String(new FormData(event.currentTarget).get('body') || '').trim();
      if (!body) return;
      button.disabled = true;
      try {
        await window.CINECENA_API.request(kind === 'post' ? `posts/${id}/comments/` : 'comments/', {
          method: 'POST', body: JSON.stringify(kind === 'post' ? { body } : { review: id, body })
        });
        event.currentTarget.reset(); await renderComments();
        await App.loadSocial(); toast('Comentário enviado.');
      } catch (error) { toast(error.message); }
      finally { button.disabled = false; }
    });
  }

  function bindGlobalEvents() {
    document.addEventListener("click", async event => {
      const likeButton = event.target.closest('[data-like-post], [data-like-review]');
      if (likeButton) {
        likeButton.disabled = true;
        try {
          const kind = likeButton.hasAttribute('data-like-post') ? 'posts' : 'reviews';
          const id = kind === 'posts' ? likeButton.dataset.likePost : likeButton.dataset.likeReview;
          await window.CINECENA_API.request(`${kind}/${id}/like/`, { method: 'POST' });
          await App.loadSocial();
        } catch (error) { toast(error.message); }
        finally { likeButton.disabled = false; }
        return;
      }
      const commentButton = event.target.closest('[data-comment-post], [data-comment-review]');
      if (commentButton) {
        openCommentsModal(commentButton.hasAttribute('data-comment-post') ? 'post' : 'review', Number(commentButton.dataset.commentPost || commentButton.dataset.commentReview));
        return;
      }
      const removeFavoriteButton = event.target.closest("[data-remove-favorite]");
      if (removeFavoriteButton) {
        removeFavoriteAt(Number(removeFavoriteButton.dataset.removeFavorite));
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
