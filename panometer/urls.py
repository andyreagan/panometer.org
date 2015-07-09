# /usr/share/nginx/wiki/mysite/hedonometer/urls.py

from django.conf.urls import patterns, url, include
from django.views.generic import TemplateView,RedirectView

from tastypie.api import Api
# from panometer.api import ...

v1_api = Api(api_name='v1')
# v1_api.register(...)

from panometer import views

urlpatterns = patterns('',
    url(r'^index.html',
        TemplateView.as_view(template_name='panometer/index.html'),
        name='index'),
    url(r'^instruments/(?P<meter>[\w]+)/',views.ometer, name='ometer'),
    # url(r'^/svometer/(?P<rank>[\w]+)/',views.svometer, name='ometer'),
    (r'^api/', include(v1_api.urls)),
)

