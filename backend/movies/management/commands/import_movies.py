import os
import requests
from django.core.management.base import BaseCommand
from movies.models import Movie


class Command(BaseCommand):
    help = "Busca e cadastra automaticamente apenas filmes brasileiros do TMDB no banco de dados."

    def add_arguments(self, parser):
        parser.add_argument(
            '--pages',
            type=int,
            default=1,
            help='Número de páginas para importar (cada página traz 20 filmes brasileiros).'
        )

    def handle(self, *args, **options):
        api_key = os.getenv("TMDB_API_KEY")
        
        if not api_key:
            self.stdout.write(
                self.style.ERROR("ERRO: TMDB_API_KEY não foi encontrada no arquivo .env!")
            )
            return

        pages = options['pages']
        total_criados = 0

        self.stdout.write(
            self.style.NOTICE(f"Iniciando a busca por filmes brasileiros no TMDB ({pages} página(s))...")
        )

        for page in range(1, pages + 1):
            url = (
                f"https://api.themoviedb.org/3/discover/movie"
                f"?api_key={api_key}"
                f"&language=pt-BR"
                f"&with_origin_country=BR"
                f"&sort_by=popularity.desc"
                f"&page={page}"
            )

            try:
                response = requests.get(url, timeout=10)
                if response.status_code != 200:
                    self.stdout.write(
                        self.style.ERROR(f"Erro ao acessar a página {page} da API (Status {response.status_code})")
                    )
                    continue

                data = response.json()
                resultados = data.get("results", [])

                for item in resultados:
                    tmdb_id = item.get("id")
                    title = item.get("title")
                    original_title = item.get("original_title", "")
                    synopsis = item.get("overview", "")
                    release_date = item.get("release_date") or None
                    
                    poster_path = item.get("poster_path")
                    backdrop_path = item.get("backdrop_path")

                    poster_url = f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else ""
                    backdrop_url = f"https://image.tmdb.org/t/p/original{backdrop_path}" if backdrop_path else ""

                    # Mapeia IDs de gêneros (lista de números do TMDB)
                    genre_ids = item.get("genre_ids", [])

                    # Utiliza o tmdb_id como chave principal para evitar duplicidades
                    movie, created = Movie.objects.get_or_create(
                        tmdb_id=tmdb_id,
                        defaults={
                            "title": title,
                            "original_title": original_title,
                            "synopsis": synopsis,
                            "release_date": release_date,
                            "poster_url": poster_url,
                            "backdrop_url": backdrop_url,
                            "genres": genre_ids,
                            "country": "Brasil",
                        }
                    )

                    if created:
                        total_criados += 1

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Erro inesperado na página {page}: {str(e)}"))

        self.stdout.write(
            self.style.SUCCESS(f"Importação concluída! {total_criados} novos filmes brasileiros foram inseridos.")
        )