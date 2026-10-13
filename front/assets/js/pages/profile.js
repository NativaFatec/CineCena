(() => {
    /* =========================================================
       FAVORITOS POR USUÁRIO
       ---------------------------------------------------------
       O restante do projeto pode continuar usando a chave antiga
       "cinecena_favorites". Este bloco redireciona essa chave para
       uma chave exclusiva do usuário logado.
       ========================================================= */

    const LEGACY_FAVORITES_KEY = 'cinecena_favorites';
    const GUEST_FAVORITES_KEY = 'cinecena_favorites_guest';

    function getLoggedUser() {
        try {
            const rawUser = localStorage.getItem('user');

            if (!rawUser) {
                return null;
            }

            return JSON.parse(rawUser);
        } catch (error) {
            console.error(
                'CineCena: erro ao ler usuário logado:',
                error
            );

            return null;
        }
    }

    function getFavoritesStorageKey() {
        const user = getLoggedUser();

        /*
         * Sem usuário logado:
         * usa uma área separada para visitante.
         */
        if (!user) {
            return GUEST_FAVORITES_KEY;
        }

        /*
         * O ID é o identificador ideal.
         *
         * Exemplo:
         * usuário 1 -> cinecena_favorites_1
         * usuário 2 -> cinecena_favorites_2
         */
        if (
            user.id !== undefined &&
            user.id !== null &&
            String(user.id).trim() !== ''
        ) {
            return `cinecena_favorites_${String(user.id).trim()}`;
        }

        /*
         * Fallback caso o backend ainda não esteja enviando o ID.
         */
        const fallback = user.username || user.email;

        if (fallback) {
            return `cinecena_favorites_${encodeURIComponent(
                String(fallback).trim().toLowerCase()
            )}`;
        }

        return GUEST_FAVORITES_KEY;
    }

    function getFavorites() {
        try {
            const saved = localStorage.getItem(
                getFavoritesStorageKey()
            );

            if (!saved) {
                return [];
            }

            const parsed = JSON.parse(saved);

            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error(
                'CineCena: erro ao carregar favoritos:',
                error
            );

            return [];
        }
    }

    function saveFavorites(favoritesList) {
        try {
            const favorites = Array.isArray(favoritesList)
                ? favoritesList
                : [];

            localStorage.setItem(
                getFavoritesStorageKey(),
                JSON.stringify(favorites)
            );

            /*
             * Impede que a chave antiga continue sendo usada.
             */
            localStorage.removeItem(
                LEGACY_FAVORITES_KEY
            );

        } catch (error) {
            console.error(
                'CineCena: erro ao salvar favoritos:',
                error
            );
        }
    }

    /* =========================================================
       COMPATIBILIDADE COM CÓDIGO ANTIGO
       ---------------------------------------------------------
       Caso outro arquivo ainda faça:

       localStorage.getItem('cinecena_favorites')
       localStorage.setItem('cinecena_favorites', ...)
       localStorage.removeItem('cinecena_favorites')

       ele será automaticamente direcionado para o usuário atual.
       ========================================================= */

    function installFavoritesStorageBridge() {
        if (
            !window.localStorage ||
            Storage.prototype.__cineCenaFavoritesBridgeInstalled
        ) {
            return;
        }

        const originalGetItem =
            Storage.prototype.getItem;

        const originalSetItem =
            Storage.prototype.setItem;

        const originalRemoveItem =
            Storage.prototype.removeItem;

        Storage.prototype.getItem = function (key) {
            if (
                this === window.localStorage &&
                key === LEGACY_FAVORITES_KEY
            ) {
                return originalGetItem.call(
                    this,
                    getFavoritesStorageKey()
                );
            }

            return originalGetItem.call(this, key);
        };

        Storage.prototype.setItem = function (key, value) {
            if (
                this === window.localStorage &&
                key === LEGACY_FAVORITES_KEY
            ) {
                const userKey =
                    getFavoritesStorageKey();

                originalSetItem.call(
                    this,
                    userKey,
                    value
                );

                /*
                 * Nunca deixa a chave global continuar existindo.
                 */
                originalRemoveItem.call(
                    this,
                    LEGACY_FAVORITES_KEY
                );

                return;
            }

            return originalSetItem.call(
                this,
                key,
                value
            );
        };

        Storage.prototype.removeItem = function (key) {
            if (
                this === window.localStorage &&
                key === LEGACY_FAVORITES_KEY
            ) {
                return originalRemoveItem.call(
                    this,
                    getFavoritesStorageKey()
                );
            }

            return originalRemoveItem.call(
                this,
                key
            );
        };

        Storage.prototype.__cineCenaFavoritesBridgeInstalled = true;
    }

    /*
     * Instala a proteção antes da lógica do perfil.
     */
    installFavoritesStorageBridge();

    /* =========================================================
       CINECENA
       ========================================================= */

    const App = window.CineCena;
    const UI = window.CineCenaComponents;

    if (!App || !UI) {
        console.error(
            'CineCena: App ou componentes não encontrados.'
        );

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

    /* =========================================================
       SEÇÕES DE FILMES
       ========================================================= */

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

    /* =========================================================
       FAVORITOS
       ========================================================= */

    function renderFavoriteSlots(target) {
        if (!target) {
            return;
        }

        target.innerHTML = `
            <div class="favorite-slots">
                ${favoriteSlots()
                    .map((movie, index) => {

                        /*
                         * Slot vazio
                         */
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

                        /*
                         * Slot preenchido
                         */
                        return `
                            <div class="favorite-slot filled">

                                <button
                                    class="favorite-remove"
                                    type="button"
                                    data-remove-favorite="${index}"
                                    aria-label="Remover ${escapeHTML(
                                        movie.title
                                    )} dos favoritos"
                                >
                                    ${icon("close")}
                                </button>

                                <button
                                    class="favorite-movie"
                                    type="button"
                                    data-movie-key="${escapeHTML(
                                        movieKey(movie)
                                    )}"
                                    aria-label="Abrir ${escapeHTML(
                                        movie.title
                                    )}"
                                >

                                    <span class="favorite-poster">

                                        ${
                                            poster
                                                ? `
                                                    <img
                                                        src="${poster}"
                                                        alt="Pôster de ${escapeHTML(
                                                            movie.title
                                                        )}"
                                                        loading="lazy"
                                                    >
                                                `
                                                : `
                                                    <span class="poster-fallback">

                                                        <small>
                                                            CineCena
                                                        </small>

                                                        <strong>
                                                            ${escapeHTML(
                                                                movie.title
                                                            )}
                                                        </strong>

                                                        <i>
                                                            ${escapeHTML(
                                                                movieYear(movie)
                                                            )}
                                                        </i>

                                                    </span>
                                                `
                                        }

                                    </span>

                                    <span class="favorite-copy">

                                        <strong>
                                            ${escapeHTML(
                                                movie.title
                                            )}
                                        </strong>

                                        <small>
                                            ${escapeHTML(
                                                movieYear(movie)
                                            )}
                                        </small>

                                    </span>

                                </button>

                            </div>
                        `;
                    })
                    .join("")}
            </div>
        `;
    }

    /* =========================================================
       RENDER DO PERFIL
       ========================================================= */

    function render() {
        const watched =
            collectionMovies("watched");

        const loved =
            collectionMovies("loved");

        const listed =
            collectionMovies("listed");

        /* Avatar */
        const avatar =
            document.querySelector(
                "[data-profile-avatar]"
            );

        if (avatar) {
            avatar.textContent =
                initials(state.profile.name);
        }

        /* Nome */
        const name =
            document.querySelector(
                "[data-profile-name]"
            );

        if (name) {
            name.textContent =
                state.profile.name;
        }

        /* Descrição */
        const description =
            document.querySelector(
                "[data-profile-description]"
            );

        if (description) {
            description.textContent =
                state.profile.description;
        }

        /* Contadores */
        const counters =
            document.querySelector(
                "[data-profile-counters]"
            );

        if (counters) {
            counters.innerHTML = `
                <div>
                    <strong>
                        ${state.friend ? 1 : 0}
                    </strong>
                    <span>
                        Amigos
                    </span>
                </div>

                <div>
                    <strong>
                        ${watched.length}
                    </strong>
                    <span>
                        Filmes assistidos
                    </span>
                </div>

                <div>
                    <strong>
                        ${state.reviews.length}
                    </strong>
                    <span>
                        Reviews
                    </span>
                </div>

                <div>
                    <strong>
                        ${listed.length ? 1 : 0}
                    </strong>
                    <span>
                        Listas
                    </span>
                </div>
            `;
        }

        /* Favoritos */
        renderFavoriteSlots(
            document.querySelector(
                "[data-profile-favorites]"
            )
        );

        /* Reviews */
        const reviews =
            document.querySelector(
                "[data-profile-reviews]"
            );

        if (reviews) {
            reviews.innerHTML =
                state.reviews.length

                    ? `
                        <div class="feed-stream">
                            ${state.reviews
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

        /* Filmes curtidos */
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

        /* Filmes assistidos */
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

        /* Listas */
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

    /* =========================================================
       ESTADO VAZIO
       ========================================================= */

    function empty(title, text, action) {
        return `
            <div class="empty-state slim">

                <div class="empty-icon">
                    ${icon("plus")}
                </div>

                <div>

                    <strong>
                        ${escapeHTML(title)}
                    </strong>

                    <p>
                        ${escapeHTML(text)}
                    </p>

                </div>

                ${action}

            </div>
        `;
    }

    /* =========================================================
       DISPONIBILIZA AS FUNÇÕES PARA OUTROS JS
       ========================================================= */

    App.getFavorites =
        getFavorites;

    App.saveFavorites =
        saveFavorites;

    App.getFavoritesStorageKey =
        getFavoritesStorageKey;

    /* Render inicial */
    render();

    /* Atualizações */
    window.addEventListener(
        "cinecena:profile-updated",
        render
    );

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

    window.addEventListener(
        "cinecena:friend-updated",
        render
    );

})();


/* =============================================================
   AVATAR / RECORTE
   ============================================================= */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        const avatarInput =
            document.getElementById(
                'avatar-file-input'
            );

        const btnChangeAvatar =
            document.getElementById(
                'btn-change-avatar'
            );

        const profileAvatar =
            document.querySelector(
                '[data-profile-avatar]'
            );

        const cropModal =
            document.getElementById(
                'crop-modal'
            );

        const cropImage =
            document.getElementById(
                'crop-image'
            );

        const btnCancel =
            document.getElementById(
                'btn-cancel-crop'
            );

        const btnSave =
            document.getElementById(
                'btn-save-crop'
            );

        let cropper = null;

        /*
         * Não trava a página caso esses elementos não existam.
         */
        if (
            !avatarInput ||
            !cropModal ||
            !cropImage ||
            !btnCancel ||
            !btnSave
        ) {
            return;
        }

        /* Botão alterar foto */
        if (btnChangeAvatar) {
            btnChangeAvatar.addEventListener(
                'click',
                () => avatarInput.click()
            );
        }

        /* Círculo do avatar */
        if (profileAvatar) {
            profileAvatar.addEventListener(
                'click',
                () => avatarInput.click()
            );
        }

        /* Selecionou imagem */
        avatarInput.addEventListener(
            'change',
            (e) => {

                const file =
                    e.target.files[0];

                if (!file) {
                    return;
                }

                if (
                    !file.type.startsWith(
                        'image/'
                    )
                ) {
                    alert(
                        'Selecione uma imagem válida.'
                    );

                    avatarInput.value = '';

                    return;
                }

                const reader =
                    new FileReader();

                reader.onload =
                    (event) => {

                        cropImage.src =
                            event.target.result;

                        cropModal.style.display =
                            'flex';

                        if (cropper) {
                            cropper.destroy();
                        }

                        cropper =
                            new Cropper(
                                cropImage,
                                {
                                    aspectRatio: 1,
                                    viewMode: 1,
                                    dragMode: 'move',
                                    autoCropArea: 1,
                                }
                            );
                    };

                reader.readAsDataURL(
                    file
                );
            }
        );

        /* Cancelar */
        btnCancel.addEventListener(
            'click',
            () => {

                cropModal.style.display =
                    'none';

                avatarInput.value = '';

                if (cropper) {

                    cropper.destroy();

                    cropper = null;
                }
            }
        );

        /* Salvar */
        btnSave.addEventListener(
            'click',
            () => {

                if (!cropper) {
                    return;
                }

                const canvas =
                    cropper.getCroppedCanvas(
                        {
                            width: 300,
                            height: 300,
                        }
                    );

                if (!canvas) {

                    alert(
                        'Não foi possível recortar a imagem.'
                    );

                    return;
                }

                canvas.toBlob(
                    async (blob) => {

                        if (!blob) {

                            alert(
                                'Não foi possível preparar a imagem.'
                            );

                            return;
                        }

                        const token =
                            localStorage.getItem(
                                'token'
                            );

                        if (!token) {

                            alert(
                                'Sua sessão expirou. Faça login novamente.'
                            );

                            return;
                        }

                        const formData =
                            new FormData();

                        formData.append(
                            'avatar',
                            blob,
                            'avatar.jpg'
                        );

                        try {

                            const response =
                                await fetch(
                                    window.CINECENA_API.endpoint("accounts/me/"),
                                    {
                                        method: 'PATCH',

                                        headers: {
                                            'Authorization':
                                                `Token ${token}`
                                        },

                                        body:
                                            formData
                                    }
                                );

                            if (response.ok) {

                                const updatedUser =
                                    await response.json();

                                localStorage.setItem(
                                    'user',
                                    JSON.stringify(
                                        updatedUser
                                    )
                                );

                                window.location.reload();

                            } else {

                                let message =
                                    'Erro ao salvar foto.';

                                try {

                                    const data =
                                        await response.json();

                                    if (data?.detail) {
                                        message =
                                            data.detail;
                                    }

                                } catch (_) {
                                    /*
                                     * API sem JSON.
                                     */
                                }

                                alert(message);
                            }

                        } catch (err) {

                            console.error(
                                'Erro ao enviar avatar:',
                                err
                            );

                            alert(
                                'Erro ao conectar com o servidor.'
                            );

                        } finally {

                            cropModal.style.display =
                                'none';
                        }

                    },
                    'image/jpeg',
                    0.9
                );
            }
        );
    }
);


window.CineCenaLogout =
    function CineCenaLogout() {

        localStorage.removeItem(
            'token'
        );

        localStorage.removeItem(
            'user'
        );

        window.location.href =
            'login.html';
    };