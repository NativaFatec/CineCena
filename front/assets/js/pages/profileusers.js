
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

    const FOLLOWS_API =
    window.CINECENA_API.endpoint("follows/");

    let currentProfile = null;
    let profileLoadSequence = 0;
    let loadedToken = localStorage.getItem("token");



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
                        <strong>Ainda não segue ninguém</strong>
                        <p>
                            Este usuário ainda não segue ninguém.
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
                                · ${review.reaction === "amei" ? "❤️ Amei" : review.reaction === "gostei" ? "👍 Gostei" : review.reaction === "nao_gostei" ? "👎 Não gostei" : `${Number(review.rating)}/5`}
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
                        profile.is_following
                            ? "btn-secondary"
                            : "btn-primary"
                    }"
                    type="button"
                    data-public-friend
                >
                    ${
                        profile.is_following
                            ? "Deixar de seguir"
                            : `${icon("plus")} Seguir`
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

            <section class="shell profile-stats" data-public-profile-counters>
                <div>
                    <button class="profile-stat-button" type="button" data-profile-connections="following" aria-label="Ver quem este usuário segue">
                        <strong>${Number(profile.following_count || 0)}</strong>
                        <span>Seguindo</span>
                    </button>
                </div>
                <div>
                    <button class="profile-stat-button" type="button" data-profile-connections="followers" aria-label="Ver seguidores deste usuário">
                        <strong>${Number(profile.followers_count || 0)}</strong>
                        <span>Seguidores</span>
                    </button>
                </div>
                <div>
                    <strong>${Number(profile.watched_count || 0)}</strong>
                    <span>Filmes assistidos</span>
                </div>
                <div>
                    <strong>${Number(profile.reviews_count || 0)}</strong>
                    <span>Reviews</span>
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
                            <h2>Seguindo</h2>
                            <p>
                                Até três perfis que @${escapeHTML(profile.username)} segue.
                            </p>
                        </div>
                    </div>

                    ${renderFriends(profile.following || [])}
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

        container.querySelector("[data-public-profile-counters]")?.addEventListener("click", event => {
            const button = event.target.closest("[data-profile-connections]");
            if (button) UI.openConnectionsModal(profile.username, button.dataset.profileConnections);
        });
    }

    // A API de perfis publicos pode estar em uma versao anterior no Render.
    // O relacionamento e conferido diretamente na tabela Follow via API,
    // em vez de depender de is_following/follow_id presentes no perfil.
    async function resolveFollowingFromDatabase(profile, token) {
        if (!token) {
            return {
                ...profile,
                is_following: false,
                follow_id: null,
            };
        }

        const [me, follows] = await Promise.all([
            window.CINECENA_API.request("auth/me/"),
            window.CINECENA_API.list("follows/?follower=me"),
        ]);

        const viewerId = Number(me.id);
        const profileId = Number(profile.id);
        if (!Number.isSafeInteger(viewerId) || !Number.isSafeInteger(profileId)) {
            throw new Error("A API nao retornou os identificadores dos usuarios.");
        }

        // Alguns deploys anteriores ignoram follower=me. Por isso
        // conferimos tambem o ID do proprietario de cada relacionamento.
        const ownFollow = follows.find(item =>
            Number(item.follower) === viewerId &&
            Number(item.following) === profileId
        );

        return {
            ...profile,
            is_self: viewerId === profileId,
            is_following: Boolean(ownFollow),
            follow_id: ownFollow?.id ?? null,
        };
    }

    // A lista de "Seguindo" deve pertencer ao dono do perfil visitado,
    // e NAO ao usuario autenticado. A resposta /users/ de alguns deploys
    // ainda usa dados antigos de amizade ou nao traz "following".
    // O endpoint /follows/ e a fonte dos relacionamentos Follow no Django.
    async function resolvePublicFollowingFromDatabase(profile, token) {
        // A listagem de Follow no backend atual exige autenticacao.
        // Quando visitante nao esta logado, preserva os dados publicos
        // retornados pela rota de perfil (se disponiveis).
        if (!token) return profile;

        const profileId = Number(profile.id);
        if (!Number.isSafeInteger(profileId)) {
            throw new Error("A API nao retornou o ID do perfil visitado.");
        }

        // Nao usar ?follower=me: isso traria quem a conta logada segue
        // (ex.: 1000), e nao quem gustavelino segue.
        // O backend filtra relacoes em que o perfil aparece como seguidor
        // ou seguido. O filtro por ID abaixo distingue os dois sentidos.
        const relationships = await window.CINECENA_API.list(
            `follows/?username=${encodeURIComponent(profile.username)}`
        );
        const following = relationships
            .filter(item => Number(item.follower) === profileId)
            .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
        const followersCount = relationships.filter(item =>
            Number(item.following) === profileId
        ).length;

        const preview = following.slice(0, 3).map(item => {
            // Nas versoes atuais e anteriores do serializer Follow, este
            // campo ja vem diretamente do usuario seguido.
            const username = item.following_username ||
                (profile.following || []).find(user => Number(user.id) === Number(item.following))?.username;

            if (!username) {
                throw new Error("A API Follow nao retornou o nome do usuario seguido.");
            }

            return {
                id: item.following,
                username,
                avatar: normalizeAvatarURL(item.following_avatar ||
                    (profile.following || []).find(user => Number(user.id) === Number(item.following))?.avatar),
            };
        });

        return {
            ...profile,
            following_count: following.length,
            followers_count: followersCount,
            following: preview,
        };
    }

    async function loadUserProfile() {
        const sequence = ++profileLoadSequence;
        const token = localStorage.getItem("token");
        loadedToken = token;

        if (!username) {
            renderMessage(
                "Perfil não identificado",
                "Abra um perfil selecionando um usuário na página Seguindo."
            );
            return null;
        }

        renderMessage(
            "Carregando perfil",
            `Buscando os dados de @${username}.`
        );

        try {
            const response = await fetch(
                `${PROFILE_API_BASE}${encodeURIComponent(username)}/`,
                {
                    headers: token ? { "Authorization": `Token ${token}` } : {},
                    cache: "no-store",
                }
            );
            const data = await response.json().catch(() => null);

            // Trocar de conta em outra guia invalida resultados pendentes.
            if (sequence !== profileLoadSequence || token !== localStorage.getItem("token")) {
                return null;
            }
            if (!response.ok) {
                throw new Error(
                    data?.error ||
                    data?.detail ||
                    "Não foi possível carregar este perfil."
                );
            }

            const profileWithFollow = await resolveFollowingFromDatabase(data, token);
            if (sequence !== profileLoadSequence || token !== localStorage.getItem("token")) {
                return null;
            }

            const profileWithPublicFollowing = await resolvePublicFollowingFromDatabase(profileWithFollow, token);
            if (sequence !== profileLoadSequence || token !== localStorage.getItem("token")) {
                return null;
            }

            renderProfile(profileWithPublicFollowing);
            return profileWithPublicFollowing;
        } catch (error) {
            if (sequence !== profileLoadSequence || token !== localStorage.getItem("token")) {
                return null;
            }
            console.error("Erro ao carregar perfil público:", error);
            renderMessage(
                "Erro ao conferir perfil no banco",
                error.message ||
                "Não foi possível confirmar seu relacionamento com este usuário."
            );
            return null;
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

            if (profile.is_following) {
                if (!profile.follow_id) {
                    throw new Error(
                        "Não foi possível identificar este seguimento."
                    );
                }

                response = await fetch(
                    `${FOLLOWS_API}${profile.follow_id}/`,
                    {
                        method: "DELETE",
                        headers: getHeaders(),
                    }
                );

            } else {
                response = await fetch(
                    FOLLOWS_API,
                    {
                        method: "POST",
                        headers: getHeaders(true),
                        body: JSON.stringify({
                            following: profile.id,
                        }),
                    }
                );
            }

            const data = response.status === 204
                ? null
                : await response.json().catch(() => null);

            if (token !== localStorage.getItem("token")) {
                await loadUserProfile();
                throw new Error("A conta conectada mudou. Confira o perfil antes de tentar novamente.");
            }

            if (!response.ok) {
                throw new Error(
                    data?.detail ||
                    "Não foi possível atualizar quem você segue."
                );
            }

            // Nao mostrar sucesso apenas porque o POST/DELETE retornou 2xx:
            // o novo estado precisa aparecer em outra consulta ao banco.
            const updatedProfile = await loadUserProfile();
            if (!updatedProfile ||
                updatedProfile.is_following === Boolean(profile.is_following)) {
                throw new Error(
                    "A API respondeu, mas nao confirmou a mudanca no banco. Atualize a pagina e tente novamente."
                );
            }

            toast(
                profile.is_following
                    ? "Você deixou de seguir este perfil."
                    : "Agora você segue este perfil."
            );
            window.dispatchEvent(new Event("cinecena:friend-updated"));

        } catch (error) {
            console.error(
                "Erro ao atualizar seguimento:",
                error
            );

            toast(
                error.message ||
                "Erro ao atualizar seguimento."
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

    // Uma troca de conta em outra guia deve atualizar o estado do botao.
    window.addEventListener("storage", event => {
        if (event.key === "token" || event.key === "user" || event.key === null) {
            if (!creatorKey) loadUserProfile();
        }
    });

    // Atualiza quando a guia volta a ter foco (ex.: login em outra guia).
    window.addEventListener("focus", () => {
        if (!creatorKey && loadedToken !== localStorage.getItem("token")) {
            loadUserProfile();
        }
    });

    render();

})();