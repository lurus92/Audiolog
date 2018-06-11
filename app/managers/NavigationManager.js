class NavigationManager{   
    
    constructor(){
        this.currentScreen = "welcome";
    }

    navigateTo(path){
        console.log("Start going in: "+path);
        var frameModule = require("ui/frame");
        var topmost = frameModule.topmost();
        var navigationEntry = {
            moduleName: path,
            backstackVisible: false,
            clearHistory: true
        };
        topmost.navigate(navigationEntry);
    }

    navigateToMainScreen(){
        this.navigateTo("main-page/main-page");
        this.currentScreen = "main";
    }

    navigateToLoginScreen(){
        this.navigateTo("login-page/login-page");
        this.currentScreen = "login";

    }

    navigateToWelcomeScreen(){
        this.navigateTo("welcome-page/welcome-page");
        this.currentScreen = "welcome";

    }
}
   
module.exports = NavigationManager;
   