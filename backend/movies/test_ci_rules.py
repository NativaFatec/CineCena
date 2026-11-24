from django.core.exceptions import ValidationError
from django.test import SimpleTestCase

from movies.models import Review
from movies.serializers import ReviewSerializer


class ReviewRulesTests(SimpleTestCase):

    def test_rating_accepts_valid_values(self):
        field = Review._meta.get_field('rating')

        for rating in range(1, 6):
            with self.subTest(rating=rating):
                self.assertEqual(
                    field.clean(rating, None), rating
                )

    def test_rating_rejects_out_of_range(self):
        field = Review._meta.get_field('rating')

        for rating in (0, 6):
            with self.subTest(rating=rating):
                with self.assertRaises(ValidationError):
                    field.clean(rating, None)

    def test_reaction_maps_to_rating(self):
        serializer = ReviewSerializer()

        for reaction, expected in [
            ('nao_gostei', 1),
            ('gostei', 3),
            ('amei', 5)
        ]:
            with self.subTest(reaction=reaction):
                result = serializer.validate(
                    {'reaction': reaction}
                )
                self.assertEqual(result['rating'], expected)