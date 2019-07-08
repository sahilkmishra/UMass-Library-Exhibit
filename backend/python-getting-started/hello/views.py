from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from utils.parse import *

from .models import Greeting

# Create your views here.
def index(request):
    # return HttpResponse('Hello from Python!')
    return render(request, "index.html")


def db(request):
    greeting = Greeting()
    greeting.save()

    greetings = Greeting.objects.all()

    return render(request, "db.html", {"greetings": greetings})

def search(request):
    return JsonResponse({"8":"D"})