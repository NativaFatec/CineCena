# CineCena — Backend inicial

Backend inicial do CineCena, projeto acadêmico de rede social para descoberta, avaliação e discussão de filmes, com foco no cinema brasileiro.

## Stack

- Python 3.11+
- Django 5.1/5.2
- Django REST Framework
- PostgreSQL
- JWT (Simple JWT)
- Docker Compose para desenvolvimento local

> Este repositório é uma base inicial. A integração com TMDB, testes automatizados, moderação, recuperação de senha, notificações e deploy ainda precisam ser implementados.

## Apps

- `accounts`: usuário customizado, cadastro, perfil privado e perfil público.
- `movies`: catálogo de filmes e avaliações/resenhas.
- `social`: comentários, curtidas, seguidores, listas e comunidades.
- `config`: configurações e rotas centrais.

## Requisitos

- Python 3.11 ou superior
- Docker Desktop (ou PostgreSQL instalado localmente)

## Executar no Windows (PowerShell)

```powershell
# 1. Entre na pasta backend
cd CineCena-backend

# 2. Crie e ative o ambiente virtual
py -m venv .venv
.\.venv\Scripts\Activate.ps1

# 3. Instale as dependências
pip install -r requirements.txt

# 4. Crie o arquivo de ambiente
Copy-Item .env.example .env

# 5. Suba o PostgreSQL
docker compose up -d db

# 6. Crie as tabelas
python manage.py makemigrations accounts movies social
python manage.py migrate

# 7. Crie um usuário administrador
python manage.py createsuperuser

# 8. Inicie a API
python manage.py runserver
```

API local: `http://127.0.0.1:8000/api/`  
Admin Django: `http://127.0.0.1:8000/admin/`

Se preferir usar SQLite apenas para experimentar, deixe `DATABASE_URL` ausente no `.env`; para o desenvolvimento previsto do projeto, use PostgreSQL.

## Endpoints iniciais

| Método | Endpoint | Finalidade | Acesso |
|---|---|---|---|
| POST | `/api/auth/register/` | Cadastro | Público |
| POST | `/api/auth/token/` | Login, retorna access/refresh JWT | Público |
| POST | `/api/auth/token/refresh/` | Renovar access token | Público |
| GET/PATCH | `/api/auth/me/` | Consultar/editar o próprio perfil | Autenticado |
| GET | `/api/users/<username>/` | Perfil público | Público |
| GET/POST | `/api/movies/` | Listar/criar filmes | Leitura pública; escrita autenticada |
| GET/PATCH/DELETE | `/api/movies/<id>/` | Detalhes/edição/exclusão de filme | Escrita autenticada |
| GET/POST | `/api/reviews/` | Feed de avaliações / criar avaliação | Leitura pública; escrita autenticada |
| POST | `/api/reviews/<id>/like/` | Alternar curtida | Autenticado |
| GET/POST | `/api/comments/` | Listar/criar comentários | Leitura pública; escrita autenticada |
| GET/POST | `/api/lists/` | Listar/criar listas | Leitura pública; escrita autenticada |
| POST | `/api/lists/<id>/items/` | Adicionar filme a uma lista | Proprietário |
| DELETE | `/api/lists/<id>/items/<item_id>/` | Remover filme de uma lista | Proprietário |
| GET/POST | `/api/follows/` | Consultar/criar seguimento | Autenticado |
| DELETE | `/api/follows/<id>/` | Deixar de seguir (registro próprio) | Proprietário |
| GET/POST | `/api/communities/` | Listar/criar comunidades | Leitura pública; escrita autenticada |
| POST/DELETE | `/api/communities/<id>/membership/` | Entrar/sair de uma comunidade | Autenticado |

A paginação padrão retorna objetos no formato `count`, `next`, `previous` e `results`.

## Exemplos de requisições

### 1. Cadastro

```http
POST /api/auth/register/
Content-Type: application/json
```

```json
{
  "username": "gustavo",
  "email": "gustavo@example.com",
  "password": "uma-senha-forte",
  "first_name": "Gustavo"
}
```

### 2. Login

```http
POST /api/auth/token/
Content-Type: application/json
```

```json
{
  "username": "gustavo",
  "password": "uma-senha-forte"
}
```

Use o token retornado nas rotas protegidas:

```http
Authorization: Bearer SEU_ACCESS_TOKEN
```

### 3. Criar um filme

```http
POST /api/movies/
Authorization: Bearer SEU_ACCESS_TOKEN
Content-Type: application/json
```

```json
{
  "title": "Exemplo de filme brasileiro",
  "synopsis": "Sinopse de demonstração.",
  "release_date": "2024-01-25",
  "country": "Brasil",
  "genres": ["Drama"],
  "cast": []
}
```

### 4. Publicar uma avaliação

```http
POST /api/reviews/
Authorization: Bearer SEU_ACCESS_TOKEN
Content-Type: application/json
```

```json
{
  "movie": 1,
  "rating": 5,
  "title": "Uma ótima experiência",
  "body": "Minha resenha do filme.",
  "is_spoiler": false
}
```

Cada usuário pode ter uma avaliação por filme. Notas permitidas: 1 a 5.

## Conectar o frontend atual

O frontend HTML/CSS/JavaScript do ZIP original pode ser mantido. Para desenvolvimento, sirva-o com uma extensão de servidor local (por exemplo, Live Server) e ajuste `CORS_ALLOWED_ORIGINS` no `.env` para a origem exata usada pelo servidor. Evite abrir páginas diretamente com `file://`.

Exemplo JavaScript para buscar o feed de avaliações:

```javascript
const response = await fetch("http://127.0.0.1:8000/api/reviews/");
const data = await response.json();
console.log(data.results);
```

Para ações autenticadas, envie o cabeçalho `Authorization: Bearer <access_token>`. Em produção, não armazene tokens sensíveis sem avaliar os riscos de XSS; considere uma estratégia de sessão/cookies seguros se a arquitetura exigir.

## Banco de dados

O modelo de usuário customizado está configurado antes da primeira migration, como recomendado pelo Django. Se já tiver criado migrations ou tabelas com outro modelo de usuário, não troque `AUTH_USER_MODEL` em um banco existente sem planejar a migração.

## Segurança e próximos passos

Antes de publicar:
1. Definir `DJANGO_SECRET_KEY` forte e `DJANGO_DEBUG=False`.
2. Restringir `ALLOWED_HOSTS` e `CORS_ALLOWED_ORIGINS`.
3. Usar HTTPS e configurar cookies/headers de segurança.
4. Adicionar testes automatizados para autenticação, permissões, listas e avaliações.
5. Adicionar validação e moderação de conteúdo.
6. Implementar integração segura com TMDB (chave somente no backend).
7. Avaliar limites de requisições, logs, backups e política de privacidade.
8. Configurar pipeline de CI e deploy.

## Licença

Consulte a licença do projeto principal antes de distribuir este backend separadamente.
