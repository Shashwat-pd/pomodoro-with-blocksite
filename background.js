console.log("Pomodoro Timer Extension Background Script Loaded");

let timerDuration = 0.1 * 60 * 1000; // 25 minutes in milliseconds
let breakDuration = 5 * 60 * 1000; // 5 minutes in milliseconds
let remainingTime = timerDuration / 1000; // Remaining time in seconds
let startTimestamp = null;
let timerInterval = null;
let isWorkMode = false;

let sessionCount = 0;
let breakCount = 0;
let blockedSites = ["reddit.com", "x.com", "instagram.com"];
let activeTabId = null;
let borderColor = null;
let redirectUrl = "https://www.neetcode.io";

let forwardTimerID = null;
let isActive = false;

let alarmAt = null;


//shoot notification when alarm goes off
browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "pomodoro") {
    console.log("Pomodoro session complete.");
    notifDetails = {
      type: "basic",
      title: "Pomodoro Session Complete",
      message: "Time for a break!",
      iconUrl: "icons/icon.png"
    };
    browser.notifications.create(notifDetails);
  } else if (alarm.name === "break") {
    console.log("Break session complete.");
    notifDetails = {
      type: "basic",
      title: "Break Session Complete",
      message: "Back to work!",
      iconUrl: "icons/icon.png"
    };
    browser.notifications.create(notifDetails);
  }
}
);

function createAlarm(name, when) {
  browser.alarms.create(name, { when: when });
}

function checkBlocklist(tab) {
  const url = new URL(tab.url);
  const hostname = url.hostname.replace("www.", "");
  if (blockedSites.includes(hostname)) {
    console.log(`Redirecting blocked site: ${hostname}`);
    browser.tabs.update(tab.id, { url: redirectUrl });
  }
}

function closeBlockedTabs() {
  browser.tabs.query({}).then((tabs) => {
    tabs.forEach((tab) => {
      const url = new URL(tab.url).hostname.replace("www.", ""); 
      if (blockedSites.includes(url)) {
        console.log(`Closing blocked site tab: ${url}`);
        browser.tabs.remove(tab.id); 
      }
    });
  }).catch((error) => console.error("Error closing blocked tabs: ", error));
}


browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (isWorkMode &&changeInfo.url) {
    checkBlocklist(tab);
  }
});

function startPomodoroTimer() {
  if (timerInterval) {
    console.log("Pomodoro timer is already running!");
    return;
  }
  borderColor = "red";

  startTimestamp = Date.now();
  alarmAt = startTimestamp + timerDuration;


  isWorkMode = true;


  remainingTime = timerDuration / 1000;

  // Update the UI every second

  timerInterval = setInterval(() => {
    if (remainingTime > 0) {
      updateUI();
      remainingTime--;
    } else {
      clearInterval(timerInterval);
      timerInterval = null;
      forwardTimer();
  }
  },1000);
  console.log("Pomodoro timer started. Work mode activated.");


  closeBlockedTabs();

  browser.alarms.clear("break");

  createAlarm("pomodoro", alarmAt);


}


function forwardTimer() {
  console.log("Forward timer started. Enjoy your break!");
  let i = 0;
  const forwardTimerID = setInterval(() => {
 
    remainingTime = i;
    updateUI();
    i++;
  }, 1000);
}


// Start the Break Timer
function startBreakTimer() {
  console.log("Break timer started. Enjoy your break!");
  remainingTime = breakDuration / 1000;
  isWorkMode = false;
  borderColor = "green";


  browser.alarms.clear("pomodoro");
  if (timerInterval) {
    clearInterval(timerInterval);
  }


  alarmAt = Date.now() + breakDuration;
  createAlarm("break", alarmAt);
  
  timerInterval = setInterval(() => {
    if (remainingTime > 0) {
      remainingTime--;
      updateUI();
    } else {
      clearInterval(timerInterval);
      timerInterval = null;
      breakCount++;
      console.log("Break session complete. Back to work!");
      startPomodoroTimer();
    }
  }, 1000);
}

// Stop the Timer
function stopTimer() {
  sessionCount = 0;
  breakCount = 0;
  clearInterval(forwardTimerID);
  forwardTimerID = null;
  isWorkMode = false;

  //clear all active alarms
  browser.alarms.clearAll();



  borderColor = "white";
  if (timerInterval) {  
    clearInterval(timerInterval);
    timerInterval = null;
    isWorkMode = false;
    console.log("Pomodoro timer stopped.");
  } else {
    console.log("No timer is running.");
  }
  remainingTime = timerDuration / 1000;
  browser.runtime.sendMessage({
    action: "timerStopped",
    borderColor: borderColor
  });
  updateUI();
}

// Update the UI function (message passing to popup.js)
function updateUI() {
  console.log("Updating UI...");
  browser.runtime.sendMessage({
    action: "updateTimer"
  });
}



browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startSession") {
    startPomodoroTimer();
    sendResponse({ status: "Timer started" });
  } else if (request.action === "stopTimer") {
    console.log("here")
    stopTimer();
    sendResponse({ status: "Timer stopped" });
  }else if(request.action === "startBreak"){
    startBreakTimer();
    sendResponse({ status: "Break started" });
  } else if (request.action === "getTimerState") {
    sendResponse({
      isActive: isActive,
      remainingTime: remainingTime,
      isWorkMode: isWorkMode,
      sessionCount: sessionCount,
      breakCount: breakCount,
      borderColor: borderColor
    });
  } else if (request.action === "flipActiveMode") {
    isActive = !isActive;
    sendResponse({ isActive: isActive });
  } else if (request.action === "getCurrentState") {
    sendResponse({
      isActive: isActive,
      isWorkMode: isWorkMode,
      remainingTime: remainingTime,
    });
  }
});

