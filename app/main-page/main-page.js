var app = require( "application" );
var contacts = require( "nativescript-contacts" );
var view = require("ui/core/view");
var layout = require("ui/layouts/grid-layout");
var buttonModule = require("ui/button");
var labelModule = require("ui/label");
var gestures = require("ui/gestures");
firebase = require("nativescript-plugin-firebase");
var audio = require("nativescript-audio");
var permissions = require('nativescript-permissions');
var fs = require('file-system');
var audio = require("nativescript-audio");
var colorModule = require("tns-core-modules/color");

var audioPath = ""


/* START RECORDING */
 
function startRecording(filename) {

    if(app.android){
        permissions.requestPermission(android.Manifest.permission.RECORD_AUDIO, "Let me hear your thoughts...").then(prepareRecording);
    }else{
        prepareRecording();
    }

    function prepareRecording () {
    // check if the device has recording capabilities
    if (audio.TNSRecorder.CAN_RECORD()) {
      recorder = new audio.TNSRecorder();
      var audioFolder = fs.knownFolders.currentApp().getFolder("audio");
      audioPath = audioFolder.path + '/'+Date.now()+'.caf';
      var recorderOptions = {
        filename: audioPath,
        infoCallback: function () {
           console.log('infoCallback');
         },
        errorCallback: function () {
           console.log('errorCallback');
           alert('Error recording.');
         }
      };
  
     console.log('RECORDER OPTIONS: ' + recorderOptions);
  
     recorder.start(recorderOptions).then(function (res) {
         console.log("recording started");

     }, function (err) {
         console.log('ERROR: ' + err);
     });
  
    } else {
      alert('This device cannot record audio.');
    }

  }
}
  
 /* STOP RECORDING 
  
 function stop(args) {
    if (recorder != undefined) {
      recorder.stop().then(function () {
      alert('Audio Recorded Successfully.');
    }, function (err) {
      console.log(err);
      data.set('isRecording', false);
    });
   }
 }*/



onQueryEvent = function(result) {
    // note that the query returns 1 match at a time
    // in the order specified in the query
    if (!result.error) {
        console.log("Event type: " + result.type);
        console.log("Key: " + result.key);
        console.log("Value: " + JSON.stringify(result.value));
    }
};

function buildDynamicUI(args) {
        
    var page = args.object;
    UIManager.page = page;
    buildStories(page);
    UIManager.refreshConversationList();
    buildContactList(page);
    
}

function buildStories (page){
    var storiesContainer = view.getViewById(page, "stories-container");
    for (var i=0; i<10; i++){
        var story = new buttonModule.Button();
        story.className = "story-button";
        story.identifier = i;
        storiesContainer.addChild(story);
        story.on(buttonModule.Button.tapEvent, function (event) {
            alert("You ed element: "+this.identifier);
        },story);
        //Understand if the story is active
    }

}

/*function buildConversationList(page){
    var conversationNumber = 0;
    backendManager.retrieveConversation().then(function(result){
        //In result we have the list of conversation where the user is involved
        conversationNumber = result.length;
        var conversationList = view.getViewById(this.page, "conversation-list");
        var emptyLabel = new labelModule.Label();
        emptyLabel.text = "You have "+conversationNumber+" conversations";
        conversationList.addChild(emptyLabel);
    });
}*/

function buildContactList(page){
    var contactsContainer = view.getViewById(page, "contacts-container");
    var contactFields = ['name','phoneNumbers'];
    contacts.getAllContacts(contactFields).then(function(args){
        if (!args.data) console.log("No contacts!");   //TODO: improve this
        console.log("Found "+args.data.length+" contacts");
        // Iterate over all contacts
        for (var i=0; i<args.data.length; i++){  //TODO: Check if args.data exists
            if(typeof(args.data[i])=="undefined") continue;
            if(typeof(args.data[i].phoneNumbers) == "undefined") continue;
            if(typeof(args.data[i].phoneNumbers[0]) == "undefined") continue;

            //Build list UI
            var StackLayout = require("ui/layouts/stack-layout").StackLayout;
            var contactListElement = new StackLayout();
            contactListElement.orientation = "horizontal";
            var nameLabel = new labelModule.Label()
            var name = JSON.stringify(args.data[i].name)
            nameLabel.text = buildNameFromJSON(args.data[i].name);          //TODO: Improve buildNamFromJSON

            var contactImage = new buttonModule.Button();                //TODO: all these attributes should be of the list element
            contactListElement.name = JSON.stringify(args.data[i].name);
            contactImage.className = "contact-button";
            contactListElement.phoneNumber = args.data[i].phoneNumbers[0].value;
            if (contactListElement.phoneNumber[0] != "+") 
                contactListElement.backgroundColor = new colorModule.Color("yellow");
            contactListElement.presentInApp = null;
            var recordedStarted = false;
            contactListElement.on(gestures.GestureTypes.longPress, function (args) {
                //A contact list element has been tapped
                //If the user has started to tap the element, we should start a recording
                //If the user has stopped, we should stop it
                //console.log(args);
                // SOLUTION OLY FOR IOS
                if (!recordedStarted){
                    recordedStarted = true;
                    initiateRecording(this);
                }
                if(args.ios.state == 3 && recordedStarted){
                    stopRecordingAndSend(this);
                    recordedStarted = false;
                    audioPath = "";
                }

               // startConversation(this);
            },contactListElement);

            /*
            contactListElement.on(gestures.GestureTypes.tap, function (args) {
                //if (args.action == "up"){
                if (recordedStarted){
                    stopRecordingAndSend(this);
                    recordedStarted = false;
                }
            },contactListElement);*/
            

            //contactsContainer.addChild(contact);
            contactListElement.addChild(contactImage);
            contactListElement.addChild(nameLabel);
            contactsContainer.addChild(contactListElement);

        }

    }, function(err){
        console.log("Error: " + err);
    });
}


function initiateRecording(listElement){
    //Element, when the starting point is the list of contacts, is the list itself o
    listElement.backgroundColor = new colorModule.Color("red");
    var storedFile = startRecording(listElement.phoneNumber);
    return storedFile;

}
/*
function storeRecording(listElement){
    listElement.backgroundColor = new colorModule.Color("white");   
    alert("recording ended! I should save recording "+listElement.phoneNumber+".caf");
}*/

function stopRecordingAndSend(listElement){
    var localAudioPath = audioPath;
    recorder.stop().then(function(){
        listElement.backgroundColor = new colorModule.Color("white");   
        backendManager.sendMessage(listElement.phoneNumber, localAudioPath);
    });
    //alert("recording ended! I should save recording "+listElement.phoneNumber+".caf");
}



function buildNameFromJSON(nameJSON){
    var name = "";
    for(var i in nameJSON)
            if (nameJSON[i] && typeof(nameJSON[i])!="object")     // To improve here 
            name = name + nameJSON[i] + " ";
    return name;
}

/*

function buildConversationList(data){
    //We expect data as a JSON string
    var conversations = JSON.parse(data);
    for (var i=0; i<conversations.length; i++)

}
*/
exports.buildDynamicUI = buildDynamicUI; 