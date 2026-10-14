
(() => {
  const baseUrl = "https://cinecena.onrender.com";

  window.CINECENA_API = {
    baseUrl,

    endpoint(path) {
      const cleanPath = String(path).replace(/^\/+/, "");
      return `${baseUrl}/api/${cleanPath}`;
    }
  };
})();

