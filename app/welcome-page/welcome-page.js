var timer = require("timer");

const id = timer.setTimeout(() => {    
    //require("./bundle-config");
    //var application = require("application");
    //TODO: improve animations
    //application.start({ moduleName: "main-page" });
    var frameModule = require("ui/frame");
    var topmost = frameModule.topmost();

    var navigationEntry = {
        moduleName: "login-page/login-page",
        backstackVisible: false,
        clearHistory: true
    };
    topmost.navigate(navigationEntry);

    //topmost.navigate("main-page", {clearHistory: true});

}, 2000);