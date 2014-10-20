# /usr/share/nginx/wiki/mysite/hedonometer/urls.py

from django.conf.urls import patterns, url, include
from django.views.generic import TemplateView,RedirectView

# from hedonometer import views
from tastypie.api import Api
# from hedonometer.api import EventResource,BookResource,RandomBookResource,HappsResource,WordResource,GeoHappsResource

v1_api = Api(api_name='v1')
# v1_api.register(EventResource())
# v1_api.register(HappsResource())
# v1_api.register(BookResource())
# v1_api.register(RandomBookResource())
# v1_api.register(WordResource())
# v1_api.register(GeoHappsResource())

urlpatterns = patterns('',
    url(r'^index.html',
        TemplateView.as_view(template_name='panometer/index.html'),
        name='index'),
    url(r'^insomniometer.html',
        TemplateView.as_view(template_name='panometer/insomniometer.html'),
        name='insomniometer'),
    url(r'^boredometer.html',
        TemplateView.as_view(template_name='panometer/boredometer.html'),
        name='boredometer'),
    (r'^api/', include(v1_api.urls)),
)

