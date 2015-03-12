from django.contrib import admin

# Register your models here.
from panometer.models import Meter

# class EventAdmin(admin.ModelAdmin):
#     search_fields = ('longer',)
#     ordering = ('-date',)
#     save_as = True
#     list_display = ('date','caption','importance','x','y','shorter',)
#     list_display_links = ('caption',)
#     list_editable = ('importance','x','y',)

admin.site.register(Meter)

