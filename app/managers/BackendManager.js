var fs = require("file-system");


class BackendManager{   
    
    constructor(){
        this.firebaseStatus = "not active";
        this.firebase = require("nativescript-plugin-firebase");
    }

    initFirebase(){
        this.firebase.init({
            // Optionally pass in properties for database, authentication and cloud messaging,
            // see their respective docs.
            iOSEmulatorFlush: true,    
            storageBucket: 'gs://audiolog-d6fa9.appspot.com'
          }).then(
              function (instance) {
                alert("firebase.init done");
              },
              function (error) {
                alert("firebase.init error: " + error);
              }
          );
          this.firebaseStatus = "initiated";
    }

    loginAnonymous(callback){
        this.firebase.login({
            type: firebase.LoginType.ANONYMOUS
          }).then(
              function (remoteUser) {
                userManager.id = remoteUser.uid;  
                if (callback) callback();
              },
              function (errorMessage) {
                alert(JSON.stringify(errorMessage));
              }
          );
    }

    loginPhone(number, callback){
        //TODO: insert validation on Number
        this.firebase.login({
            type: firebase.LoginType.PHONE,
            phoneOptions: {
              phoneNumber: number,
              verificationPrompt: "The received verification code"
            }
          }).then(
              function (result) {
                userManager.id = result.uid;
                userManager.phoneNumber = number;
                callback();
              },
              function (errorMessage) {
                console.log(errorMessage);
              }
          );
    }

    uploadProfPic(profilePhotoUrl, callback){
        // now upload the file with either of the options below:
        this.firebase.storage.uploadFile({
            // optional, can also be passed during init() as 'storageBucket' param so we can cache it (find it in the Firebase console)
            //bucket: 'gs://izwly-c6b98.appspot.com',
            // the full path of the file in your Firebase storage (folders will be created)
            remoteFullPath: 'uploads/images/profiles/'+userManager.id+'.png',
            // option 1: a file-system module File object
            localFile: fs.File.fromPath(profilePhotoUrl),
            // option 2: a full file path (ignored if 'localFile' is set)
            localFullPath: profilePhotoUrl,
            // get notified of file upload progress
            onProgress: function(status) {
                console.log("Uploaded fraction: " + status.fractionCompleted);
                console.log("Percentage complete: " + status.percentageCompleted);
            }
        }).then( (uploadedFile) => {
                this.firebase.updateProfile({
                    photoURL: uploadedFile.url
                });
                callback();
            },
            function (error) {
            console.log("File upload error: " + error);
            }
        );
    }

    finaliseRegistration(callback){/*
            this.firebase.updateProfile({
              displayName: userManager.name
            }).then(function(){*/
                console.log("path: "+"/users/"+this.encodePhone(userManager.phoneNumber));
                this.firebase.setValue("/users/"+this.encodePhone(userManager.phoneNumber),
                {
                  "name": userManager.name,
                  "id": userManager.id
                }).then(function(){
                    navigationManager.navigateToMainScreen();
                });
            //});
            //TODO: understand why callback are not working!
    }

    createUser(phoneNumber){
        this.firebase.setValue("/users/"+encodePhone(phoneNumber),
        {
          "name": nameTextField.text,
          "id": userID
        }).then(function(){
          navigationManager.navigateToMainScreen();
        });
    }
       
    /**
     * Method that creates a conversation in the Firebase Remote Database
     * A conversation is indexed by a key composed by the hash of the sender and the receiver
     * phone numbers, concatened by a pipe.
     * @param  {string} receiver: a phone number in international format
     * @param  {function} callback
     */
    createConversation(receiver, callback){
        var key = encondePhone(userManager.phoneNumber)+"|"+encodePhone(receiver);
        //TODO: menage groups
        this.firebase.setValue("/conversations/"+key,
        {
          "messages": []
        }).then(callback);
    }

    /**
     * Method that enables a message to be posted in the server
     * @param  {string} conversationId: in which conversation the message should belong
     * @param  {blob} payload: the file of the message !!Could be also a link, we could extend the uploadFile
     * @param  {function} callback
     */
    postMessage(conversationId, payload, callback){
        //TODO: build function
    }


    /**
     * Module that send a message
     * TODO: a message can be in a conversation or not (direct). In the latter case, we should create a new conversation
     * @param  {string} receiverPhoneNumber
     * @param  {string} messagePath: local path in the phone for the message (caf format) that should be sent
     */
    sendMessage(receiverPhoneNumber, messagePath){
        console.log("Starting to send message")
        var filename = messagePath.split("/")[messagePath.split("/").length - 1].split(".")[0];   //timestamp of the audio
        console.log("filename: "+filename);
        var receiverEncodedNumber = this.encodePhone(receiverPhoneNumber);
        console.log("receiverEncodedNumber: "+receiverEncodedNumber);
        var senderEncodedNumber = this.encodePhone(userManager.phoneNumber);
        console.log("senderEncodedNumber: "+senderEncodedNumber);
        //I should upload now the caf audio message
        //I will store the file in uploads/messages/<sender>|<receiver>|<timestamp> 
        var remotePath = "uploads/messages/"+senderEncodedNumber+"|"+receiverEncodedNumber+"|"+filename+".caf";
        console.log("remotePath "+remotePath);
        //File System Module is needed
        var fs = require('file-system');
        this.firebase.storage.uploadFile({
            // the full path of the file in your Firebase storage (folders will be created)
            remoteFullPath: remotePath,
            // option 1: a file-system module File object
            localFile: fs.File.fromPath(messagePath),
            // option 2: a full file path (ignored if 'localFile' is set)
            localFullPath: messagePath,
            // get notified of file upload progress
            onProgress: function(status) {
               // console.log("Uploaded fraction: " + status.fractionCompleted);
                console.log("Percentage complete: " + status.percentageCompleted);
            }
        }).then( (uploadedFile) => {
                //console.log(JSON.stringify(uploadedFile));
                console.log("Starting to build record for the message in the db");
                this.firebase.push(
                    '/messages',
                    {
                      'localPath': remotePath,
                      'timestamp': filename,
                      'sender': senderEncodedNumber,
                      'receiver': receiverEncodedNumber
                    }
                ).then( (result) => {
                        console.log("inner function working");
                        //result.key is the unique identifier for the message in the db.
                        var messagePrimaryKey = result.key;
                        console.log("created key: " + result.key);
                        //create conversation
                        //NO PUSH! The id of a conversation is known and it is composed by sender|receiver
                        //Moreover also the id of the message is known and should be appended to the conversation
                        //I will add as a folder
                        this.firebase.setValue("/conversations/"+senderEncodedNumber+"|"+receiverEncodedNumber+"/"+messagePrimaryKey,
                        {
                            'timestamp': filename, //not really needed, but maybe useful
                            'fullPath': uploadedFile.url
                          }).then(function(){
                              console.log("conversation "+senderEncodedNumber+"|"+receiverEncodedNumber+" updated");
                              //Refresh UI;
                              UIManager.refreshConversationList();
                        });
                    }
                );
            },
            function (error) {
            console.log("File upload error: " + error);
            }
        );
    }


     /**
     * Function that send a message (V2)
     * The new function differs from the previous because it needs a Conversation Manager, and will be able to build conversation with multiple persons 
     * @param  {string} messagePath: local path in the phone for the message (caf format) that should be sent
     */
    sendMessageNEW(messagePath, conversationID){
        //We assume here that the message has been recorded.
        //First of all, we should understand if we can send an SMS to persons without the app and adjust the receivers accordingly
        this.checkIfUsersExist().then( () => {
            console.log("Starting to send a message with a new incredible function");
            var filename = messagePath.split("/")[messagePath.split("/").length - 1].split(".")[0];   //timestamp of the audio
            //TODO: To prevent conflicts, add the uid to the filename
            console.log("filename: "+filename);    
            var remotePath = "uploads/messages/"+filename+".caf"; //TODO: understand why CAF and not mp3
            this.firebase.storage.uploadFile({
                // the full path of the file in your Firebase storage (folders will be created)
                remoteFullPath: remotePath,
                // option 1: a file-system module File object
                localFile: fs.File.fromPath(messagePath),
                // option 2: a full file path (ignored if 'localFile' is set)
                localFullPath: messagePath,
                // get notified of file upload progress
                onProgress: function(status) {
                // console.log("Uploaded fraction: " + status.fractionCompleted);
                    console.log("Percentage complete: " + status.percentageCompleted);
                }
            }).then( (uploadedFile) => {
                console.log(JSON.stringify(uploadedFile));
                console.log("Starting to build record for the message in the db");
                this.firebase.push(
                    '/messages',
                    {
                    'localPath': remotePath,
                    'timestamp': filename,
                    }
                ).then ( (messageRecord) => {
                    console.log("starting to build the conversation record");
                    var messagePrimaryKey = messageRecord.key;
                    //NOW: If a conversationID is present, I can directly store the message in the conversation
                    //Otherwise, I should create a new conversation

                    if(!conversationID){
                        this.firebase.push(
                            "/conversations",
                            {
                                'messages' : messagePrimaryKey,
                                'users': userManager.id + "|" + conversationManager.stringifyPartecipants()  //TODO: ALL
                            }
                        ).then( (result) => {
                            console.log("new conversation created with id: "+result.key);
                            UIManager.refreshConversationList();
                        });
                    }else{
                        //Should update messages. First we download it
                        this.firebase.getValue("/conversations/"+conversationID).then( (result) => {
                            //Now I should write the new value
                            this.firebase.setValue("/conversations/"+conversationID,
                            {
                                'messages': result.messages + "|" + messagePrimaryKey,
                                'users' : result.users
                            }).then((result => {
                                console.log("pre-existing conversation updated");
                                UIManager.refreshConversationList();
                            }))
                        })
                        
                    }

                })
        });
    });
    }

    /** 
     *  Retrieve the conversation started by the user, or where the user is present
     *  The method performs a query to the /conversation node, then check if the user is present inside the name of the conversation (encoded send+dest)
     *  @return {Promise}   returnPromise:      the method returns an asyncronous executor.
     *  @var    {Array}     userConversations:  the value returned by the promise when fullfilled. It is an array containing the IDs of conversation where the user is present
     *  //TODO: try to return the conversations already sorted by... something. 
     */
    retrieveConversations(){
        var returnPromise = new Promise((resolve, reject) => {
            var updateCallback = function(){
                console.log("Conversation query performed");
            }
            backendManager.firebase.query(
                updateCallback,
                "/conversations",
                {
                    singleEvent: true,
                    orderBy: {
                        type: this.firebase.QueryOrderByType.CHILD,
                        value: 'since'
                    }
                }
                ).then(
                    function(result){
                        //In result.value we have all the conversations
                        var conversations = result.value;
                        console.log(conversations);
                        //We take their index, that should contain the one of the user
                        var userConversations = [];
                        for (var i=0; i<Object.keys(conversations).length; i++){
                            if (Object.keys(conversations)[i].indexOf(userManager.encodedPhoneNumber) != -1) userConversations.push(Object.keys(conversations)[i]);
                        }
                        resolve(userConversations);
                });
        });
        return returnPromise;        
    }

    
    /**
     * Retrieve the messages of a particular conversation
     * @param   {Array}     conversationId: the ID of conversation to consider
     * @return  {Promise}   returnPromise: the asyncrounous executor returned by the method
     * @var     {Array}     timestamps: un unsorted (retured sorted) array of timestamps of the messages inside a conversation
     */
    retrieveMessages(conversationId){
        var returnPromise = new Promise((resolve, reject) => {
            var updateCallback = function(){
                console.log("Message query performed");
            }
            backendManager.firebase.query(
                updateCallback,
                "/conversations/"+conversationId,
                {
                    singleEvent: true,
                    orderBy: {
                        type: this.firebase.QueryOrderByType.CHILD,
                        value: 'since'
                    }
                }
                ).then((result) => {
                        console.log("Second callback ok");
                        console.log(result);
                        //In result.value we have all the messages, with their IDs
                        var messages = result.value;
                        //But ID are not useful to us. We need the URLS of the messages
                        var messageURL = []; //TO DELETE
                        var messageTS = [];
                        for(var i in messages){
                            if(messages[i].fullPath)
                                messageURL.push(messages[i].fullPath);
                        }
                        for(var i in messages){
                            if(messages[i].timestamp)
                                messageTS.push(messages[i].timestamp);
                        }  /*
                        //We have the timestamp array. We sort it
                        timestamps.sort();
                        //We should return a partial path to the message, that is composed by <conversationID>+"|"+filename
                        var localMessageURI = timestamps.filter((el) => conversationId+el);
                        console.log(localMessageURI);*/
                        console.log("finishing promise and ready to return");
                        resolve(messageTS);
                });
        });
        return returnPromise;  
    }

    retrieveMessagesURLs(localMessageURI){
        console.log("starting retrieveMessagesURLs")
        var globalURL = [];
        var returnPromise = new Promise((resolve, reject) => {
        function getURL(localURI, urlArray, istance){
            console.log("WOW I'VE GONE RECURSIVE!")
            if (!localURI.length) resolve(urlArray);
            istance.firebase.getDownloadURL({
                remoteFullPath: "conversations/"+localURI[0]
            }).then((url) => {
                urlArray.push(url);
                getURL(localURI.slice(1),urlArray,istance);
            })
        }
        getURL(localMessageURI, globalURL, this);
        return returnPromise;
        });
    }


/*
    storeMessageInDB (remoteMessagePath){

    }*/
    
    /** TODO: Move to USER MANAGER
     * Encode the phone number
     * 
     * @param  {string} phoneNumber
     * @return {string} SHA256 hashed version of the phone number  
     */
    encodePhone(phoneNumber){
        var CryptoJS = require("crypto-js");
        if (phoneNumber[0]!="+"){
            var prefix = prompt("Phone not in international format. Please enter prefix:");
            phoneNumber = "+" + prefix + phoneNumber;
        }
        return CryptoJS.SHA256(phoneNumber, "audiolog").toString();
    }
   

    checkIfUsersExist(){
        console.log("BackendManager > starting to check if user exist");
        var userQueryPromises = [];
        for (var i = 0; i<conversationManager.partecipants.length; i++){
            userQueryPromises[i] = new Promise( resolve => {
                this.firebase.getValue("/users/"+conversationManager.partecipants[i]).then((result) => {
                     if (typeof result.id == "undefined") conversationManager.partecipantsWithoutApp.push(result.key);
                     resolve();
                })
                //TODO: check if result.id OR result.value.id
            });
        }
        return finalPromise = new Promise (resolve => {
            Promise.all(userQueryPromises).then(() => {
                //if (userManager.isTesting) return true;
                if (conversationManager.partecipantsWithoutApp.length != 0){ 
                    //Should ask user if we want to keep the non-registered receivers and send them an SMS. ONLY ONCE
                    var options = ["Send SMS to invite friends","Invite friends in other ways","Send message only to registered"]
                    action({
                        message: "Ops! Seems that some of your contacts have still not yet installed Audiolog.",
                        cancelButtonText: "Cancel",
                        actions: options
                    }).then(result => {
                        switch (result) {
                            case options[0]:
                                console.log("YEAH! I should send message to everyone!")
                                break;
                            case options[1]:
                                console.log("Ok, let's open share overlay");
                                break;
                            case options[2]:{
                                console.log("KO: Not allowed to send SMS");
                                //Check user that have or do not have the app. We should modify the partecipants of the conversation
                                for (let i = 0; i < conversationManager.partecipantsWithoutApp.length; i++) {
                                    conversationManager.partecipants.pop(conversationManager.partecipantsWithoutApp[i])
                                }
                                if (conversationManager.partecipants.length == 0){
                                    //All the partecipants of the conversation do not have the app
                                    alert("No partecipant selected has Audiolog installed. Operation cancelled.")
                                    //TODO: improve, trying to let the user come back
                                }
                            }
                            case "Cancel":{
                                var userChoice = confirm("Are you really sure to delete your message?");
                                if (userChoice){
                                    //rollback: deselect everything
                                }else{
                                    //go back to options, without closing
                                }
                            }
                                break;
                         }
                         resolve();
                        });
                    }
            
        })
        /*
 Promise.all(userQueryPromises).then(() => {
            //if (userManager.isTesting) return true;
            if (conversationManager.partecipantsWithoutApp.length != 0){ 
                //Should ask user if we want to keep the non-registered receivers and send them an SMS. ONLY ONCE
                var options = ["Send SMS to invite friends","Invite friends in other ways","Send message only to registered"]
                action({
                    message: "Ops! Seems that some of your contacts have still not yet installed Audiolog.",
                    cancelButtonText: "Cancel",
                    actions: options
                }).then(result => {
                    switch (result) {
                        case options[0]:
                            console.log("YEAH! I should send message to everyone!")
                            break;
                        case options[1]:
                            console.log("Ok, let's open share overlay");
                            break;
                        case options[2]:{
                            console.log("KO: Not allowed to send SMS");
                            //Check user that have or do not have the app. We should modify the partecipants of the conversation
                            for (let i = 0; i < conversationManager.partecipantsWithoutApp.length; i++) {
                                conversationManager.partecipants.pop(conversationManager.partecipantsWithoutApp[i])
                            }
                            if (conversationManager.partecipants.length == 0){
                                //All the partecipants of the conversation do not have the app
                                alert("No partecipant selected has Audiolog installed. Operation cancelled.")
                                //TODO: improve, trying to let the user come back
                            }
                        }
                        case "Cancel":{
                            var userChoice = confirm("Are you really sure to delete your message?");
                            if (userChoice){
                                //rollback: deselect everything
                            }else{
                                //go back to options, without closing
                            }
                        }
                            break;
                     }
                    });



                }
        
*/});
    }

}
   
   module.exports = BackendManager;
   