/*
In NativeScript, the app.js file is the entry point to your application.
You can use this file to perform app-level initialization, but the primary
purpose of the file is to pass control to the app’s first module.
*/

require("./bundle-config");
var application = require("application");
var backendManagerModule = require("./managers/BackendManager.js");
var navigationManagerModule = require("./managers/NavigationManager.js");
var userManagerModule = require("./managers/UserManager.js");
var UIManagerModule = require("./managers/UIManager.js");

backendManager = new backendManagerModule();
backendManager.initFirebase();
navigationManager = new navigationManagerModule();
userManager = new userManagerModule();
UIManager = new UIManagerModule();


//application.start({ moduleName: "main-page" });
if (application.ios) {
    var fontModule = require("ui/styling/font");
    //fontModule.ios.registerFont("Pacifico-Regular.ttf");

}

application.start({ moduleName: "welcome-page/welcome-page" });

/*
Do not place any code after the application has been started as it will not
be executed on iOS.
*/