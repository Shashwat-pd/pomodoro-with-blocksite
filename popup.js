const timerDisplay = document.getElementById("time");
const startStopBtn = document.getElementById("start-button");
const sessionCount = document.getElementById("session-count");
const breakCount = document.getElementById("break-count");
const switchBtn = document.getElementById("switch-button");

let isActive = false;


let isWorkMode = browser.runtime.sendMessage({ action: "getTimerState" }).then((response) => {
  return response.isWorkMode;
}).catch(console.error);


document.body.style.border = `5px solid white`;


function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}

function updateUI() {
  browser.runtime.sendMessage({ action: "getTimerState" }).then((response) => {
    if (response) {
      if (response.remainingTime > 1) {
        timerDisplay.textContent = formatTime(response.remainingTime);
        sessionCount.textContent = response.sessionCount;
        breakCount.textContent = response.breakCount;
        startStopBtn.textContent = response.isWorkMode ? "Stop Session" : "Start Session";
        switchBtn.textContent = response.isWorkMode ? "Start Break" : "Stop Break";
        document.body.style.border = `5px solid ${response.borderColor}`;
      } else {
        if (isActive){
        let i = 0; 
        const forwardTimer = setInterval(() => {
          if (!response.isWorkMode) {
            clearInterval(forwardTimer); 
            return;
          }
          timerDisplay.textContent = formatTime(i);
          i++;
        }, 1000); 
      }
    }
    }
  }).catch(console.error);
}






function Start(){
  isActive = !isActive;

  if (startStopBtn.textContent === "Start Session") {
    console.log("Starting session...");
    browser.runtime.sendMessage({ action: "startSession" })
    }
  else if (startStopBtn.textContent === "Stop Session") {

    browser.runtime.sendMessage({ action: "stopTimer" })
  }

}

function Switch(){
  if (switchBtn.textContent === "Start Break") {
    console.log("Starting break...");
    browser.runtime.sendMessage({ action: "startBreak" }).then((response) => {
      if (response) {
        switchBtn.textContent = "Stop Break";
      }
    }).catch(console.error);
  } else if (switchBtn.textContent === "Stop Break") {
    console.log("Stopping break...");
    browser.runtime.sendMessage({ action: "stopTimer" }).then((response) => {
      if (response) {
        switchBtn.textContent = "Start Break";
      }
    }).catch(console.error);
  }
}


window.onload = () => {
  startStopBtn.addEventListener("click", () => Start());
  switchBtn.addEventListener("click", () => Switch());
  updateUI();
}


browser.runtime.onMessage.addListener((message) => {
  if (message.action === "updateTimer") {
    updateUI();

  } else if (message.action === "timerStopped") {
    timerDisplay.textContent = "05:00";
    document.body.style.border = `5px solid ${message.borderColor}`;
  }
  else if (message.action === "sendNotification") {
    sendNotification();
  }

});

