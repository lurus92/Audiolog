var app = require( "application" );
var contacts = require( "nativescript-contacts" );
var view = require("ui/core/view");
var layout = require("ui/layouts/grid-layout");
var buttonModule = require("ui/button");
var labelModule = require("ui/label");
var gestures = require("ui/gestures");
var audio = require("nativescript-audio");
var permissions = require('nativescript-permissions');
var fs = require('file-system');
var audio = require("nativescript-audio");
var colorModule = require("tns-core-modules/color");
var platform = require("platform");
var absoluteLayoutModule = require("tns-core-modules/ui/layouts/absolute-layout");
var view = require("ui/core/view");
var blurModule = require('nativescript-blur');
var blur = new blurModule.Blur(true);




class UIManager{   

    constructor(){
        this.name = "UIManager";
        this.page = null;
        this.screenWidth = platform.screen.mainScreen.widthDIPs;
        this.screenHeight = platform.screen.mainScreen.heightDIPs;
        this.density = platform.screen.mainScreen.scale;
        this.bottomExpandedForIPhoneX = false;
        this.filterOpened = false;
        /*this.playConversation2 = function(url){
            console.log("Should play message with url: "+url);
            var player = new audio.TNSPlayer();  
            var playerOptions = {
                audioFile: url,
                loop: false
            };
            player.playFromUrl(playerOptions);
        }*/
    }

    /*playConversation2(url){
        console.log("Should play message with url: "+url);
        var player = new audio.TNSPlayer();  
        var playerOptions = {
            audioFile: url,
            loop: false
        };
        player.playFromUrl(playerOptions);
    }*/

    refreshConversationList(){
        backendManager.retrieveConversations().then((conversationsIDArray) => {
            //In result we have the list of conversation where the user is involved
            console.log("Received result");
            console.log(conversationsIDArray);
            console.log("With length: "+conversationsIDArray.length);
            var conversationNumber = conversationsIDArray.length;
            var conversationList = view.getViewById(this.page, "conversation-list");
            console.log("prepared");
            for(var i = 0; i<conversationsIDArray.length; i++){
                console.log("entering in the cycle");
                var contactImage = new buttonModule.Button();
                contactImage.className = "conversation-button";
                contactImage.conversationId = conversationsIDArray[i];
                contactImage.heapConversation = null;
                contactImage.on(gestures.GestureTypes.tap, function (args) {
                    console.log("I should display messages of conversation: "+this.conversationId);
                    var heap = null; // Identifier of the last message present in the phone
                    //backendManager.retrieveMessagesURLs(this.conversationId).then((filesArray) => playConversation(filesArray, heap));
                    /*
                    backendManager.retrieveMessages().then(function (localMessageURI){
                        backendManager.retrieveMessageURLs(localMessageURI).then((filesArray) => playConversation(filesArray, heap))
                    });*/

                    backendManager.retrieveMessages(this.conversationId).then((messageIDs) => {
                        //TO DO: check with the heap.
                        for(var i=0; i<messageIDs.length; i++){
                            //Get downloadable URL of the message
                            var urlToFetch = '/uploads/messages/'+this.conversationId+'|'+messageIDs[i]+".caf";
                            backendManager.firebase.storage.getDownloadUrl({
                                remoteFullPath: urlToFetch
                            }).then((url) => {
                                //PLEASE MOVE THIS FUNCTION
                                console.log("Should play message with url: "+url);
                                var player = new audio.TNSPlayer();  
                                var playerOptions = {
                                    audioFile: url,
                                    loop: false
                                };
                                player.playFromUrl(playerOptions);});
                        }
                    }); 
                    //=> {
                        
                    //}UIManager.playConversation(messageURLs, heap));
                }, contactImage);
                conversationList.addChild(contactImage);
                
                //Actions:  on long press, record new message
                //          on tap, listen last
                //          on double tab, open details
                //backendManager.retrieveMessages(conversation)

                //WORKFLOW TO PERFORM
                //1. I have the conversation ID. I should download all the conversations not present in the device
                //2. The last non-read message should be flagged. I should start playing that message on user tap
                
            }
        })
    }


    //TODO: SHOULD REMOVE FROM HERE AND GO TO RECORDERMANAGER
    async playConversation(filesArray, heap){
        console.log("received fileArray"+filesArray);
        console.log("I should start playing some music now!");
        var player = new audio.TNSPlayer();  
        /*
        function playSingle(localFileArray){
            if (localFileArray.length == 0) return;
            const playerOptions = {
                audioFile: filesArray[0],
                loop: false
            };
            player.playFromUrl(playerOptions).then(playSingle(localFileArray.slice(1)));
        }
        */

        // NOT RECURSIVE
        // function playSingle(localFileArray){
        for (var i = 0; i < filesArray.length; i++){
            var playerOptions = {
                audioFile: filesArray[i],
                loop: false
            };
            await player.playFromUrl(playerOptions);
        }
        //}
        
       // playSingle(filesArray);
    }

    /**
     * @param  {Object} element: graphical element where the recorder button should be placed. If null, default position
     */
    showRecordingOverlay(counter, element){
        if (!element){

            this.recordingOverlayShown = true;
            // Should display our recorder button in the default position and the selection of users
            var actionBar = view.getViewById(this.page, "action-bar");
            var bottomBar = view.getViewById(this.page, "bottom-bar");
            var bottomPaddingIphoneX = 0;
            if (app.ios && app.ios.window.safeAreaInsets){
                bottomPaddingIphoneX = app.ios.window.safeAreaInsets.bottom;
                if (!this.bottomExpandedForIPhoneX){
                    bottomBar.height = bottomBar.height + bottomPaddingIphoneX;
                    this.bottomExpandedForIPhoneX = true;
                }
            }
           
            absoluteLayoutModule.AbsoluteLayout.setTop(bottomBar, this.screenHeight - bottomBar.height - actionBar.getMeasuredHeight() + bottomPaddingIphoneX + 10);
            if (app.ios && app.ios.window.safeAreaInsets && !bottomBar.expandedForIPhoneX){
                bottomBar.height = bottomBar.height + app.ios.window.safeAreaInsets.bottom;
                bottomBar.expandedForIPhoneX = true;
            }
            var bottomBarText = view.getViewById(this.page, "bottom-bar-text");
            bottomBarText.text = counter + " persons selected";
            bottomBar.visibility = "visible";

            var recorderButton = view.getViewById(this.page, "recorder-button");
            absoluteLayoutModule.AbsoluteLayout.setLeft(recorderButton, this.screenWidth - recorderButton.width - 16);
            absoluteLayoutModule.AbsoluteLayout.setTop(recorderButton, bottomBar.top - recorderButton.height - 5);
            recorderButton.visibility = "visible";

            //ACTION TO THE RECORDER BUTTON
            var prevDeltaX;
            var prevDeltaY;
            var initialXPosition = recorderButton.left;
            var initialYPosition = recorderButton.top;
            var overlayFilterSelector = view.getViewById(this.page, "filter-selector");

            recorderButton.on("pan", (args) => {
                if (args.state == 1){
                    prevDeltaX = 0;
                    prevDeltaY = 0;
                    //Set up first position of the overlay filter selector and its visibility
                    overlayFilterSelector.top = this.screenHeight - 20;
                    overlayFilterSelector.visibility = "visible";
                }else if (args.state === 2) // panning
                {
                  recorderButton.translateX += (args.deltaX/this.density - prevDeltaX);
                  recorderButton.translateY += (args.deltaY/this.density - prevDeltaY);
                  overlayFilterSelector.translateY += (args.deltaY/this.density - prevDeltaY);
                  if ((-1 * overlayFilterSelector.translateY) >= (this.screenHeight * 30 /100)){
                    console.log("Should set new position for the overlay");
                    this.filterOpened = true;
                    var closeOverlayButton = view.getViewById(this.page, "close-selector");
                    closeOverlayButton.visibility = "visible";
                    closeOverlayButton.on("tap", (args) => {
                        blur.off("view");
                        this.page.getViewById("view").isBlurred = false;
                        overlay.visibility = "collapse";
                    })
                  }
                  prevDeltaX = args.deltaX/this.density;
                  prevDeltaY = args.deltaY/this.density;
                }
                else if (args.state === 3) // up
                {
                    console.log("shoud reset button position");
                    recorderButton.visibility = "collapse";
                    recorderButton.translateX = 0;
                    recorderButton.translateY = 0;

              
                }
                //this.top = this.top + args.deltaY;
                //this.left = this.left + args.deltaX;
                //console.log("Pan delta: [" + args.deltaX + ", " + args.deltaY + "] state: " + args.state);
            }, recorderButton);
            var overlay = view.getViewById(this.page, "overlay");

            //FIXME: iOS DEPENDANT!!! HOW TO APPLY ALSO TO ANDROID 
            recorderButton.on("longPress", (args) => {
                //Should happen only one time, when the touch begin (args.ios.state = 1)
                //console.log("longPress detected with args.ios.state: "+args.ios.state);
                if (!this.page.getViewById("view").isBlurred && args.ios.state == 1){
                    //Should blur something
                    blur.on(this.page.getViewById("view"), 'view', 0, 'extraLight');
                    this.page.getViewById("view").isBlurred = true;
                    //Should display overlay
                    overlay.visibility = "visible";
                    //Should play sound and start recording
                    audioManager.initializeWithFile("~/audio/recEffect.wav");
                    audioManager.play()
                        .catch((err) => console.log(err))
                        .then(() => {
                            console.log("UIManager > Ready to record, passing control to AudioManager")
                            audioManager.record();
                        });

                }    
                if (this.page.getViewById("view").isBlurred && args.ios.state == 3 && !this.filterOpened){
                    console.log("UIManager > Button released, should stop recording. Passing control to AudioManager");
                    audioManager.stopRecording().then(() => {
                        console.log("UIManager > Restored control from AudioManager. Recording Stopped. Starting to send message to the server, passing control to BackendManager")
                        backendManager.sendMessageNEW(audioManager.audioPath);
                    });
                    console.log("UIManager > Button released, should update UI.");
                    blur.off("view");
                    this.page.getViewById("view").isBlurred = false;
                    overlay.visibility = "collapse";
                }
            },this);



        }
        console.log("Calm down! Still to be developed");
    }
    hideRecordingOverlay(){
        var recorderButton = view.getViewById(this.page, "recorder-button");
        recorderButton.visibility = "collapse";
        var bottomBar = view.getViewById(this.page, "bottom-bar");
        bottomBar.visibility = "collapse";


    }
}
   
module.exports = UIManager;