# CineCena

> **Uma rede social para descobrir, avaliar e compartilhar opiniões sobre obras do cinema nacional brasileiro.**

O **CineCena** é um projeto acadêmico desenvolvido no âmbito do **Projeto Interdisciplinar (PI) da FATEC Itaquera**, com a proposta de criar uma plataforma voltada ao cinema nacional.

A aplicação permitirá que usuários descubram obras brasileiras, consultem informações sobre filmes, avaliem produções e compartilhem suas opiniões por meio de resenhas e comentários, criando uma experiência inspirada em plataformas de avaliação e interação social sobre cinema.

O projeto também busca valorizar e facilitar o acesso ao **cinema brasileiro**, reunindo informações sobre diferentes obras em uma única plataforma.

---

## Sobre o projeto

O CineCena foi desenvolvido como um projeto interdisciplinar do curso de **Desenvolvimento de Software Multiplataforma (DSM)** da **FATEC Itaquera**.

A plataforma terá características de uma rede social, permitindo que os usuários interajam com diferentes obras do cinema nacional e construam um histórico de suas experiências cinematográficas.

Entre os principais objetivos estão:

- Facilitar a descoberta de filmes brasileiros;
- Permitir a avaliação de obras;
- Possibilitar a publicação de resenhas e opiniões;
- Criar perfis de usuários;
- Permitir interações entre usuários;
- Criar listas e históricos de filmes;
- Disponibilizar busca e informações detalhadas sobre as obras;
- Incentivar o conhecimento e a valorização do cinema nacional.

---

## Funcionalidades

### Usuários

- Cadastro de usuários;
- Login e autenticação;
- Perfil de usuário;
- Histórico de avaliações;
- Lista de filmes avaliados;
- Interação com outros usuários.

### Filmes

- Busca de filmes;
- Página de detalhes da obra;
- Informações sobre elenco e produção;
- Pôsteres e imagens;
- Informações sobre o lançamento;
- Sinopse;
- Avaliação da comunidade.

### Avaliações

- Avaliação de filmes;
- Sistema de notas;
- Publicação de resenhas;
- Comentários;
- Curtidas/interações.

### Listas e histórico

- Criação e organização de listas;
- Registro de filmes avaliados;
- Histórico de obras visualizadas ou avaliadas.

> Algumas funcionalidades poderão sofrer alterações durante o desenvolvimento do projeto.

---

## Tecnologias

### Backend

- **Python**
- **Django**
- **Django REST Framework**

### Frontend

- **JavaScript**
- **JSX**
- **React** *(planejado)*

### Banco de dados

- **PostgreSQL**
- **Supabase**

### API externa

- **TMDB (The Movie Database)**

### Ferramentas

- Git
- GitHub
- Visual Studio Code

> A definição final da stack do frontend e de algumas ferramentas poderá ser ajustada durante o desenvolvimento.

---

## Arquitetura

A aplicação será estruturada seguindo uma arquitetura separando as responsabilidades entre frontend, backend, banco de dados e serviços externos.

```text
┌──────────────────────┐
│       Frontend       │
│   React / JavaScript │
│         JSX          │
└──────────┬───────────┘
           │
           │ HTTP / REST API
           ▼
┌──────────────────────┐
│       Backend        │
│       Django         │
│  Django REST API     │
└───────┬────────┬─────┘
        │        │
        │        │ API
        │        ▼
        │   ┌──────────────┐
        │   │     TMDB     │
        │   │ API de filmes│
        │   └──────────────┘
        │
        ▼
┌──────────────────────┐
│      PostgreSQL      │
│       Supabase       │
└──────────────────────┘
```

---


## Estrutura do projeto

A estrutura poderá seguir uma organização semelhante a:

```text
CineCena/
│
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── ...
│
├── docs/
│
├── .gitignore
├── LICENSE
└── README.md
```

A estrutura definitiva será atualizada conforme o desenvolvimento avançar.

---

## Equipe

Projeto desenvolvido por estudantes do curso de **Desenvolvimento de Software Multiplataforma (DSM)** da **FATEC Itaquera**.

| Integrante |
|---|
| Davi Farias |
| Gustavo Avelino |
| Kevin Ramos |
| Pedro Benetti |

As responsabilidades serão distribuídas entre frontend, backend, banco de dados, documentação, design e demais atividades necessárias ao desenvolvimento do projeto.

---

## Projeto Acadêmico

**Projeto Interdisciplinar (PI)**  
**Curso:** Desenvolvimento de Software Multiplataforma — DSM  
**Instituição:** FATEC Itaquera

O CineCena possui finalidade acadêmica e foi desenvolvido como parte das atividades do Projeto Interdisciplinar.

---

## Dados e API

O CineCena utiliza informações disponibilizadas pela **TMDB API** para complementar os dados das obras cinematográficas.

O **TMDB não é responsável pelo desenvolvimento ou manutenção do CineCena**. O uso da API e dos dados disponibilizados está sujeito aos termos e condições definidos pelo próprio serviço.

Os dados provenientes de serviços externos não estão sendo licenciados pela licença do código-fonte do CineCena.

Mais informações sobre a API e suas condições de utilização podem ser encontradas na documentação oficial do TMDB.

---

## 📄 Licença

O código-fonte desenvolvido pela equipe do CineCena está disponibilizado sob a licença **MIT**.

Isso significa que o código pode ser utilizado, modificado e redistribuído, desde que os termos da licença sejam respeitados.

Consulte o arquivo [`LICENSE`](LICENSE) para obter o texto completo da licença.

> A licença MIT se aplica ao código desenvolvido neste projeto e não substitui ou altera as licenças, termos de uso, direitos autorais ou condições aplicáveis a APIs, bibliotecas, frameworks, imagens, dados ou outros conteúdos de terceiros utilizados pelo projeto.

---

## Aviso

O CineCena é um projeto acadêmico em desenvolvimento. Funcionalidades, tecnologias, arquitetura e estrutura do sistema podem sofrer alterações ao longo do desenvolvimento.
