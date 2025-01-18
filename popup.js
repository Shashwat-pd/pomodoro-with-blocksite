let remainingTime = 0; 
let isActive = false; 
let isWorkMode;
let timerDuration = 25*60*1000;
let sessionCount = 0;
let breakCount = 0;

let responseHandler;

const timerDisplay = document.getElementById("time");
const startStopBtn = document.getElementById("start-button");
const sessionCountDisplay = document.getElementById("session-count");
const breakCountDisplay = document.getElementById("break-count");
const switchBtn = document.getElementById("switch-button");


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
    sessionCount = response.sessionCount;
    breakCount = response.breakCount;
    console.log("From getCurrentState")
    console.log("sessionCount", sessionCount);
    console.log("breakCount", breakCount);
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
    sessionCountDisplay.textContent = sessionCount;
    breakCountDisplay.textContent = breakCount;

  }
  else{
    startStopBtn.textContent = "Start";
    switchBtn.disabled = true;
    timerDisplay.textContent = formatTime(timerDuration / 1000);
  }
  
  

}

function Start(){
  if (isActive) {
    browser.runtime.sendMessage({ action: "startSession" })
    }
  else {
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

function handleStartStopClick() {
  browser.runtime.sendMessage({ action: "flipActiveMode" })
    .then((response) => {
      isActive = response.isActive;
      console.log("Active state:", isActive);
      Start();
    })
    .catch((error) => {
      console.error("Error flipping active mode:", error);
    });
}

window.onload = () => {
  startStopBtn.addEventListener("click", handleStartStopClick);
  switchBtn.addEventListener("click", Switch);

  getCurrentState();
};


browser.runtime.onMessage.addListener((message) => {
  switch (message.action) {
    case "updateTimer":
      console.log("Timer state updated");
      isActive = message.isActive;
      isWorkMode = message.isWorkMode;
      remainingTime = message.remainingTime;
      sessionCount = message.sessionCount;
      breakCount = message.breakCount;
      updateUI();
      break;

    case "timerStopped":
      document.body.style.border = `5px solid ${message.borderColor}`;
      break;

    case "sendNotification":
      sendNotification();
      break;

    default:
      console.log("Unknown message action:", message.action);
  }
});