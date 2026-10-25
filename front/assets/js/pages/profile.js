(() => {
    const App = window.CineCena;
    const UI = window.CineCenaComponents;

    if (!App || !UI) {
        console.error('CineCena: App ou componentes não encontrados.');
        return;
    }

    const {
        state,
        collectionMovies,
        favoriteSlots,
        initials,
        icon,
        escapeHTML,
        posterURL,
        movieKey,
        movieYear
    } = App;

    const LIMIT = 15;
    let connectionStats = null;
    let statsRequest = 0;

    async function loadConnectionStats() {
        const username = state.profile.name;
        const token = localStorage.getItem("token");
        if (!token || username === "Usuário CineCena") return;
        const sequence = ++statsRequest;
        try {
            // Esta API lê Follow diretamente do banco, inclusive seguidores.
            const profile = await window.CINECENA_API.request(`users/${encodeURIComponent(username)}/`);
            if (sequence !== statsRequest || token !== localStorage.getItem("token") ||
                username !== state.profile.name) return;
            connectionStats = {
                username,
                following: Number(profile.following_count) || 0,
                followers: Number(profile.followers_count) || 0
            };
            render();
        } catch (error) {
            console.warn("CineCena: falha ao carregar seguidores do Django.", error);
        }
    }

    function sectionMovies(
        target,
        movies,
        emptyTitle,
        emptyText,
        action,
        moreHref = ""
    ) {
        if (!target) {
            return;
        }

        if (!movies.length) {
            target.innerHTML = empty(
                emptyTitle,
                emptyText,
                action
            );
            return;
        }

        target.innerHTML = `
            <div class="profile-movie-grid wide">
                ${movies
                    .slice(0, LIMIT)
                    .map(movie =>
                        UI.movieCard(movie, {
                            compact: true
                        })
                    )
                    .join("")}
            </div>

            ${
                movies.length > LIMIT && moreHref
                    ? `
                        <div class="section-more">
                            <a
                                class="btn btn-secondary"
                                href="${moreHref}"
                            >
                                Ver mais
                            </a>
                        </div>
                    `
                    : ""
            }
        `;
    }

    function renderFavoriteSlots(target) {
        if (!target) {
            return;
        }

        target.innerHTML = `
            <div class="favorite-slots">
                ${favoriteSlots()
                    .map((movie, index) => {
                        if (!movie) {
                            return `
                                <button
                                    class="favorite-slot empty"
                                    type="button"
                                    data-new-favorite
                                    data-favorite-slot="${index}"
                                >
                                    <span class="favorite-add-icon">
                                        ${icon("plus")}
                                    </span>

                                    <strong>
                                        Adicionar filme
                                    </strong>

                                    <small>
                                        Favorito ${index + 1}
                                    </small>
                                </button>
                            `;
                        }

                        const poster = posterURL(movie);

                        return `
                            <div class="favorite-slot filled">
                                <button
                                    class="favorite-remove"
                                    type="button"
                                    data-remove-favorite="${index}"
                                    aria-label="Remover ${escapeHTML(movie.title)} dos favoritos"
                                >
                                    ${icon("close")}
                                </button>

                                <button
                                    class="favorite-movie"
                                    type="button"
                                    data-movie-key="${escapeHTML(movieKey(movie))}"
                                    aria-label="Abrir ${escapeHTML(movie.title)}"
                                >
                                    <span class="favorite-poster">
                                        ${
                                            poster
                                                ? `
                                                    <img
                                                        src="${poster}"
                                                        alt="Pôster de ${escapeHTML(movie.title)}"
                                                        loading="lazy"
                                                    >
                                                `
                                                : `
                                                    <span class="poster-fallback">
                                                        <small>CineCena</small>
                                                        <strong>${escapeHTML(movie.title)}</strong>
                                                        <i>${escapeHTML(movieYear(movie))}</i>
                                                    </span>
                                                `
                                        }
                                    </span>

                                    <span class="favorite-copy">
                                        <strong>${escapeHTML(movie.title)}</strong>
                                        <small>${escapeHTML(movieYear(movie))}</small>
                                    </span>
                                </button>
                            </div>
                        `;
                    })
                    .join("")}
            </div>
        `;
    }

    function render() {
        const ownReviews = state.reviews.filter(review => review.own);
        const watched = collectionMovies("watched");
        const loved = collectionMovies("loved");
        const listed = collectionMovies("listed");
        const currentStats = connectionStats?.username === state.profile.name ? connectionStats : null;

        const avatar = document.querySelector(
            "[data-profile-avatar]"
        );

        if (avatar) {
            if (state.profile.avatar) avatar.innerHTML = `<img src="${escapeHTML(state.profile.avatar)}" alt="Foto do perfil">`;
            else avatar.textContent = initials(state.profile.name);
        }

        const name = document.querySelector(
            "[data-profile-name]"
        );

        if (name) {
            name.textContent = state.profile.name;
        }

        const description = document.querySelector(
            "[data-profile-description]"
        );

        if (description) {
            description.textContent = state.profile.description;
        }

        const counters = document.querySelector(
            "[data-profile-counters]"
        );

        if (counters) {
            counters.innerHTML = `
                <div>
                    <button class="profile-stat-button" type="button" data-profile-connections="following" aria-label="Ver pessoas que você segue">
                        <strong>${currentStats ? currentStats.following : state.friendIds.length}</strong>
                        <span>Seguindo</span>
                    </button>
                </div>

                <div>
                    <button class="profile-stat-button" type="button" data-profile-connections="followers" aria-label="Ver seus seguidores">
                        <strong>${currentStats ? currentStats.followers : "—"}</strong>
                        <span>Seguidores</span>
                    </button>
                </div>

                <div>
                    <strong>${watched.length}</strong>
                    <span>Filmes assistidos</span>
                </div>

                <div>
                    <strong>${ownReviews.length}</strong>
                    <span>Reviews</span>
                </div>
            `;
        }

        renderFavoriteSlots(
            document.querySelector(
                "[data-profile-favorites]"
            )
        );

        const reviews = document.querySelector(
            "[data-profile-reviews]"
        );

        if (reviews) {
            reviews.innerHTML = ownReviews.length
                ? `
                    <div class="feed-stream">
                        ${ownReviews
                            .map(review =>
                                UI.feedEntryFromReview(
                                    review,
                                    true
                                )
                            )
                            .join("")}
                    </div>
                `
                : empty(
                    "Nenhuma review publicada",
                    "Quando você escrever uma review, ela aparecerá aqui.",
                    `
                        <button
                            class="btn btn-secondary"
                            type="button"
                            data-new-review
                        >
                            Adicionar review
                        </button>
                    `
                );
        }

        sectionMovies(
            document.querySelector(
                "[data-profile-loved]"
            ),
            loved,
            "Nenhum filme curtido",
            "Use “Amei” em um filme para adicioná-lo aqui.",
            `
                <a
                    class="btn btn-secondary"
                    href="movies.html"
                >
                    Explorar filmes
                </a>
            `,
            "list.html?type=loved"
        );

        sectionMovies(
            document.querySelector(
                "[data-profile-watched]"
            ),
            watched,
            "Nenhum filme assistido",
            "Marque filmes como assistidos para montar seu histórico.",
            `
                <a
                    class="btn btn-secondary"
                    href="movies.html"
                >
                    Explorar filmes
                </a>
            `,
            "list.html?type=watched"
        );

        sectionMovies(
            document.querySelector(
                "[data-profile-lists]"
            ),
            listed,
            "Nenhuma lista criada",
            "Adicione filmes à sua lista e organize suas próximas sessões.",
            `
                <a
                    class="btn btn-secondary"
                    href="movies.html"
                >
                    Adicionar filmes
                </a>
            `,
            "list.html?type=listed"
        );
    }

    function empty(title, text, action) {
        return `
            <div class="empty-state slim">
                <div class="empty-icon">
                    ${icon("plus")}
                </div>

                <div>
                    <strong>${escapeHTML(title)}</strong>
                    <p>${escapeHTML(text)}</p>
                </div>

                ${action}
            </div>
        `;
    }

    document.querySelector("[data-profile-counters]")?.addEventListener("click", event => {
        const button = event.target.closest("[data-profile-connections]");
        if (button) UI.openConnectionsModal(state.profile.name, button.dataset.profileConnections);
    });

    render();

    window.addEventListener("cinecena:profile-updated", () => {
        render();
        loadConnectionStats();
    });

    window.addEventListener(
        "cinecena:social-updated",
        render
    );

    window.addEventListener(
        "cinecena:movies-updated",
        render
    );

    window.addEventListener(
        "cinecena:movie-state-updated",
        render
    );

    window.addEventListener(
        "cinecena:favorites-updated",
        render
    );

    window.addEventListener("cinecena:friend-updated", () => {
        render();
        loadConnectionStats();
    });
})();

document.addEventListener(
    "DOMContentLoaded",
    () => {
        const avatarInput = document.getElementById(
            "avatar-file-input"
        );

        const btnChangeAvatar = document.getElementById(
            "btn-change-avatar"
        );

        const profileAvatar = document.querySelector(
            "[data-profile-avatar]"
        );

        const cropModal = document.getElementById(
            "crop-modal"
        );

        const cropImage = document.getElementById(
            "crop-image"
        );

        const btnCancel = document.getElementById(
            "btn-cancel-crop"
        );

        const btnSave = document.getElementById(
            "btn-save-crop"
        );

        let cropper = null;

        if (
            !avatarInput ||
            !cropModal ||
            !cropImage ||
            !btnCancel ||
            !btnSave
        ) {
            return;
        }

        if (btnChangeAvatar) {
            btnChangeAvatar.addEventListener(
                "click",
                () => avatarInput.click()
            );
        }

        if (profileAvatar) {
            profileAvatar.addEventListener(
                "click",
                () => avatarInput.click()
            );
        }

        avatarInput.addEventListener(
            "change",
            event => {
                const file = event.target.files[0];

                if (!file) {
                    return;
                }

                if (!file.type.startsWith("image/")) {
                    alert("Selecione uma imagem válida.");
                    avatarInput.value = "";
                    return;
                }

                const reader = new FileReader();

                reader.onload = event => {
                    cropImage.src = event.target.result;
                    cropModal.style.display = "flex";

                    if (cropper) {
                        cropper.destroy();
                    }

                    cropper = new Cropper(
                        cropImage,
                        {
                            aspectRatio: 1,
                            viewMode: 1,
                            dragMode: "move",
                            autoCropArea: 1
                        }
                    );
                };

                reader.readAsDataURL(file);
            }
        );

        btnCancel.addEventListener(
            "click",
            () => {
                cropModal.style.display = "none";
                avatarInput.value = "";

                if (cropper) {
                    cropper.destroy();
                    cropper = null;
                }
            }
        );

        btnSave.addEventListener(
            "click",
            () => {
                if (!cropper) {
                    return;
                }

                const canvas = cropper.getCroppedCanvas({
                    width: 300,
                    height: 300
                });

                if (!canvas) {
                    alert("Não foi possível recortar a imagem.");
                    return;
                }

                canvas.toBlob(
                    async blob => {
                        if (!blob) {
                            alert("Não foi possível preparar a imagem.");
                            return;
                        }

                        const token = localStorage.getItem("token");

                        if (!token) {
                            alert("Sua sessão expirou. Faça login novamente.");
                            return;
                        }

                        const formData = new FormData();

                        formData.append(
                            "avatar",
                            blob,
                            "avatar.jpg"
                        );

                        try {
                            const response = await fetch(
                                window.CINECENA_API.endpoint("accounts/me/"),
                                {
                                    method: "PATCH",
                                    headers: {
                                        "Authorization": `Token ${token}`
                                    },
                                    body: formData
                                }
                            );

                            if (response.ok) {
                                const updatedUser = await response.json();

                                localStorage.setItem(
                                    "user",
                                    JSON.stringify(updatedUser)
                                );

                                window.location.reload();
                            } else {
                                let message = "Erro ao salvar foto.";

                                try {
                                    const data = await response.json();

                                    if (data?.detail) {
                                        message = data.detail;
                                    }
                                } catch (_) {}

                                alert(message);
                            }
                        } catch (error) {
                            console.error(
                                "Erro ao enviar avatar:",
                                error
                            );

                            alert("Erro ao conectar com o servidor.");
                        } finally {
                            cropModal.style.display = "none";
                        }
                    },
                    "image/jpeg",
                    0.9
                );
            }
        );
    }
);

window.CineCenaLogout = function CineCenaLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "../index.html";
};