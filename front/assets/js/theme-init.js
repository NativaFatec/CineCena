(function() {
    const key = "cinecena-theme";
    // Pega o tema salvo. Se não houver nenhum salvo, define explicitamente como 'light' (claro).
    const savedTheme = localStorage.getItem(key) || 'light';

    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
})();