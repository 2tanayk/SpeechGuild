from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

from . import views

urlpatterns = [
    path('', views.home, name="home"),
    path('register/', views.register, name="register"),
    path('login/', views.login, name="login"),
    path('input-audio/', views.audioInput, name="audio"),
    path('voice-box/', views.voiceBox, name="voice-box"),
    path('speech-emotion/', views.speechEmotionRecognition, name="speech-emotion"),
    path('emotion/<int:e_id>/', views.majorEmotion, name="emotion"),
    path('logout/', views.logoutUser, name="logout"),
]