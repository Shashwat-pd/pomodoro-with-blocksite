

let remainingTime = 0; 
let isActive = false; 
let isWorkMode;


let responseHandler;


const timerDisplay = document.getElementById("time");
const startStopBtn = document.getElementById("start-button");
const sessionCount = document.getElementById("session-count");
const breakCount = document.getElementById("break-count");
const switchBtn = document.getElementById("switch-button");

let timerDuration = 0.1*60*1000;



document.body.style.border = `5px solid white`;


function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}


function getCurrentState () {
  console.log("From getCurrentState")
  browser.runtime.sendMessage({ action: "getCurrentState" }).then((response) => {
    isActive = response.isActive;
    remainingTime = response.remainingTime;
    isWorkMode = response.isWorkMode;
    updateUI();
  }).catch(console.error);
}




function updateUI() {
  if(isActive){
    if(isWorkMode){
      switchBtn.textContent = "Start Break";
    }else{
      switchBtn.textContent = "Start Session";
    }
    startStopBtn.textContent = "Stop";
    timerDisplay.textContent = formatTime(remainingTime);
    switchBtn.disabled = false;
  }
  else{
    startStopBtn.textContent = "Start";
    switchBtn.disabled = true;
    timerDisplay.textContent = formatTime(timerDuration / 1000);
  }
  


}

function Start(){
  console.log("From Start")
  console.log(isActive);


  if (isActive) {
    console.log("Starting session...");
    browser.runtime.sendMessage({ action: "startSession" })
    }
  else {
    console.log("Stopping session...");
    browser.runtime.sendMessage({ action: "stopTimer" })
  }

}

function Switch(){
  if(isWorkMode){
    browser.runtime.sendMessage({ action: "startBreak" })
  }
  else{
    browser.runtime.sendMessage({ action: "startSession" })
  }
}


window.onload = () => {


startStopBtn.addEventListener("click", ()=> {
  console.log("Clicked")
  browser.runtime.sendMessage({ action: "flipActiveMode" }).then((response) => {
    console.log(isActive);
    isActive = response.isActive;
    console.log(isActive);

    Start();
  }).catch(console.error);
});
switchBtn.addEventListener("click", Switch);


getCurrentState();
}


browser.runtime.onMessage.addListener((message) => {
  if (message.action === "updateTimer") {
    console.log("here")
    getCurrentState();

  } else if (message.action === "timerStopped") {
    document.body.style.border = `5px solid ${message.borderColor}`;
  }
  else if (message.action === "sendNotification") {
    sendNotification();
  }
});

