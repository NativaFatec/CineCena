(() => {
  const App = window.CineCena;
  const UI = window.CineCenaComponents;
  if (!App || !UI) return;

  const { Data, state, initials, icon } = App;
  let filter = "all";

  function renderStream() {
    const stream = document.querySelector("[data-feed-stream]");
    const empty = document.querySelector("[data-feed-empty]");
    if (!stream) return;

    stream.innerHTML = UI.feedEntries();
    const cards = [...stream.querySelectorAll("[data-feed-kind]")];

    cards.forEach(card => {
      const kinds = card.dataset.feedKind.split(" ");
      let visible = filter === "all" || kinds.includes(filter);
      if (filter === "friend" && !state.friend) visible = false;
      card.classList.toggle("hidden", !visible);
    });

    const visibleCount = cards.filter(card => !card.classList.contains("hidden")).length;
    empty?.classList.toggle("hidden", visibleCount > 0);
  }

  function renderSide() {
    const avatar = document.querySelector("[data-feed-glauber-avatar]");
    if (avatar) avatar.innerHTML = UI.profileAvatar("md");
    document.querySelectorAll("[data-feed-own-avatar]").forEach(node => { node.textContent = initials(state.profile.name); });
  }

  document.querySelectorAll("[data-feed-filter]").forEach(button => {
    button.addEventListener("click", () => {
      filter = button.dataset.feedFilter;
      document.querySelectorAll("[data-feed-filter]").forEach(item => item.classList.toggle("active", item === button));
      renderStream();
    });
  });

  renderStream();
  renderSide();
  window.addEventListener("cinecena:social-updated", renderStream);
  window.addEventListener("cinecena:profile-updated", () => { renderStream(); renderSide(); });
  window.addEventListener("cinecena:movies-updated", renderSide);
})();
