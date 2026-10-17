# CineCena — Backend inicial

Backend inicial do CineCena, projeto acadêmico de rede social para descoberta, avaliação e discussão de filmes, com foco no cinema brasileiro.

## Stack

- Python 3.11+
- Django 5.1/5.2
- Django REST Framework
- PostgreSQL
- DRF TokenAuthentication (token no login/cadastro)
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

## Licença

Consulte a licença do projeto principal antes de distribuir este backend separadamente.

## Atualização da integração (2026-10-17)

O módulo `social` agora inclui posts, curtidas de posts, comentários de posts e estados de filmes. O módulo `accounts` pode manter avatares novos no banco de dados; os arquivos antigos continuam aceitos enquanto acessíveis. Para ativar as novas tabelas, execute `python manage.py migrate` no ambiente com `DATABASE_URL` configurado. Para GitHub Pages + Render, inclua `https://nativafatec.github.io` em `CORS_ALLOWED_ORIGINS` quando definida externamente.
