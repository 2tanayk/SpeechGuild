from django.contrib.auth.models import User
from django.db import models

class AudioClip(models.Model):
    audio = models.FileField(upload_to="clips/")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    emotion = models.CharField(max_length=100, blank=True, default='')
    month = models.CharField(max_length=100, blank=True, default='')
    dd = models.CharField(max_length=100, blank=True, default='')
    yyyy = models.CharField(max_length=100, blank=True, default='')
    hour = models.CharField(max_length=100, blank=True, default='')
    minute = models.CharField(max_length=100, blank=True, default='')
    day = models.CharField(max_length=100, blank=True, default='')
    real_date=models.DateTimeField(auto_now_add=True)
# Create your models here.
