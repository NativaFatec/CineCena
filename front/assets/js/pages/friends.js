(() => {
    const App = window.CineCena;

    if (!App) return;

    const { escapeHTML, icon, toast } = App;

    const API_URL =
        window.CINECENA_API.endpoint("follows/");

    const target = document.querySelector(
        "[data-friend-results]"
    );

    const search = document.querySelector(
        "[data-friend-search]"
    );

    if (!target || !search) return;

        let users = [];
        let suggestedUsers = [];
        let showingSuggestions = false;
        let searchTimeout = null;
        let requestNumber = 0;

    function getToken() {
        return localStorage.getItem("token");
    }

    function getHeaders(json = false) {
        const token = getToken();

        return {
            ...(json
                ? { "Content-Type": "application/json" }
                : {}),
            ...(token
                ? { "Authorization": `Token ${token}` }
                : {}),
        };
    }

    function initials(username = "") {
        return String(username)
            .trim()
            .slice(0, 2)
            .toUpperCase();
    }


    function getRelationId(value) {
    if (value && typeof value === "object") {
        return value.id ?? value.pk ?? null;
    }

    return value ?? null;
}

function normalizeProfile(user = {}) {
    const nestedUser =
        user.user && typeof user.user === "object"
            ? user.user
            : {};

    const profile =
        user.profile && typeof user.profile === "object"
            ? user.profile
            : (nestedUser.profile || {});

    const description = [
        user.description,
        user.bio,
        user.about,
        user.profile_description,
        profile.description,
        profile.bio,
        profile.about
    ].find(value =>
        typeof value === "string" && value.trim()
    ) || "";

    return {
        id: Number(
            user.id ??
            user.user_id ??
            nestedUser.id
        ),

        username:
            user.username ??
            nestedUser.username ??
            "",

        avatar:
            user.avatar ||
            user.avatar_url ||
            user.profile_avatar ||
            profile.avatar ||
            profile.avatar_url ||
            null,

        description: description.trim(),

        is_following: Boolean(user.is_following),

        follow_id:
            user.follow_id ??
            user.follow_relation_id ??
            null
    };
}

function normalizeFollow(follow) {
    const followed =
        follow.following &&
        typeof follow.following === "object"
            ? follow.following
            : (follow.following_user || {});

    const profile = followed.profile || {};

    return normalizeProfile({
        id:
            follow.following_id ??
            getRelationId(follow.following) ??
            followed.id,

        username:
            follow.following_username ??
            followed.username,

        avatar:
            follow.following_avatar ||
            followed.avatar ||
            followed.avatar_url ||
            profile.avatar ||
            profile.avatar_url,

        description:
            follow.following_description ||
            follow.following_bio ||
            followed.description ||
            followed.bio ||
            profile.description ||
            profile.bio,

        is_following: true,
        follow_id: follow.id
    });
}

function shuffleArray(items) {
    const shuffled = [...items];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [shuffled[i], shuffled[j]] =
            [shuffled[j], shuffled[i]];
    }

    return shuffled;
}



    function avatarHTML(user) {
        if (user.avatar) {
            return `
                <img
                    src="${escapeHTML(user.avatar)}"
                    alt="${escapeHTML(user.username)}"
                    loading="lazy"
                    style="
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        border-radius: 50%;
                    "
                >
            `;
        }

        return `
            <span
                style="
                    display: flex;
                    width: 100%;
                    height: 100%;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: #eaf2ff;
                    color: #075bc9;
                    font-weight: 700;
                "
            >
                ${escapeHTML(initials(user.username))}
            </span>
        `;
    }

    function renderMessage(title, description) {
        target.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    ${icon("search")}
                </div>

                <div>
                    <strong>${escapeHTML(title)}</strong>
                    <p>${escapeHTML(description)}</p>
                </div>
            </div>
        `;
    }

function renderUserCard(user) {
    const username = escapeHTML(user.username);

    const description = String(
        user.description || ""
    ).trim() || "Este usuário não tem descrição.";

    const buttonLabel = user.is_following
        ? "Deixar de seguir"
        : `${icon("plus")} Seguir`;

    const buttonClass = user.is_following
        ? "btn-secondary"
        : "btn-primary";

    const profileHref =
        "profileusers.html?username=" +
        encodeURIComponent(user.username);

    return `
        <article class="friend-card">
            <div class="friend-card-main">
                <div
                    class="friend-avatar"
                    style="
                        width: 92px;
                        height: 92px;
                        flex-shrink: 0;
                        overflow: hidden;
                        border-radius: 50%;
                    "
                >
                    ${avatarHTML(user)}
                </div>

                <div>
                    <h2>${username}</h2>

                    <small>@${username}</small>

                    <p>${escapeHTML(description)}</p>

                    ${
                        user.is_following
                            ? `
                                <span>
                                    Você segue este perfil.
                                </span>
                            `
                            : ""
                    }
                </div>
            </div>

            <div class="friend-card-actions">
                <button
                    class="btn ${buttonClass}"
                    type="button"
                    data-toggle-friend
                    data-user-id="${Number(user.id)}"
                >
                    ${buttonLabel}
                </button>

                <a
                    class="btn btn-ghost"
                    href="${escapeHTML(profileHref)}"
                >
                    Ver perfil
                </a>
            </div>
        </article>
    `;
}

function renderUsers() {
    if (showingSuggestions) {
        if (!users.length && !suggestedUsers.length) {
            renderMessage(
                "Nenhum perfil disponível",
                "Pesquise pelo nome de usuário para encontrar pessoas no CineCena."
            );

            return;
        }

        target.innerHTML = `
            ${
                users.length
                    ? `
                        <h2 style="grid-column: 1 / -1;">
                            Pessoas que você segue
                        </h2>

                        ${users.map(renderUserCard).join("")}
                    `
                    : ""
            }

            ${
                suggestedUsers.length
                    ? `
                        <h2 style="grid-column: 1 / -1;">
                            Perfis para conhecer
                        </h2>

                        ${suggestedUsers
                            .map(renderUserCard)
                            .join("")}
                    `
                    : `
                        <p style="grid-column: 1 / -1;">
                            Não encontramos outros perfis para sugerir no momento.
                        </p>
                    `
            }
        `;

        return;
    }

    if (!users.length) {
        renderMessage(
            search.value.trim()
                ? "Nenhum perfil encontrado"
                : "Nenhum perfil disponível",

            search.value.trim()
                ? "Tente pesquisar com outro nome de usuário."
                : "Pesquise pessoas pelo nome de usuário para começar a seguir."
        );

        return;
    }

    target.innerHTML = users.map(renderUserCard).join("");
}

    // Confere o dono das relações para funcionar mesmo com versões antigas
    // do backend que ainda ignoram ?follower=me.
    async function loadOwnFollows() {
        const [currentUser, follows] = await Promise.all([
            window.CINECENA_API.request("auth/me/"),
            window.CINECENA_API.list("follows/?follower=me"),
        ]);

                return follows.filter(follow =>
            Number(getRelationId(follow.follower)) ===
            Number(currentUser.id)
        );
    }

    async function searchProfiles(term) {
        const query = "search=" + encodeURIComponent(term);
        const response = await fetch(`${API_URL}search-users/?${query}`, {
            method: "GET",
            headers: getHeaders(),
        });
        const data = await response.json().catch(() => null);

        if (response.ok) {
            return Array.isArray(data) ? data : (data?.results || []);
        }

        // O backend publicado pode ainda não ter a nova ação de busca.
        // Reaproveita SOMENTE a pesquisa de usuários legada, não amizades.
        if (response.status === 404) {
            const legacyUrl = window.CINECENA_API.endpoint(
                `friendships/search-users/?${query}`
            );
            const legacyResponse = await fetch(legacyUrl, {
                method: "GET",
                headers: getHeaders(),
            });
            const legacyData = await legacyResponse.json().catch(() => null);

            if (!legacyResponse.ok) {
                throw new Error(
                    legacyData?.detail ||
                    `Não foi possível pesquisar usuários (HTTP ${legacyResponse.status}).`
                );
            }

            const found = Array.isArray(legacyData)
                ? legacyData
                : (legacyData?.results || []);
            const follows = await loadOwnFollows();
            
const followByUser = new Map(
    follows.map(follow => [
        Number(getRelationId(follow.following)),
        follow.id
    ])
);

return found.map(user => {
    const profile = normalizeProfile(user);
    const followId = followByUser.get(
        Number(profile.id)
    );

    return {
        ...profile,
        is_following: followByUser.has(
            Number(profile.id)
        ),
        follow_id: followId ?? null
    };
});

        }

        throw new Error(
            data?.detail ||
            data?.error ||
            `Não foi possível pesquisar usuários (HTTP ${response.status}).`
        );
    }

async function searchUsers() {
    const currentRequest = ++requestNumber;
    const term = search.value.trim();

    showingSuggestions = false;
    suggestedUsers = [];

    if (term.length === 1) {
        users = [];

        renderMessage(
            "Encontre pessoas",
            "Digite pelo menos dois caracteres para pesquisar usuários."
        );

        return;
    }

    if (!getToken()) {
        users = [];

        renderMessage(
            "Sessão não encontrada",
            "Entre na sua conta para pesquisar pessoas."
        );

        return;
    }

    renderMessage(
        term
            ? "Buscando usuários"
            : "Descobrindo perfis",

        "Aguarde enquanto procuramos contas no CineCena."
    );

    try {
        // Sem pesquisa: mostra quem você segue e sugere novas pessoas.
        if (!term) {
            const [currentUser, follows] = await Promise.all([
                window.CINECENA_API.request("auth/me/"),
                loadOwnFollows()
            ]);

            if (currentRequest !== requestNumber) return;

            users = follows.map(normalizeFollow);

            const followingIds = new Set(
                users.map(user => Number(user.id))
            );

            let found = [];

            // A busca vazia deve retornar os perfis disponíveis na API.
            try {
                found = await searchProfiles("");
            } catch (error) {
                console.warn(
                    "CineCena: não foi possível carregar sugestões:",
                    error
                );
            }

            if (currentRequest !== requestNumber) return;

            const uniqueProfiles = new Map();

            found
                .map(normalizeProfile)
                .filter(user =>
                    Number.isFinite(user.id) &&
                    user.id !== Number(currentUser.id) &&
                    Boolean(user.username) &&
                    !followingIds.has(user.id)
                )
                .forEach(user => {
                    uniqueProfiles.set(user.id, user);
                });

            suggestedUsers = shuffleArray(
                [...uniqueProfiles.values()]
            ).slice(0, 8);

            showingSuggestions = true;

            renderUsers();

            window.dispatchEvent(
                new Event("cinecena:friend-updated")
            );

            return;
        }

        // Com texto na pesquisa, mostra os resultados encontrados.
        const found = await searchProfiles(term);

        if (currentRequest !== requestNumber) return;

        users = found.map(normalizeProfile);

        renderUsers();

        window.dispatchEvent(
            new Event("cinecena:friend-updated")
        );

    } catch (error) {
        console.error(
            "CineCena: erro ao pesquisar usuários:",
            error
        );

        if (currentRequest === requestNumber) {
            renderMessage(
                "Erro ao pesquisar",
                error.message ||
                "Não foi possível conectar à API."
            );
        }
    }
}
    async function toggleFriend(userId, button) {
            const user = [...users, ...suggestedUsers].find(
            item => Number(item.id) === Number(userId)
        );

        if (!user || button.disabled) return;

        const token = getToken();

        if (!token) {
            toast("Entre na sua conta para continuar.");
            return;
        }

        button.disabled = true;

        try {
            let response;

            if (user.is_following) {
                if (!user.follow_id) {
                    throw new Error(
                        "Não foi possível identificar este seguimento. Atualize a pesquisa."
                    );
                }

                response = await fetch(
                    `${API_URL}${user.follow_id}/`,
                    {
                        method: "DELETE",
                        headers: getHeaders(),
                    }
                );

            } else {
                response = await fetch(
                    API_URL,
                    {
                        method: "POST",
                        headers: getHeaders(true),
                        body: JSON.stringify({
                            following: user.id,
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
                    "Não foi possível atualizar quem você segue."
                );
            }

            
if (user.is_following) {
    // Deixou de seguir o perfil
    user.is_following = false;
    user.follow_id = null;

    if (!search.value.trim()) {
        users = users.filter(
            item => Number(item.id) !== Number(user.id)
        );

        suggestedUsers = suggestedUsers.filter(
            item => Number(item.id) !== Number(user.id)
        );
    }

    toast("Você deixou de seguir este perfil.");

} else {
    // Começou a seguir o perfil
    user.is_following = true;
    user.follow_id = data?.id ?? null;

    if (!search.value.trim()) {
        suggestedUsers = suggestedUsers.filter(
            item => Number(item.id) !== Number(user.id)
        );

        if (!users.some(
            item => Number(item.id) === Number(user.id)
        )) {
            users.push(user);
        }
    }

    toast("Agora você segue este perfil.");
}


            renderUsers();
            window.dispatchEvent(new Event("cinecena:friend-updated"));

        } catch (error) {
            console.error(
                "CineCena: erro ao atualizar seguimento:",
                error
            );

            toast(
                error.message ||
                "Não foi possível atualizar quem você segue."
            );

        } finally {
            button.disabled = false;
        }
    }

    target.addEventListener("click", event => {
        const button = event.target.closest(
            "[data-toggle-friend]"
        );

        if (!button || !target.contains(button)) {
            return;
        }

        toggleFriend(
            button.dataset.userId,
            button
        );
    });

    search.addEventListener("input", () => {
        clearTimeout(searchTimeout);

        searchTimeout = setTimeout(
            searchUsers,
            250
        );
    });

    searchUsers();
})();