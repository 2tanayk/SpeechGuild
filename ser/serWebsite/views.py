from django.http.request import HttpRequest
from django.http.response import HttpResponse
from django.shortcuts import redirect, render
from django.contrib import messages
from django.contrib.auth import authenticate, login as auth_login, logout
from django.conf import settings

import os
import librosa
import keras
from keras.models import model_from_json
import tensorflow as tf
import json
import pickle
import numpy as np
from datetime import date,datetime
import calendar

from .forms import CreateUserForm
from .models import AudioClip
# Create your views here.

base_dir=os.path.dirname(settings.BASE_DIR).replace('\\','/')+'/ser'
media_dir= base_dir+'/media'
model_dir=base_dir+'/models'
clips_dir= media_dir+'/clips/'

json_file = open(model_dir+'/model_json.json', 'r')
loaded_model_json = json_file.read()
json_file.close()
loaded_model = model_from_json(loaded_model_json)

# load weights into new model
loaded_model.load_weights("C:/Users/tanay/DjangoProjects/SER/ser/models/Final_Model.h5")
print("Loaded model from disk")

# the optimiser
opt = tf.keras.optimizers.Adam(lr=0.0001)
loaded_model.compile(loss='categorical_crossentropy', optimizer=opt, metrics=['accuracy'])

sampling_rate=44100
audio_duration=2.5
n_mfcc = 30

emotion_list=['neutral','calm', 'happy', 'sad','angry','fearful','disgust','surprise']

def register(request):
    form = CreateUserForm()
    if request.method == 'POST':
        form = CreateUserForm(request.POST)
        if form.is_valid():
            user=form.save()
            username = form.cleaned_data.get('username')

            messages.success(request, 'Account was created for ' + username)

            return redirect('login')
            
    context={'form':form}
    return render(request, 'serWebsite/register.html',context)

def login(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password =request.POST.get('password')
        print(username,password)

        user = authenticate(request, username=username, password=password)

        if user is not None:
            auth_login(request, user)
            return redirect('home')
        else:
            messages.info(request, 'Username or Password is incorrect')
    context={}
    return render(request, 'serWebsite/login.html',context)

def logoutUser(request):
	logout(request)
	return redirect('home')

def home(request):
    context={}
    print(request.user.username)
    return render(request, 'serWebsite/landing-page.html', context)

def audioInput(request):
    emotion_index=-1
    if request.method == 'POST':
        print('request:',request.content_type)
        print('saving data to the database')
        print('request:',request.FILES['recorded']) 
        audio_obj=AudioClip.objects.create(audio=request.FILES['recorded'], user=request.user)

        data, sampling_rate = librosa.load(clips_dir+request.FILES['recorded'].name)

        newdf = prepare_data(clips_dir+request.FILES['recorded'].name, n = n_mfcc)

        newpred = loaded_model.predict(newdf, batch_size=16)
        filename = model_dir+'/labels'
        infile = open(filename,'rb')
        lb = pickle.load(infile)
        infile.close()
        # Get the final predicted label
        final = newpred.argmax(axis=1)
        final = final.astype(int).flatten()
        final = (lb.inverse_transform((final)))
        print(final[0])
        emotion_index=get_emotion(final[0])
        today=date.today()
        time=datetime.now()

        d_str = today.strftime("%B %d %Y")
        d_list=d_str.split(" ")

        audio_obj.emotion=emotion_list[emotion_index] 
        audio_obj.month= d_list[0]
        audio_obj.dd=d_list[1]
        audio_obj.yyyy=d_list[2]
        audio_obj.day=calendar.day_name[today.weekday()] 
        audio_obj.hour=time.hour
        audio_obj.minute=time.minute
        audio_obj.save()
        print('result:',final)

    context={}
    return render(request, 'serWebsite/input-audio.html', context)

def voiceBox(request):
    context={}
    return render(request, 'serWebsite/voice-box.html', context)

def speechEmotionRecognition(request):        
    context={}
    return render(request, 'serWebsite/speech-emotion.html', context)

def majorEmotion(request,e_id):
    print(e_id)
    voice_clips = AudioClip.objects.filter(emotion=emotion_list[e_id], user=request.user)
    print(voice_clips[0].emotion,voice_clips[0].audio.url)
    context={'clips':voice_clips}
    return render(request, 'serWebsite/emotion.html', context)

def prepare_data(path, n):
    X = np.empty(shape=(1, n, 216, 1))
    input_length = sampling_rate * audio_duration
    
    cnt = 0
    data, _ = librosa.load(path, sr=sampling_rate
                               ,res_type="kaiser_fast"
                               ,duration=2.5
                               ,offset=0.5
                              )

    # Random offset / Padding
    if len(data) > input_length:
        max_offset = len(data) - input_length
        offset = np.random.randint(max_offset)
        data = data[offset:(input_length+offset)]
    else:
        if input_length > len(data):
            max_offset = input_length - len(data)
            offset = np.random.randint(max_offset)
        else:
            offset = 0
        data = np.pad(data, (offset, int(input_length) - len(data) - offset), "constant")

   
    # MFCC extraction 
    MFCC = librosa.feature.mfcc(data, sr=sampling_rate, n_mfcc=n_mfcc)
    MFCC = np.expand_dims(MFCC, axis=-1)
    X[cnt,] = MFCC


    cnt += 1
    
    return X

def get_emotion(predicted_emotion):
    for index, emotion in enumerate(emotion_list):
        if emotion in predicted_emotion:
            print('matched!',emotion,index)
            return index
    else:
        print('None matched :(')
        return -1
        


