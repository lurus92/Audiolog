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


class UIManager{   

    constructor(){
        this.name = "UIManager";
        this.page = null;
    }

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

                    backendManager.retrieveMessages(this.conversationId).then((messageURLs) => UIManager.playConversation(messageURLs, heap));
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

    playConversation(filesArray, heap){
        console.log("received fileArray"+filesArray);
        console.log("I should start playing some music now!");
        const player = new audio.TNSPlayer();  

        function playSingle(localFileArray){
            if (localFileArray.length == 0) return;
            const playerOptions = {
                audioFile: filesArray[0],
                loop: false,
            };
            player.playFromUrl(playerOptions).then(playSingle(localFileArray.slice(1)));
        }
        
        playSingle(filesArray);
    }
}
   
module.exports = UIManager;