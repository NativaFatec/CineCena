
(() => {
    const App = window.CineCena;
    const UI = window.CineCenaComponents;

    if (!App || !UI) return;

    const {
        Data,
        initials,
        escapeHTML,
        icon,
        toast
    } = App;

    const container = document.querySelector(
        "[data-user-profile]"
    );

    if (!container) return;

    const params = new URLSearchParams(
        window.location.search
    );

    const creatorKey = params.get("creator");
    const username = params.get("username");

    const PROFILE_API_BASE =
    window.CINECENA_API.endpoint("users/");

    const FRIENDSHIPS_API =
    window.CINECENA_API.endpoint("friendships/");

    let currentProfile = null;



    function normalizeAvatarURL(value) {
    if (!value) return "";

    try {
        return new URL(
            value,
            window.CINECENA_API.baseUrl
        ).href;
    } catch (error) {
        console.error(
            "URL de avatar inválida:",
            value,
            error
        );

        return "";
    }
}


    function getHeaders(json = false) {
        const token = localStorage.getItem("token");

        return {
            ...(json
                ? { "Content-Type": "application/json" }
                : {}),
            ...(token
                ? { "Authorization": `Token ${token}` }
                : {}),
        };
    }

    function imageURL(path) {
        if (!path) return "";

        if (/^https?:\/\//i.test(path)) {
            return path;
        }

        return (
            "https://image.tmdb.org/t/p/w500" +
            (path.startsWith("/") ? path : `/${path}`)
        );
    }

    function renderMessage(title, description) {
        container.innerHTML = `
            <section class="shell profile-content">
                <div class="empty-state">
                    <div class="empty-icon">
                        ${icon("user")}
                    </div>
                    <div>
                        <strong>${escapeHTML(title)}</strong>
                        <p>${escapeHTML(description)}</p>
                    </div>
                </div>
            </section>
        `;
    }

    // Mantém o comportamento de páginas da equipe.
    function renderCreator(person) {
        container.innerHTML = `
            <section class="profile-hero shell">
                <span class="person-avatar xxl">
                    ${escapeHTML(initials(person.name))}
                </span>

                <div class="profile-identity">
                    <h1>${escapeHTML(person.name)}</h1>
                    <span>${escapeHTML(person.handle)}</span>
                    <p>${escapeHTML(person.description)}</p>
                </div>
            </section>

            <section class="shell profile-content">
                <div class="empty-state">
                    <div class="empty-icon">
                        ${icon("user")}
                    </div>
                    <div>
                        <strong>Perfil da equipe</strong>
                        <p>
                            Perfil institucional do CineCena.
                        </p>
                    </div>
                </div>
            </section>
        `;
    }

    function renderFavorites(favorites) {
        if (!favorites.length) {
            return `
                <div class="empty-state slim">
                    <div class="empty-icon">
                        ${icon("movie")}
                    </div>
                    <div>
                        <strong>Nenhum filme favorito</strong>
                        <p>
                            Este usuário ainda não adicionou
                            filmes aos favoritos.
                        </p>
                    </div>
                </div>
            `;
        }

        const cards = favorites.map(favorite => {
            const poster = imageURL(
                favorite.poster_path
            );

            const movie = {
                id: favorite.tmdb_id,
                tmdb_id: favorite.tmdb_id,
                title: favorite.title,
                poster_path: favorite.poster_path || "",
                poster,
                catalogKey: String(favorite.tmdb_id),
            };

            return UI.movieCard(
                movie,
                { compact: true }
            );
        });

        return `
            <div class="profile-movie-grid">
                ${cards.join("")}
            </div>
        `;
    }

    function renderFriends(friends) {
        if (!friends.length) {
            return `
                <div class="empty-state slim">
                    <div class="empty-icon">
                        ${icon("friends")}
                    </div>
                    <div>
                        <strong>Nenhuma amizade ainda</strong>
                        <p>
                            Este usuário ainda não tem amizades.
                        </p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="profile-friends-preview">
                ${friends.map(friend => {
                    const avatar = friend.avatar
                        ? `
                            <img
                                src="${escapeHTML(friend.avatar)}"
                                alt="${escapeHTML(friend.username)}"
                                loading="lazy"
                            >
                        `
                        : `
                            <span>
                                ${escapeHTML(initials(friend.username))}
                            </span>
                        `;

                    return `
                        <a
                            class="profile-list-summary"
                            href="profileusers.html?username=${encodeURIComponent(friend.username)}"
                        >
                            <span class="person-avatar">
                                ${avatar}
                            </span>

                            <strong>
                                @${escapeHTML(friend.username)}
                            </strong>
                        </a>
                    `;
                }).join("")}
            </div>
        `;
    }

    function renderReviews(reviews) {
        if (!reviews.length) {
            return `
                <div class="empty-state slim">
                    <div class="empty-icon">
                        ${icon("pen")}
                    </div>
                    <div>
                        <strong>Nenhuma review publicada</strong>
                        <p>
                            As avaliações deste usuário aparecerão aqui.
                        </p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="feed-stream">
                ${reviews.map(review => `
                    <article class="profile-list-summary">
                        <div>
                            <strong>
                                ${escapeHTML(
                                    review.title ||
                                    review.movie_title
                                )}
                            </strong>

                            <p>
                                ${escapeHTML(review.movie_title)}
                                · ${Number(review.rating)}/5
                            </p>

                            ${
                                review.is_spoiler
                                    ? "<small>Contém spoilers</small>"
                                    : ""
                            }

                            <p>
                                ${escapeHTML(review.body || "")}
                            </p>
                        </div>
                    </article>
                `).join("")}
            </div>
        `;
    }

    function renderLists(lists) {
        if (!lists.length) {
            return `
                <div class="empty-state slim">
                    <div class="empty-icon">
                        ${icon("list")}
                    </div>
                    <div>
                        <strong>Nenhuma lista pública</strong>
                        <p>
                            Este usuário ainda não publicou listas.
                        </p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="profile-list-collection">
                ${lists.map(list => `
                    <div class="profile-list-summary">
                        <div>
                            <strong>
                                ${escapeHTML(list.title)}
                            </strong>
                            <p>
                                ${escapeHTML(list.description || "")}
                            </p>
                        </div>

                        <span>
                            ${Number(list.movies_count)} filmes
                        </span>
                    </div>
                `).join("")}
            </div>
        `;
    }

    function renderProfile(profile) {
        currentProfile = profile;

        const avatarSrc = normalizeAvatarURL(
    profile.avatar || profile.avatar_url
);

const avatarHTML = avatarSrc
    ? `
        <img
            data-profile-avatar-image
            src="${escapeHTML(avatarSrc)}"
            alt="Foto de ${escapeHTML(profile.username)}"
            style="
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 50%;
                display: block;
            "
        >
    `
    : `
        <span class="avatar-initials">
            ${escapeHTML(initials(profile.username))}
        </span>
    `;
    
        const showFriendButton =
            !profile.is_self &&
            Boolean(localStorage.getItem("token"));

        const friendButton = showFriendButton
            ? `
                <button
                    class="btn ${
                        profile.is_friend
                            ? "btn-secondary"
                            : "btn-primary"
                    }"
                    type="button"
                    data-public-friend
                    ${profile.friendship_id ? "" : ""}
                >
                    ${
                        profile.is_friend
                            ? "Remover amizade"
                            : `${icon("plus")} Adicionar amizade`
                    }
                </button>
            `
            : "";

        const favorites =
            profile.favorites || [];

        container.innerHTML = `
            <section class="profile-hero shell">
                <span class="person-avatar xxl">
                    ${avatarHTML}
                </span>

                <div class="profile-identity">
                    <h1>${escapeHTML(profile.username)}</h1>

                    <span>
                        @${escapeHTML(profile.username)}
                    </span>

                    <p>
                        ${escapeHTML(
                            profile.bio ||
                            "Este usuário ainda não adicionou uma descrição."
                        )}
                    </p>
                </div>

                ${
                    friendButton
                        ? `
                            <div class="profile-hero-actions">
                                ${friendButton}
                            </div>
                        `
                        : ""
                }
            </section>

            <section class="shell profile-stats">
                <div>
                    <strong>
                        ${Number(profile.friends_count || 0)}
                    </strong>
                    <span>Amigos</span>
                </div>

                <div>
                    <strong>
                        ${Number(profile.watched_count || 0)}
                    </strong>
                    <span>Filmes assistidos</span>
                </div>

                <div>
                    <strong>
                        ${Number(profile.reviews_count || 0)}
                    </strong>
                    <span>Reviews</span>
                </div>

                <div>
                    <strong>
                        ${Number(profile.lists_count || 0)}
                    </strong>
                    <span>Listas públicas</span>
                </div>
            </section>

            <section class="shell profile-content">

                <div class="profile-section">
                    <div class="section-heading">
                        <div>
                            <h2>
                                ${favorites.length} filmes favoritos
                            </h2>
                        </div>
                    </div>

                    ${renderFavorites(favorites)}
                </div>

                <div class="profile-section">
                    <div class="section-heading">
                        <div>
                            <h2>Amizades</h2>
                            <p>
                                Até três amizades deste usuário.
                            </p>
                        </div>
                    </div>

                    ${renderFriends(profile.friends || [])}
                </div>

                <div class="profile-section">
                    <div class="section-heading">
                        <div>
                            <h2>Reviews</h2>
                        </div>
                    </div>

                    ${renderReviews(profile.reviews || [])}
                </div>

                <div class="profile-section">
                    <div class="section-heading">
                        <div>
                            <h2>Listas públicas</h2>
                        </div>
                    </div>

                    ${renderLists(profile.lists || [])}
                </div>

            </section>
        `;

        container.querySelector(
            "[data-public-friend]"
        )?.addEventListener(
            "click",
            toggleFriend
        );
    }

    async function loadUserProfile() {
        if (!username) {
            renderMessage(
                "Perfil não identificado",
                "Abra um perfil selecionando um usuário na página de amizades."
            );

            return;
        }

        renderMessage(
            "Carregando perfil",
            `Buscando os dados de @${username}.`
        );

        try {
            const response = await fetch(
                `${PROFILE_API_BASE}${encodeURIComponent(username)}/`,
                {
                    headers: getHeaders(),
                }
            );

            const data = await response.json()
                .catch(() => null);

            if (!response.ok) {
                throw new Error(
                    data?.error ||
                    data?.detail ||
                    "Não foi possível carregar este perfil."
                );
            }

            renderProfile(data);

        } catch (error) {
            console.error(
                "Erro ao carregar perfil público:",
                error
            );

            renderMessage(
                "Erro ao carregar perfil",
                error.message ||
                "Não foi possível conectar ao servidor."
            );
        }
    }

    async function toggleFriend() {
        const profile = currentProfile;

        if (!profile) return;

        const token = localStorage.getItem("token");

        if (!token) {
            toast("Entre na sua conta para continuar.");
            return;
        }

        const button = container.querySelector(
            "[data-public-friend]"
        );

        if (button) button.disabled = true;

        try {
            let response;

            if (profile.is_friend) {
                if (!profile.friendship_id) {
                    throw new Error(
                        "Não foi possível identificar a amizade."
                    );
                }

                response = await fetch(
                    `${FRIENDSHIPS_API}${profile.friendship_id}/`,
                    {
                        method: "DELETE",
                        headers: getHeaders(),
                    }
                );

            } else {
                response = await fetch(
                    FRIENDSHIPS_API,
                    {
                        method: "POST",
                        headers: getHeaders(true),
                        body: JSON.stringify({
                            friend: profile.id,
                        }),
                    }
                );
            }

            const data = response.status === 204
                ? null
                : await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    data?.detail ||
                    "Não foi possível atualizar a amizade."
                );
            }

            toast(
                profile.is_friend
                    ? "Amizade removida."
                    : "Amizade adicionada."
            );

            await loadUserProfile();

        } catch (error) {
            console.error(
                "Erro ao atualizar amizade:",
                error
            );

            toast(
                error.message ||
                "Erro ao atualizar amizade."
            );

            if (button) button.disabled = false;
        }
    }

    async function render() {
        if (creatorKey) {
            const creator = Data.creators[creatorKey];

            if (creator) {
                renderCreator(creator);
                return;
            }
        }

        await loadUserProfile();
    }

    render();

})();