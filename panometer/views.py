# /usr/share/nginx/wiki/mysite/hedonometer/views.py

from django.shortcuts import render
from django.shortcuts import get_object_or_404
from django.http import HttpResponseRedirect, HttpResponse
from django.core.context_processors import csrf
from django.template import Context
import logging
logger = logging.getLogger(__name__)

# not using this right now
# from panometer.models import Meter

# Create your views here.

def dummy(request):
    return render(request, 'panometer/index.html')

def ometer(request,meter):
    # m = get_object_or_404(Meter,title=meter)
    template = meter+".html"
    return render(request, template) # ,{'model': m})
