// Get the modal
var modal = document.getElementById("record-modal");

// Get the button that opens the modal
var recordBtn = document.getElementById("btnRcrd");
var uploadBtn = document.getElementById("btnUpload");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

var recordContainer = document.getElementById("record-modal-body");
var uploadContainer = document.getElementById("upload-modal-body");
var voiceRecordTimer= document.getElementById("recorder-time");
var micBtn = document.getElementById("mic-btn");
var voiceRecorder = document.getElementById("voice-recorder");
var micBtnLabel = document.getElementById("mic-label");
var resumePauseBtn = document.getElementById("resume-pause");
var stopBtn = document.getElementById("stop-btn");
var audioPlayerContainer = document.getElementById("audio-player-parent");
var audioPlayer = document.getElementById("audio-player");
var btnContainer = document.getElementById("action-btns");
var btnContainer2 = document.getElementById("action-btns-2");
var analyseBtn = document.getElementById("analyse");
var analyseBtn2 = document.getElementById("analyse-2");
var cancelBtn = document.getElementById("cancel");
var cancelBtn2 = document.getElementById("cancel-2");
var audioFileInput = document.getElementById("aud");


let audioIN = { audio: true };
var timerIsPaused=true;
var speechBlob=null;
var speechFile=null;

function formatTime(totalSeconds){
  let minutes = parseInt(totalSeconds/60);
  let seconds = totalSeconds%60;

  let timeStr='';

  if(minutes<10){
    timeStr+='0'+minutes+':';
  }else{
    timeStr+=minutes+':';
  }

  if(seconds<10){
    timeStr+='0'+seconds;
  }else{
    timeStr+=seconds;
  }

  console.log(timeStr)
  return timeStr;
}

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          // Does this cookie string begin with the name we want?
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
              cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
              break;
          }
      }
  }
  return cookieValue;
}

const csrftoken = getCookie('csrftoken');

function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

class Timer {
  constructor () {
    this.isRunning = false;
    this.startTime = 0;
    this.overallTime = 0;
  }

  _getTimeElapsedSinceLastStart () {
    if (!this.startTime) {
      return 0;
    }
  
    return Date.now() - this.startTime;
  }

  start () {
    if (this.isRunning) {
      return console.error('Timer is already running');
    }

    this.isRunning = true;

    this.startTime = Date.now();
  }

  stop () {
    if (!this.isRunning) {
      return console.error('Timer is already stopped');
    }

    this.isRunning = false;

    this.overallTime = this.overallTime + this._getTimeElapsedSinceLastStart();
  }

  reset () {
    this.overallTime = 0;

    if (this.isRunning) {
      this.startTime = Date.now();
      return;
    }

    this.startTime = 0;
  }

  getTime () {
    if (!this.startTime) {
      return 0;
    }

    if (this.isRunning) {
      return this.overallTime + this._getTimeElapsedSinceLastStart();
    }

    return this.overallTime;
  }
}

const timer = new Timer();

// When the user clicks on the button, open the modal
recordBtn.onclick = function() {
  modal.style.display = "block";
  uploadContainer.style.display="none";
  recordContainer.style.display="flex";
}

uploadBtn.onclick = function(){
  modal.style.display = "block";
  recordContainer.style.display="none";
  uploadContainer.style.display="flex";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  if(resumePauseBtn.classList.contains('blink-me')){
    resumePauseBtn.classList.remove('blink-me');
  }
  audioPlayerContainer.style.display="none";
  btnContainer.style.display="none";
  voiceRecorder.style.display="none";
  micBtn.style.display="flex";
  micBtnLabel.style.display="block";
  modal.style.display = "none";
  btnContainer2.style.display="none";

  timerIsPaused=true;
  try{
    timer.stop();
  }catch(err){
    console.log('error caught',err);
  }finally{
    timer.reset();
  }  
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

micBtn.addEventListener("click",()=>{
  micBtn.style.display="none";
  micBtnLabel.style.display="none";
  voiceRecorder.style.display="flex";

  navigator.mediaDevices.getUserMedia(audioIN).then(stream => {
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();
    timerIsPaused=!timerIsPaused;
    timer.start();
    const audioChunks = [];

    mediaRecorder.addEventListener("dataavailable", event => {
        audioChunks.push(event.data);
      });

    mediaRecorder.addEventListener("stop", ()=>{
      const audioBlob = new Blob(audioChunks, { 'type' : 'audio/wav' });
      speechBlob=audioBlob;
      const audioUrl = URL.createObjectURL(audioBlob);
      audioPlayer.src=audioUrl;
    });

    resumePauseBtn.addEventListener("click",()=>{
      if(!resumePauseBtn.classList.contains('blink-me')){
        resumePauseBtn.classList.add('blink-me');
        try{
          timer.stop();
        }catch(err){
          console.log(err)
        }finally{
          if(mediaRecorder.state==="recording"){
            mediaRecorder.pause();
          }
          timerIsPaused=!timerIsPaused;
        } 
      }else{
        try{
          timer.start();
        }catch(err){
          console.log(err);
        }finally{
          timerIsPaused=!timerIsPaused;
        if(mediaRecorder.state==="paused"){
          mediaRecorder.resume();
        }
        resumePauseBtn.classList.remove('blink-me');
        }
      } 
    })

    stopBtn.addEventListener("click",()=>{
      mediaRecorder.stop();
      timerIsPaused=!timerIsPaused;
      try{
        timer.stop();
      }catch(err){
        console.log('error!',err);
      }finally{
        timer.reset();
        voiceRecorder.style.display="none";
        audioPlayerContainer.style.display="flex";
        btnContainer.style.display="block";
      }
  });

  
  var observer = new MutationObserver(function(){
    if(voiceRecorder.style.display == 'none'){
      console.log('voice recorder is no longer visible', 'stopping the recording');
      if(mediaRecorder.state!=="inactive"){
        mediaRecorder.stop();
      } 
    }
  });
  observer.observe(voiceRecorder,{attributes:true});

  });

});

analyseBtn.addEventListener("click",()=>{
  if(speechBlob!=null){
    const formData = new FormData();
    formData.append("recorded",new File([speechBlob],`${uuidv4()}.wav`,{type:"audio/wav", lastModified:new Date().getTime()}));

    fetch("/input-audio/",{
      method:"POST",
      body: formData,
      headers: { "X-CSRFToken": csrftoken,},
    }).then(response => {
      console.log('Response:',response)
      if (response.ok) {
        window.location.href="/voice-box/";
        return response;
      }else {
        throw Error(`Server returned ${response.status}: ${response.statusText}`)
      }
    }).then(response => console.log(response))
      .catch(err => {
          alert(err);
      });
  }else{
    console.log('The speech blob is null')
  }
});

cancelBtn.addEventListener('click',()=>{
});

analyseBtn2.addEventListener('click',()=>{
  if(speechFile!=null){
    const formData = new FormData();
    formData.append("recorded", speechFile);
    
    fetch("/input-audio/",{
      method:"POST",
      body: formData,
      headers: { "X-CSRFToken": csrftoken,},
    }).then(response => {
      console.log('Response:',response)
      if (response.ok) {
        window.location.href="/voice-box/";
        return response;
      }else {
        throw Error(`Server returned ${response.status}: ${response.statusText}`)
      }
    }).then(response => console.log(response))
      .catch(err => {
          alert(err);
      });
  }else{
    console.log('the speech file is null');
  }
});

cancelBtn2.addEventListener('click',()=>{
});

audioFileInput.addEventListener('change',(e)=>{
  const fileList = e.target.files;
  speechFile=fileList[0];
  console.log(speechFile);
  btnContainer2.style.display="block";
})

setInterval(() => {
  if(!timerIsPaused){
    const timeInSeconds = Math.round(timer.getTime() / 1000);
    console.log(timeInSeconds);
    voiceRecordTimer.innerText = formatTime(timeInSeconds);
  }
}, 100)


