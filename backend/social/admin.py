from django.contrib import admin
from .models import Comment, ReviewLike, Follow, MovieList, ListItem, Community, CommunityMembership

admin.site.register(Comment)
admin.site.register(ReviewLike)
admin.site.register(Follow)
admin.site.register(MovieList)
admin.site.register(ListItem)
admin.site.register(Community)
admin.site.register(CommunityMembership)
