(() => {
  const portal = document.getElementById("portal") || document.body;
  const API_URL = "http://127.0.0.1:8000/api/accounts";

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

  // 1. AUTENTICAÇÃO / LOGIN REAL COM DJANGO
  document.querySelector("[data-login-form]")?.addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.target;
    const inputs = form.querySelectorAll("input");
    const loginInput = inputs[0]?.value.trim();
    const passwordInput = inputs[1]?.value.trim();
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!loginInput || !passwordInput) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "A entrar...";

    try {
      const response = await fetch(`${API_URL}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: loginInput, password: passwordInput })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        window.location.href = "pages/home.html";
      } else {
        alert(data.error || "Erro ao efetuar login.");
      }
    } catch (err) {
      console.error("Erro na requisição:", err);
      alert("Não foi possível conectar ao servidor backend.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Entrar no CineCena";
    }
  });

  // 2. MODAL E CADASTRO REAL COM DJANGO
  document.querySelector("[data-signup]")?.addEventListener("click", () => {
    const { node, close } = modal("signup", `
      <div class="modal-form-head"><h2>Entre para o CineCena</h2><p>Crie a sua conta para começar a interagir.</p></div>
      <form class="modal-form" data-signup-form>
        <label>Nome de usuário<input type="text" name="username" required placeholder="@usuario"></label>
        <label>E-mail<input type="email" name="email" required placeholder="voce@email.com"></label>
        <label>Senha<input type="password" name="password" required minlength="6" placeholder="Mínimo de 6 caracteres"></label>
        <div class="form-footer"><small>Ao continuar, você concorda com os termos.</small><button class="btn btn-primary" type="submit">Criar conta</button></div>
      </form>`);

    node.querySelector("[data-signup-form]")?.addEventListener("submit", async event => {
      event.preventDefault();
      const form = event.target;
      const username = form.querySelector('input[name="username"]')?.value.trim();
      const email = form.querySelector('input[name="email"]')?.value.trim();
      const password = form.querySelector('input[name="password"]')?.value.trim();
      const submitBtn = form.querySelector('button[type="submit"]');

      submitBtn.disabled = true;
      submitBtn.textContent = "A criar conta...";

      try {
        const response = await fetch(`${API_URL}/register/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          close();
          window.location.href = "pages/home.html";
        } else {
          alert(data.error || "Erro ao criar a conta.");
        }
      } catch (err) {
        console.error("Erro na requisição:", err);
        alert("Não foi possível conectar ao servidor backend.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Criar conta";
      }
    });
  });

  // 3. RECUPERAÇÃO DE SENHA (DEMONSTRATIVO)
  document.querySelector("[data-forgot]")?.addEventListener("click", () => {
    const { node } = modal("forgot", `
      <div class="modal-form-head"><h2>Esqueci a senha</h2><p>Informe seu e-mail para enviarmos as instruções.</p></div>
      <form class="modal-form" data-forgot-form>
        <label>E-mail<input type="email" required placeholder="voce@email.com"></label>
        <div class="form-footer"><span></span><button class="btn btn-primary" type="submit">Enviar instruções</button></div>
      </form>`);

    node.querySelector("[data-forgot-form]")?.addEventListener("submit", event => {
      event.preventDefault();
      node.querySelector(".modal-form").innerHTML = `<div class="success-message">${icon("check")}<div><strong>Instruções enviadas</strong><p>Se o e-mail estiver registado, receberá um link para redefinir a sua senha.</p></div></div>`;
    });
  });
})();