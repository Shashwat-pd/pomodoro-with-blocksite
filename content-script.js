browser.runtime.onMessage.addListener((message) => {
    if (message.action === "addRedBorder") {
        document.body.style.border = "5px solid red";
        console.log("Red border added");
    } else if (message.action === "removeRedBorder") {
        document.body.style.border = "";
        console.log("Red border removed");
    }});