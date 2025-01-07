const timerDisplay = document.getElementById("time");
const startStopBtn = document.getElementById("start-button");
const sessionCount = document.getElementById("session-count");
const breakCount = document.getElementById("break-count");
document.body.style.border = `5px solid white`;


function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}

startStopBtn.addEventListener("click", () => {
  if (startStopBtn.textContent === "Start Session") {
    console.log("Starting session...");
    browser.runtime.sendMessage({ action: "startSession" }).then((response) => {
      if (response) {
        startStopBtn.textContent = "Stop Session";
      }
    }).catch(console.error);
  } else if (startStopBtn.textContent === "Stop Session") {

    browser.runtime.sendMessage({ action: "stopTimer" }).then((response) => {
      if (response) {
        startStopBtn.textContent = "Start Session"; 
      }
    }).catch(console.error);
  }
});


browser.runtime.onMessage.addListener((message) => {
  if (message.action === "updateTimer") {
    // Update the UI elements with the new state
    timerDisplay.textContent = formatTime(message.remainingTime);
    sessionCount.textContent = message.sessionCount;
    breakCount.textContent = message.breakCount;
    startStopBtn.textContent = "Stop Session";
    document.body.style.border = `5px solid ${message.borderColor}`;

  } else if (message.action === "timerStopped") {
    timerDisplay.textContent = "05:00";
    document.body.style.border = `5px solid ${message.borderColor}`;
  }

});

