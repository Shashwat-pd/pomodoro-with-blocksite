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
  const notifications = {
    pomodoro: {
      title: "Pomodoro Session Complete",
      message: "Time for a break!",
    },
    break: {
      title: "Break Session Complete",
      message: "Back to work!",
    }
  };

  if (notifications[alarm.name]) {

    const notifDetails = {
      type: "basic",
      title: notifications[alarm.name].title,
      message: notifications[alarm.name].message,
      iconUrl: "icons/icon.png"
    };

    browser.notifications.create(notifDetails);
  }
});


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


function clearTimers() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  if (forwardTimerID) {
    clearInterval(forwardTimerID);
    forwardTimerID = null;
  }
}

function startPomodoroTimer() {
  clearTimers();

  borderColor = "red";

  startTimestamp = Date.now();
  alarmAt = startTimestamp + timerDuration;


  isWorkMode = true;
  
  updateUI();


  remainingTime = timerDuration / 1000;

  // Update the UI every second

  timerInterval = setInterval(() => {
    if (remainingTime > 0) {
      remainingTime--;
      updateUI();
    } else {
      clearInterval(timerInterval);
      timerInterval = null;
      sessionCount++;

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
  forwardTimerID = setInterval(() => {
 
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
  clearTimers()


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


function stopTimer() {
  sessionCount = 0;
  breakCount = 0;
  clearTimers();

  isWorkMode = false;

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
    action: "updateTimer",
    isActive: isActive,
    isWorkMode: isWorkMode,
    remainingTime: remainingTime,
    sessionCount: sessionCount,
    breakCount: breakCount,


  });
}


const messageHandlers = {
  startSession: (request, sender, sendResponse) => {
    startPomodoroTimer();
    sendResponse({ status: "Timer started" });
  },
  stopTimer: (request, sender, sendResponse) => {
    stopTimer();
    sendResponse({ status: "Timer stopped" });
  },
  startBreak: (request, sender, sendResponse) => {
    startBreakTimer();
    sendResponse({ status: "Break started" });
  },
  flipActiveMode: (request, sender, sendResponse) => {
    isActive = !isActive;
    sendResponse({ isActive: isActive });
  },
  getCurrentState: (request, sender, sendResponse) => {
    sendResponse({
      isActive: isActive,
      isWorkMode: isWorkMode,
      remainingTime: remainingTime,
      sessionCount: sessionCount,
      breakCount: breakCount,
    });
  },
};

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (messageHandlers[request.action]) {
    messageHandlers[request.action](request, sender, sendResponse);
  } else {
    console.warn(`Unknown action: ${request.action}`);
  }
});

