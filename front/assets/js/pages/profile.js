(() => {
  const App = window.CineCena;
  const UI = window.CineCenaComponents;
  if (!App || !UI) return;

  const { state, collectionMovies, favoriteSlots, initials, icon, escapeHTML, posterURL, movieKey, movieYear } = App;
  const LIMIT = 15;

  function sectionMovies(target, movies, emptyTitle, emptyText, action, moreHref = "") {
    if (!target) return;
    if (!movies.length) {
      target.innerHTML = empty(emptyTitle, emptyText, action);
      return;
    }
    target.innerHTML = `<div class="profile-movie-grid wide">${movies.slice(0, LIMIT).map(movie => UI.movieCard(movie, { compact: true })).join("")}</div>${movies.length > LIMIT && moreHref ? `<div class="section-more"><a class="btn btn-secondary" href="${moreHref}">Ver mais</a></div>` : ""}`;
  }

  function renderFavoriteSlots(target) {
    if (!target) return;
    target.innerHTML = `<div class="favorite-slots">${favoriteSlots().map((movie, index) => {
      if (!movie) {
        return `<button class="favorite-slot empty" type="button" data-new-favorite data-favorite-slot="${index}">
          <span class="favorite-add-icon">${icon("plus")}</span>
          <strong>Adicionar filme</strong>
          <small>Favorito ${index + 1}</small>
        </button>`;
      }

      const poster = posterURL(movie);
      return `<div class="favorite-slot filled">
        <button class="favorite-remove" type="button" data-remove-favorite="${index}" aria-label="Remover ${escapeHTML(movie.title)} dos favoritos">${icon("close")}</button>
        <button class="favorite-movie" type="button" data-movie-key="${escapeHTML(movieKey(movie))}" aria-label="Abrir ${escapeHTML(movie.title)}">
          <span class="favorite-poster">${poster ? `<img src="${poster}" alt="Pôster de ${escapeHTML(movie.title)}" loading="lazy">` : `<span class="poster-fallback"><small>CineCena</small><strong>${escapeHTML(movie.title)}</strong><i>${escapeHTML(movieYear(movie))}</i></span>`}</span>
          <span class="favorite-copy"><strong>${escapeHTML(movie.title)}</strong><small>${escapeHTML(movieYear(movie))}</small></span>
        </button>
      </div>`;
    }).join("")}</div>`;
  }

  function render() {
    const watched = collectionMovies("watched");
    const loved = collectionMovies("loved");
    const listed = collectionMovies("listed");

    const avatar = document.querySelector("[data-profile-avatar]");
    if (avatar) avatar.textContent = initials(state.profile.name);
    const name = document.querySelector("[data-profile-name]");
    const description = document.querySelector("[data-profile-description]");
    if (name) name.textContent = state.profile.name;
    if (description) description.textContent = state.profile.description;

    const counters = document.querySelector("[data-profile-counters]");
    if (counters) counters.innerHTML = `
      <div><strong>${state.friend ? 1 : 0}</strong><span>Amigos</span></div>
      <div><strong>${watched.length}</strong><span>Filmes assistidos</span></div>
      <div><strong>${state.reviews.length}</strong><span>Reviews</span></div>
      <div><strong>${listed.length ? 1 : 0}</strong><span>Listas</span></div>`;

    renderFavoriteSlots(document.querySelector("[data-profile-favorites]"));

    const reviews = document.querySelector("[data-profile-reviews]");
    if (reviews) reviews.innerHTML = state.reviews.length
      ? `<div class="feed-stream">${state.reviews.map(review => UI.feedEntryFromReview(review, true)).join("")}</div>`
      : empty("Nenhuma review publicada", "Quando você escrever uma review, ela aparecerá aqui.", `<button class="btn btn-secondary" type="button" data-new-review>Adicionar review</button>`);

    sectionMovies(
      document.querySelector("[data-profile-loved]"), loved,
      "Nenhum filme curtido", "Use “Amei” em um filme para adicioná-lo aqui.",
      `<a class="btn btn-secondary" href="movies.html">Explorar filmes</a>`,
      "list.html?type=loved"
    );

    sectionMovies(
      document.querySelector("[data-profile-watched]"), watched,
      "Nenhum filme assistido", "Marque filmes como assistidos para montar seu histórico.",
      `<a class="btn btn-secondary" href="movies.html">Explorar filmes</a>`,
      "list.html?type=watched"
    );

    sectionMovies(
      document.querySelector("[data-profile-lists]"), listed,
      "Nenhuma lista criada", "Adicione filmes à sua lista e organize suas próximas sessões.",
      `<a class="btn btn-secondary" href="movies.html">Adicionar filmes</a>`,
      "list.html?type=listed"
    );
  }

  function empty(title, text, action) {
    return `<div class="empty-state slim"><div class="empty-icon">${icon("plus")}</div><div><strong>${escapeHTML(title)}</strong><p>${escapeHTML(text)}</p></div>${action}</div>`;
  }

  render();
  window.addEventListener("cinecena:profile-updated", render);
  window.addEventListener("cinecena:social-updated", render);
  window.addEventListener("cinecena:movies-updated", render);
  window.addEventListener("cinecena:movie-state-updated", render);
  window.addEventListener("cinecena:favorites-updated", render);
  window.addEventListener("cinecena:friend-updated", render);
})();


document.addEventListener('DOMContentLoaded', () => {
    const avatarInput = document.getElementById('avatar-file-input');
    const btnChangeAvatar = document.getElementById('btn-change-avatar');
    const profileAvatar = document.querySelector('[data-profile-avatar]');

    const cropModal = document.getElementById('crop-modal');
    const cropImage = document.getElementById('crop-image');
    const btnCancel = document.getElementById('btn-cancel-crop');
    const btnSave = document.getElementById('btn-save-crop');
    let cropper = null;

    if (!avatarInput) return;

    // 1. Dispara o seletor de arquivo ao clicar no botão ou no círculo do avatar
    if (btnChangeAvatar) {
        btnChangeAvatar.addEventListener('click', () => avatarInput.click());
    }
    if (profileAvatar) {
        profileAvatar.addEventListener('click', () => avatarInput.click());
    }

    // 2. Quando o usuário seleciona uma imagem no computador
    avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            cropImage.src = event.target.result;
            cropModal.style.display = 'flex';

            if (cropper) cropper.destroy();
            cropper = new Cropper(cropImage, {
                aspectRatio: 1, // Quadrado 1:1 para o avatar
                viewMode: 1,
                dragMode: 'move',
                autoCropArea: 1,
            });
        };
        reader.readAsDataURL(file);
    });

    // 3. Botão Cancelar no modal
    btnCancel.addEventListener('click', () => {
        cropModal.style.display = 'none';
        avatarInput.value = '';
        if (cropper) cropper.destroy();
    });

    // 4. Botão Cortar e Salvar
    btnSave.addEventListener('click', () => {
        if (!cropper) return;

        // Gera a imagem cortada em resolução 300x300
        const canvas = cropper.getCroppedCanvas({
            width: 300,
            height: 300,
        });

        canvas.toBlob(async (blob) => {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('avatar', blob, 'avatar.jpg');

            try {
                const response = await fetch('http://127.0.0.1:8000/api/accounts/me/', {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Token ${token}`
                    },
                    body: formData
                });

                if (response.ok) {
                    const updatedUser = await response.json();
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    window.location.reload();
                } else {
                    alert('Erro ao salvar foto.');
                }
            } catch (err) {
                console.error('Erro ao enviar avatar:', err);
                alert('Erro ao conectar com o servidor.');
            } finally {
                cropModal.style.display = 'none';
            }
        }, 'image/jpeg', 0.9);
    });
});