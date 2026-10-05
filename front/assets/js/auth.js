(() => {
  const portal = document.getElementById("portal") || document.body;

  function icon(name) {
    const paths = {
      close: '<path d="M6 6l12 12M18 6 6 18"/>',
      check: '<path d="m5 12 4 4L19 6"/>'
    };
    return `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.check}</svg>`;
  }

  function modal(id, content) {
    const node = document.createElement("div");
    node.className = "modal-backdrop";
    node.dataset.modal = id;
    node.innerHTML = `<div class="app-modal md" role="dialog" aria-modal="true"><button class="modal-close" type="button" data-close-modal aria-label="Fechar">${icon("close")}</button>${content}</div>`;
    portal.appendChild(node);
    document.body.classList.add("modal-open");
    const close = () => {
      node.remove();
      document.body.classList.remove("modal-open");
    };
    node.querySelector("[data-close-modal]").addEventListener("click", close);
    node.addEventListener("click", event => { if (event.target === node) close(); });
    return { node, close };
  }

  document.querySelector("[data-login-form]")?.addEventListener("submit", event => {
    event.preventDefault();
    window.location.href = "pages/home.html";
  });

  document.querySelector("[data-signup]")?.addEventListener("click", () => {
    const { node, close } = modal("signup", `
      <div class="modal-form-head"><h2>Entre para o CineCena</h2><p>Fluxo demonstrativo de cadastro. A autenticação real será ligada ao backend futuramente.</p></div>
      <form class="modal-form" data-demo-form>
        <label>Nome<input type="text" required placeholder="Seu nome"></label>
        <label>E-mail<input type="email" required placeholder="voce@email.com"></label>
        <label>Senha<input type="password" required minlength="6" placeholder="Mínimo de 6 caracteres"></label>
        <div class="form-footer"><small>Ao continuar, você concorda com os termos.</small><button class="btn btn-primary" type="submit">Criar conta</button></div>
      </form>`);
    node.querySelector("[data-demo-form]")?.addEventListener("submit", event => {
      event.preventDefault();
      close();
      window.location.href = "pages/home.html";
    });
  });

  document.querySelector("[data-forgot]")?.addEventListener("click", () => {
    const { node } = modal("forgot", `
      <div class="modal-form-head"><h2>Esqueci a senha</h2><p>Informe seu e-mail. Nesta versão, o envio é apenas demonstrativo.</p></div>
      <form class="modal-form" data-forgot-form>
        <label>E-mail<input type="email" required placeholder="voce@email.com"></label>
        <div class="form-footer"><span></span><button class="btn btn-primary" type="submit">Enviar instruções</button></div>
      </form>`);
    node.querySelector("[data-forgot-form]")?.addEventListener("submit", event => {
      event.preventDefault();
      node.querySelector(".modal-form").innerHTML = `<div class="success-message">${icon("check")}<div><strong>Fluxo demonstrado</strong><p>Quando o backend estiver integrado, a recuperação será enviada por e-mail.</p></div></div>`;
    });
  });
})();
