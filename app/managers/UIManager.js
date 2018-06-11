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
                contactImage.on(gestures.GestureTypes.tap, function (args) {
                    alert("I should display messages of conversation: "+this.conversationId);
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
}
   
module.exports = UIManager;