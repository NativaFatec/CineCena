window.CineCenaData = (() => {
  const curatedMovies = [
    [598, "Cidade de Deus", 2002, ["Drama", "Crime"]],
    ["ainda-estou-aqui", "Ainda Estou Aqui", 2024, ["Drama", "História"]],
    ["o-agente-secreto", "O Agente Secreto", 2025, ["Drama", "Suspense"]],
    ["oeste-outra-vez", "Oeste Outra Vez", 2024, ["Drama", "Faroeste"]],
    ["manas", "Manas", 2024, ["Drama"]],
    ["bacurau", "Bacurau", 2019, ["Drama", "Suspense"]],
    ["limite", "Limite", 1931, ["Drama", "Experimental"]],
    ["central-do-brasil", "Central do Brasil", 1998, ["Drama"]],
    ["cabra-marcado-para-morrer", "Cabra Marcado para Morrer", 1984, ["Documentário", "História"]],
    ["o-beijo-no-asfalto", "O Beijo no Asfalto", 1981, ["Drama"]],
    ["homem-com-h", "Homem com H", 2025, ["Drama", "Música"]],
    ["que-horas-ela-volta", "Que Horas Ela Volta?", 2015, ["Drama"]],
    ["estomago", "Estômago", 2007, ["Drama", "Comédia"]],
    ["carandiru", "Carandiru", 2003, ["Drama", "Crime"]],
    ["jogo-de-cena", "Jogo de Cena", 2007, ["Documentário"]],
    ["o-ultimo-azul", "O Último Azul", 2025, ["Drama", "Ficção científica"]],
    ["aquarius", "Aquarius", 2016, ["Drama"]],
    ["edificio-master", "Edifício Master", 2002, ["Documentário"]],
    ["a-hora-da-estrela", "A Hora da Estrela", 1985, ["Drama"]],
    ["terra-em-transe", "Terra em Transe", 1967, ["Drama", "Político"]],
    ["o-auto-da-compadecida", "O Auto da Compadecida", 2000, ["Comédia", "Aventura"]],
    ["bicho-de-sete-cabecas", "Bicho de Sete Cabeças", 2001, ["Drama"]],
    ["marighella", "Marighella", 2019, ["Drama", "História"]],
    ["deus-e-o-diabo", "Deus e o Diabo na Terra do Sol", 1964, ["Drama", "Faroeste"]],
    ["vidas-secas", "Vidas Secas", 1963, ["Drama"]],
    ["capitaes-da-areia", "Capitães da Areia", 2011, ["Drama", "Aventura"]],
    ["rio-40-graus", "Rio, 40 Graus", 1955, ["Drama"]],
    ["o-palhaco", "O Palhaço", 2011, ["Drama", "Comédia"]],
    ["bingo", "Bingo: O Rei das Manhãs", 2017, ["Drama", "Comédia"]],
    ["o-filho-de-mil-homens", "O Filho de Mil Homens", 2025, ["Drama", "Fantasia"]],
    ["terra-estrangeira", "Terra Estrangeira", 1995, ["Drama", "Crime"]],
    ["o-ceu-de-suely", "O Céu de Suely", 2006, ["Drama"]],
    ["a-vida-invisivel", "A Vida Invisível", 2019, ["Drama"]],
    ["o-homem-que-copiava", "O Homem que Copiava", 2003, ["Drama", "Comédia"]],
    ["saneamento-basico", "Saneamento Básico, o Filme", 2007, ["Comédia"]],
    ["2-coelhos", "2 Coelhos", 2012, ["Ação", "Crime"]],
    ["falsa-loura", "Falsa Loura", 2007, ["Drama"]],
    ["meu-nome-nao-e-johnny", "Meu Nome Não É Johnny", 2008, ["Drama", "Crime"]],
    ["virtuosas", "Virtuosas", 2026, ["Drama", "Terror"]],
    ["os-enforcados", "Os Enforcados", 2024, ["Suspense", "Crime"]],
    ["o-ano-em-que-meus-pais-sairam-de-ferias", "O Ano em que Meus Pais Saíram de Férias", 2006, ["Drama"]],
    ["minha-mae-e-uma-peca", "Minha Mãe é uma Peça", 2013, ["Comédia"]],
    ["o-menino-maluquinho", "O Menino Maluquinho: O Filme", 1995, ["Família", "Comédia"]],
    ["esta-noite-encarnarei", "Esta Noite Encarnarei no Teu Cadáver", 1967, ["Terror"]],
    ["rio-zona-norte", "Rio, Zona Norte", 1957, ["Drama", "Música"]],
    ["o-bandido-da-luz-vermelha", "O Bandido da Luz Vermelha", 1968, ["Crime", "Drama"]],
    ["sao-paulo-sociedade-anonima", "São Paulo Sociedade Anônima", 1965, ["Drama"]],
    ["macunaima", "Macunaíma", 1969, ["Comédia", "Fantasia"]],
    ["filme-demencia", "Filme Demência", 1986, ["Drama", "Fantasia"]],
    ["excitacao", "Excitação", 1976, ["Terror", "Drama"]],
    ["a-mulher-que-inventou-o-amor", "A Mulher que Inventou o Amor", 1980, ["Drama", "Romance"]],
    ["a-meia-noite-levarei-sua-alma", "À Meia-Noite Levarei Sua Alma", 1964, ["Terror"]],
    ["turma-da-monica-lacos", "Turma da Mônica: Laços", 2019, ["Família", "Aventura"]],
    ["turma-da-monica-uma-aventura-no-tempo", "Turma da Mônica em Uma Aventura no Tempo", 2007, ["Animação", "Família"]],
    ["o-menino-e-o-mundo", "O Menino e o Mundo", 2013, ["Animação", "Aventura"]],
    ["chico-bento-goiabeira", "Chico Bento e a Goiabeira Maraviósa", 2025, ["Família", "Aventura"]],
    ["2-filhos-de-francisco", "2 Filhos de Francisco", 2005, ["Drama", "Música"]],
    ["pixote", "Pixote: A Lei do Mais Fraco", 1980, ["Drama", "Crime"]],
    ["o-pagador-de-promessas", "O Pagador de Promessas", 1962, ["Drama"]],
    ["o-dragao-da-maldade", "O Dragão da Maldade contra o Santo Guerreiro", 1969, ["Drama", "Faroeste"]],
    ["eles-nao-usam-black-tie", "Eles Não Usam Black-Tie", 1981, ["Drama"]],
    ["ilha-das-flores", "Ilha das Flores", 1989, ["Documentário", "Comédia"]],
    ["o-som-ao-redor", "O Som ao Redor", 2012, ["Drama", "Suspense"]],
    ["santiago", "Santiago", 2007, ["Documentário"]],
    ["o-cheiro-do-ralo", "O Cheiro do Ralo", 2006, ["Drama", "Comédia"]],
    ["o-que-e-isso-companheiro", "O Que É Isso, Companheiro?", 1997, ["Drama", "História"]],
    ["feito-pipa", "Feito Pipa", 2026, ["Drama"]],
    ["o-pai-o", "Ó Paí, Ó", 2007, ["Comédia", "Música"]],
    ["de-pernas-pro-ar", "De Pernas pro Ar", 2010, ["Comédia"]],
    ["vai-que-cola", "Vai Que Cola: O Filme", 2015, ["Comédia"]],
    ["ate-que-a-sorte-nos-separe", "Até que a Sorte nos Separe", 2012, ["Comédia"]],
    ["se-eu-fosse-voce", "Se Eu Fosse Você", 2006, ["Comédia", "Romance"]],
    ["o-candidato-honesto", "O Candidato Honesto", 2014, ["Comédia"]],
    ["os-parcas", "Os Parças", 2017, ["Comédia"]],
    ["dona-flor-e-seus-dois-maridos", "Dona Flor e Seus Dois Maridos", 1976, ["Comédia", "Romance"]],
    ["xica-da-silva", "Xica da Silva", 1976, ["Drama", "História"]],
    ["o-cangaceiro", "O Cangaceiro", 1953, ["Drama", "Faroeste"]],
    ["ganga-bruta", "Ganga Bruta", 1933, ["Drama"]],
    ["sao-bernardo", "São Bernardo", 1972, ["Drama"]],
    ["memorias-do-carcere", "Memórias do Cárcere", 1984, ["Drama", "História"]],
    ["o-homem-que-virou-suco", "O Homem que Virou Suco", 1981, ["Drama", "Comédia"]],
    ["pra-frente-brasil", "Pra Frente, Brasil", 1982, ["Drama", "História"]],
    ["eu-sei-que-vou-te-amar", "Eu Sei que Vou Te Amar", 1986, ["Drama", "Romance"]],
    ["carlota-joaquina", "Carlota Joaquina, Princesa do Brazil", 1995, ["Comédia", "História"]],
    ["lavoura-arcaica", "Lavoura Arcaica", 2001, ["Drama"]],
    ["madame-sata", "Madame Satã", 2002, ["Drama"]],
    ["cinema-aspirinas-e-urubus", "Cinema, Aspirinas e Urubus", 2005, ["Drama"]],
    ["linha-de-passe", "Linha de Passe", 2008, ["Drama"]],
    ["tropa-de-elite", "Tropa de Elite", 2007, ["Drama", "Crime"]],
    ["tropa-de-elite-2", "Tropa de Elite 2: O Inimigo Agora é Outro", 2010, ["Drama", "Crime"]],
    ["hoje-eu-quero-voltar-sozinho", "Hoje Eu Quero Voltar Sozinho", 2014, ["Drama", "Romance"]],
    ["marte-um", "Marte Um", 2022, ["Drama"]],
    ["retratos-fantasmas", "Retratos Fantasmas", 2023, ["Documentário"]],
    ["motel-destino", "Motel Destino", 2024, ["Drama", "Suspense"]],
    ["deserto-particular", "Deserto Particular", 2021, ["Drama", "Romance"]],
    ["pequeno-segredo", "Pequeno Segredo", 2016, ["Drama"]],
    ["o-grande-circo-mistico", "O Grande Circo Místico", 2018, ["Drama", "Fantasia"]],
    ["ultima-parada-174", "Última Parada 174", 2008, ["Drama", "Crime"]],
    ["salve-geral", "Salve Geral", 2009, ["Drama", "Crime"]],
    ["lula-o-filho-do-brasil", "Lula, o Filho do Brasil", 2009, ["Drama", "Biografia"]]
  ].map(([id, title, year, genres], index) => ({
    id,
    catalogKey: String(id),
    title,
    searchTitle: title,
    year,
    genres,
    release_date: `${year}-01-01`,
    poster_path: null,
    overview: index === 0
      ? "Buscapé cresce em meio à violência da Cidade de Deus e encontra na fotografia uma forma de observar e contar o que acontece ao seu redor."
      : "Informações completas disponíveis quando a integração com o TMDB está ativa.",
    mock: true
  }));

  const featureMovies = [
    "Oeste Outra Vez",
    "Terra Estrangeira",
    "Terra em Transe",
    "Ainda Estou Aqui",
    "Rio, Zona Norte"
  ];

  const glauber = {
    id: "glauber-rocha",
    name: "Glauber Rocha",
    handle: "@glauberrocha",
    description: "Cineasta, roteirista e uma das figuras centrais do Cinema Novo. Perfil demonstrativo criado para apresentar a experiência social do CineCena.",
    friends: 28,
    watched: 46,
    reviews: 18,
    profilePath: null,
    favorites: [
      "Vidas Secas",
      "Limite",
      "O Pagador de Promessas",
      "Deus e o Diabo na Terra do Sol"
    ]
  };

  const creators = {
    kevin: { name: "Kevin Ramos", handle: "@kevin", description: "Criador do CineCena. Perfil de equipe preparado para futura integração com os usuários reais da plataforma." },
    pedro: { name: "Pedro Benetti", handle: "@pedro", description: "Criador do CineCena. Perfil de equipe preparado para futura integração com os usuários reais da plataforma." },
    gustavo: { name: "Gustavo Avelino", handle: "@gustavo", description: "Criador do CineCena. Perfil de equipe preparado para futura integração com os usuários reais da plataforma." },
    davi: { name: "Davi Farias", handle: "@davi", description: "Criador do CineCena. Perfil de equipe preparado para futura integração com os usuários reais da plataforma." }
  };

  const glauberReviews = [
    { movie: "Vidas Secas", year: 1963, text: "Um Brasil seco, direto e humano. A paisagem não é cenário: ela pesa sobre cada gesto e cada silêncio.", date: "Hoje, 14:32", loved: true },
    { movie: "Pixote: A Lei do Mais Fraco", year: 1980, text: "Cinema que encara a violência social sem transformar seus personagens em números. Duro e impossível de ignorar.", date: "Ontem, 21:05", loved: false },
    { movie: "Limite", year: 1931, text: "Uma experiência de imagem e ritmo que continua singular. O cinema brasileiro também nasce do risco formal.", date: "2 dias atrás", loved: true }
  ];

  const glauberPosts = [
    { type: "post", text: "Revisitando alguns marcos do cinema brasileiro. Quero montar uma lista só de filmes em que a paisagem muda completamente o modo de contar a história.", date: "Hoje, 11:48" },
    { type: "post", text: "Uma boa sessão dupla: Vidas Secas e Eles Não Usam Black-Tie. Filmes muito diferentes, mas com uma força política que nasce dos personagens.", date: "3 dias atrás" }
  ];

  const curatedLists = [
    {
      slug: "mais-vistos",
      title: "Filmes mais vistos",
      description: "Uma seleção de filmes muito presentes nas conversas da comunidade nesta versão do CineCena.",
      accent: "blue",
      movies: ["Cidade de Deus", "Ainda Estou Aqui", "O Auto da Compadecida", "Central do Brasil", "Bacurau", "Que Horas Ela Volta?", "Carandiru", "Minha Mãe é uma Peça", "Tropa de Elite", "O Homem que Copiava", "Estômago", "O Agente Secreto", "O Palhaço", "Bingo: O Rei das Manhãs", "2 Filhos de Francisco", "Ó Paí, Ó", "Se Eu Fosse Você"]
    },
    {
      slug: "cannes",
      title: "Brasil em Cannes",
      description: "Filmes brasileiros que passaram pelo Festival de Cannes em diferentes décadas e mostras.",
      accent: "yellow",
      movies: ["O Pagador de Promessas", "Terra em Transe", "O Dragão da Maldade contra o Santo Guerreiro", "Cidade de Deus", "Madame Satã", "Cinema, Aspirinas e Urubus", "Linha de Passe", "Aquarius", "Bacurau", "A Vida Invisível", "Motel Destino", "O Agente Secreto"]
    },
    {
      slug: "mais-curtidos",
      title: "Mais curtidos do CineCena",
      description: "Títulos que aparecem com frequência entre os filmes curtidos pela comunidade nesta demonstração.",
      accent: "green",
      movies: ["Cidade de Deus", "Central do Brasil", "Aquarius", "Estômago", "O Céu de Suely", "O Homem que Copiava", "Bicho de Sete Cabeças", "Pixote: A Lei do Mais Fraco", "Tropa de Elite", "Lavoura Arcaica", "O Cheiro do Ralo"]
    },
    {
      slug: "classicos",
      title: "Clássicos para começar",
      description: "Um caminho inicial por diferentes períodos do cinema brasileiro, com atenção especial às obras mais antigas.",
      accent: "blue",
      movies: ["Limite", "Ganga Bruta", "O Cangaceiro", "Rio, 40 Graus", "Rio, Zona Norte", "Vidas Secas", "Deus e o Diabo na Terra do Sol", "São Paulo Sociedade Anônima", "Terra em Transe", "O Bandido da Luz Vermelha", "Macunaíma", "São Bernardo", "Dona Flor e Seus Dois Maridos", "Xica da Silva", "Pixote: A Lei do Mais Fraco"]
    },
    {
      slug: "oscar-brasil",
      title: "Brasil rumo ao Oscar",
      description: "Filmes escolhidos em diferentes anos para representar o Brasil na disputa por uma vaga no Oscar de Filme Internacional.",
      accent: "yellow",
      movies: ["O Que É Isso, Companheiro?", "Central do Brasil", "Última Parada 174", "Salve Geral", "Lula, o Filho do Brasil", "O Palhaço", "O Som ao Redor", "Hoje Eu Quero Voltar Sozinho", "Que Horas Ela Volta?", "Pequeno Segredo", "Bingo: O Rei das Manhãs", "O Grande Circo Místico", "Deserto Particular", "Marte Um", "Retratos Fantasmas", "Ainda Estou Aqui", "O Agente Secreto", "Feito Pipa"]
    }
  ];

  return {
    curatedMovies,
    fallbackMovies: curatedMovies,
    featureMovies,
    glauber,
    creators,
    glauberReviews,
    glauberPosts,
    curatedLists
  };
})();
