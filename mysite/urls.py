from django.conf.urls import patterns, include, url

from django.contrib import admin
admin.autodiscover()

# not using, out of date
# import likes

urlpatterns = patterns('',
    url(r'^', include('panometer.urls',namespace='panometer')),
    url(r'^admin/', include(admin.site.urls)),
) 

# load the static files if in debug
from settings import DEBUG
if DEBUG:
    from django.conf.urls.static import static
    from django.conf import settings
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)




