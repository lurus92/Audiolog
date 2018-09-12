//#region Initial declarations

var app = require( "application" );
var view = require("ui/core/view");
var buttonModule = require("ui/button");
var platform = require("platform");
var absoluteLayoutModule = require("tns-core-modules/ui/layouts/absolute-layout");
var animationModule = require("tns-core-modules/ui/animation");
imagepicker = require("nativescript-imagepicker");
var frameModule = require("ui/frame");
var fs = require("file-system");
var imageSourceModule = require("image-source");
var colorModule = require("tns-core-modules/color");
var CryptoJS = require("crypto-js");
var userID = null;
var isFirstStart = true;

//Phone number utilities, documentation here: https://github.com/ruimarinho/google-libphoneNumber
const PNF = require('google-libphoneNumber').PhoneNumberFormat;
const phoneUtil = require('google-libphoneNumber').PhoneNumberUtil.getInstance();


firebase = require("nativescript-plugin-firebase");
WIDTH = platform.screen.mainScreen.widthDIPs
HEIGHT = platform.screen.mainScreen.heightDIPs
//#endregion

//#region Function returning a sequence of numbers from a phone number (eliminating spaces, brackets, etc.)
function sanitizePhoneNumber(number){
  return number.match(/\d+/g).join('');
}

//#endregion


//#region Global variables to perform testing [TO DELETE in production]
debugObj = {}; //Object filled with functions useful in development
photoselected = null;
imagesource = null;
profilePhotoUrl = null;
pb = null;
//#endregion


//#region Firebase listener understanding automatic logins [TO IMPLEMENT]
/*var listener = {
    onAuthStateChanged: function(data) {
      console.log(data.loggedIn ? "Logged in to firebase" : "Logged out from firebase");
      if (data.loggedIn) {
        navigateToMainScreen();
      }
    },
    thisArg: this
  };
*/
//firebase.addAuthStateListener(listener);

//#endregion

//#region Main UI builder. This is the entry point of this script
function buildDynamicUI(args) {
    
  var emulator = true; //Change this if you want to build this in production (login by telephone enabled)
  page = args.object;
  var infoLabel = view.getViewById(page, "long-text");
  infoLabel.textWrap = true;
  var ratesLabel = view.getViewById(page, "long-text");
  ratesLabel.textWrap = true;


  var photoButton = view.getViewById(page, "photo-button");
  var photoButtonEnabled = false;

  list = new Array();
  var context = imagepicker.create({ mode: "single" });
  
  function startSelection(context, returnPage) {
      context
          .authorize()
          .then(function () {
          list = [];
          return context.present();
      })
          .then(function (selection) {
            console.log("Selection done:");
            selection.forEach(function (selected) {
                console.log(selected);
                selected.options = {
                  width: 512 / platform.screen.mainScreen.scale,
                  height: 512 / platform.screen.mainScreen.scale,
                  keepAspectRatio: true
                };
                var source = new imageSourceModule.ImageSource();
                source.fromAsset(selected)
                .then((imgsrc) => {
                    var folder = fs.knownFolders.documents();
                    var path = fs.path.join(folder.path, "profile.png");
                    var saved = imgsrc.saveToFile(path, "png");

                    profilePhotoUrl = path;
                    if (saved) {
                        console.log("Image saved successfully!");
                        photoButton.backgroundImage = profilePhotoUrl;
                    }
                    photoselected = true;
                });
            });
          list = selection;
          }).catch(function (e) {
            console.log(e);
            });
  }

  photoButton.on(buttonModule.Button.tapEvent, function(){
    if (!photoButtonEnabled) return;
    var topmost = frameModule.topmost();    
    var startPage = topmost.currentEntry;
    var context = imagepicker.create({ mode: "single" });
    startSelection(context, startPage);
  });

      
//FROM HERE ON, ANIMATION STUFF
    var phoneNumberTextField = view.getViewById(page, "number-textfield");
    var topLayout = view.getViewById(page, "top-container");
    var mainView = view.getViewById(page, "main-container");    
    var smsButton = view.getViewById(page, "sms-button");
    var bottomContainer = view.getViewById(page, "bottom-container");

    absoluteLayoutModule.AbsoluteLayout.setLeft(smsButton, WIDTH/2 - smsButton.width/2);
    absoluteLayoutModule.AbsoluteLayout.setTop(bottomContainer, HEIGHT * 0.6);
    absoluteLayoutModule.AbsoluteLayout.setTop(smsButton, bottomContainer.top - 32);
    absoluteLayoutModule.AbsoluteLayout.setTop(topLayout, 0);
      

    smsButton.on(buttonModule.Button.tapEvent, function(event){
        //Dismiss keyboard
        phoneNumberTextField.dismissSoftInput();
        if (!phoneNumberTextField.text){
          alert("Please insert a valid phone number");
          return;
        }
        //TODO: use UserManager Funcitons
        var phoneNumber = phoneUtil.parseAndKeepRawInput(phoneNumberTextField.text, userManager.defaultLocale);
        console.log("Is possible Number: "+phoneUtil.isPossibleNumber(phoneNumber));
        console.log("Is valid Number: "+phoneUtil.isValidNumber(phoneNumber));
        console.log("Is valid Number for locale: "+userManager.defaultLocale+": "+phoneUtil.isValidNumberForRegion(phoneNumber, userManager.defaultLocale));
        userManager.phoneNumber = phoneUtil.format(phoneNumber, PNF.E164)

        if (phoneUtil.isPossibleNumber(phoneNumber)&&phoneUtil.isValidNumber(phoneNumber)&&phoneUtil.isValidNumberForRegion(phoneNumber, userManager.defaultLocale)){
          userManager.encodedPhoneNumber = backendManager.encodePhone(userManager.phoneNumber);
          if (!emulator) backendManager.loginPhone(userManager.phoneNumber, animateScreen)
             else backendManager.loginAnonymous(animateScreen);
        }else{
          alert("Problems with your phone number!"); 
        }

        
    });

    function animateScreen(){
      var topContainer = view.getViewById(page, "top-container");
      var bottomContainer = view.getViewById(page, "bottom-container");
      var smsButton = view.getViewById(page, "sms-button");
      var photoButton = view.getViewById(page,"photo-button");
      definitions = new Array();      
      definitions.push({ target: topContainer, translate: { x: 0, y: -HEIGHT*0.8 }, duration: 300 });
      definitions.push({ target: bottomContainer, translate: { x: 0, y: -HEIGHT*0.5 }, duration: 300 });
      definitions.push({ target: smsButton, translate: { x: 0, y: -HEIGHT*0.8 }, duration: 300 });
      definitions.push({ target: photoButton, backgroundColor: new colorModule.Color("red"), duration: 300 })
      animationSet = new animationModule.Animation(definitions);
      animationSet.play().then(function () {
        console.log("Animation finished!");
        photoButtonEnabled = true;
        })
          .catch(function (e) {
            console.log(e.message);
          }); 
    }

    debugObj.animateTest = animateScreen;

    var startButton = view.getViewById(page, "start-button");
    startButton.on(buttonModule.Button.tapEvent, function(event){
      if (!userManager.id) { alert("User not correctly autenticated"); return;};
      var nameTextField = view.getViewById(page, "name-textfield");
      if (nameTextField.text == "" ){ alert("Choose a name"); return;}
      userManager.name = nameTextField.text;

      //If a photo has been selected, we will upload it.
      //TODO: Insert loading spinner
      if (photoselected){
        backendManager.uploadProfPic(profilePhotoUrl, function(){
          backendManager.finaliseRegistration(navigationManager.navigateToMainScreen);
        });
      }else{
        backendManager.finaliseRegistration(navigationManager.navigateToMainScreen);
      }

    });   
    
}

//#endregion

exports.buildDynamicUI = buildDynamicUI; 