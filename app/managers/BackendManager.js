var fs = require("file-system");
var dialogs = require("ui/dialogs");



class BackendManager{   
    
    constructor(){
        this.firebaseStatus = "not active";
        this.firebase = require("nativescript-plugin-firebase");
    }

    /**
     * Initialization of firebase connector
     */
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
    /**
     * Methods that implements the anonymous login, only for testing puposes
     * @param  {Function} callback  The function to be executed at the end
     */
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
    /**
     * Method that implements the login via phone number (confirmation required)
     * @param  {String}     number      the phone number of the user in E164 format. TODO: remove this and acquire from UserManager
     * @param  {Function}   callback    the function to be executed at the end
     */
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

    /**
     * Method that uploads a profile picture to Firebase Remote Storage
     * @param  {String}     profilePhotoUrl the path of the image selected in the phone File System
     * @param  {Function}   callback        the function to be exectued at the end
     */
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

    finaliseRegistration(callback){
            /*
            this.firebase.updateProfile({
              displayName: userManager.name
            }).then(function(){*/
                console.log("path: "+"/users/"+this.encodePhone(userManager.phoneNumber));
                this.firebase.setValue("/users/"+this.encodePhone(userManager.phoneNumber),
                {
                  "name": userManager.name,
                  "id": userManager.id,
                  "involvedInConversation": ""
                }).then(function(){
                    navigationManager.navigateToMainScreen();   //TODO: use callback variable
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
                      'path': remotePath,
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
            //var remotePath = "uploads/messages/"+conversationID+"/"+filename+".caf"; //TODO: understand why CAF and not mp3
            //DON'T BE FOOLED: At this time we do not have conversationID (if this is a new conversation)
            var remotePath = "uploads/messages/"+filename+".caf";
            
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
                //I need the download URL of the file
                var downloadURL = "not valid";
                this.firebase.storage.getDownloadUrl({
                    remoteFullPath: remotePath
                }).then(downloadURL => {
                    this.firebase.push(
                        '/messages',
                        {
                        'localPath': remotePath,
                        'downloadURL': downloadURL,
                        'timestamp': filename,
                        'sender' : userManager.encodedPhoneNumber
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
                                    'users': conversationManager.stringifyPartecipants()  //TODO: ALL
                                }
                            ).then( (result) => {
                                var conversationPrimaryKey = result.key;
                                console.log("new conversation created with id: "+conversationPrimaryKey);
                                //Should insert here the id of the conversation inside user object.
                                //Should do this for every user in the conversation
                                var partecipantsOfConversation = conversationManager.partecipants;
                                partecipantsOfConversation.push(userManager.encodedPhoneNumber);
                                var userPromises = [];
                                for (var i = 0; i < partecipantsOfConversation.length; i++) {
                                    userPromises[i] = new Promise(resolve => {
                                        this.firebase.getValue("/users/"+partecipantsOfConversation[i]).then((result) =>{
                                            console.log(result);
                                            var newStringToWrite ="";
                                            if (result.value == null) resolve();
                                            if (result.value.involvedInConversation == "") newStringToWrite = "" + conversationPrimaryKey;
                                            else if (result.value.involvedInConversation.indexOf(conversationPrimaryKey) == -1) newStringToWrite = result.value.involvedInConversation + "|"+conversationPrimaryKey;
    
                                            if (newStringToWrite != "") this.firebase.update("/users/"+result.key,
                                                {"involvedInConversation":newStringToWrite}).then(resolve())
                                        })});
                                    }
                                
                                Promise.all(userPromises).then(() => {
                                    UIManager.refreshConversationList();
                                });
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
    
                    });
                });
                
        });
    });
    }

    /** 
     *  Retrieve the conversation started by the user, or where the user is present
     *  The method performs a query to the /conversation node, then check if the user is present inside the name of the conversation (encoded send+dest)
     *  @return {Promise}   returnPromise:      the method returns an asyncronous executor.
     *  @var    {Array}     userConversations:  the value returned by the promise when fullfilled. It is an array containing the IDs of conversation where the user is present
     *  //TODO: try to return the conversations already sorted by... something. 
     * 
     *  //2TODO:    Is important to insert the the conversation ID inside the user object. This is the only way to 
     *              retrieve conversation of an user efficiently
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


    retrieveConversationsNEW(){
        return new Promise(resolve => {
            this.firebase.getValue("/users/"+userManager.encodedPhoneNumber).then( result => {
                resolve(result.value.involvedInConversation.split("|"));
            });
        })
    }

    
    /**
     * Retrieve the messages of a particular conversation
     * @param   {String}    conversationId      the ID of conversation to consider
     * @return  {Promise}                       the asyncrounous executor returned by the method
     * @var     {Array}     playableURLs        the array of audio URLs of the specific conversation 
     */

    retrieveMessages(conversationId){
        var playableURLs = [];
        return new Promise (resolve => {
            //Getting list of messages id from conversation
            this.firebase.getValue("/conversations/"+conversationId).then(result =>{
                var messagesIDs = result.value.messages.split("|");
                //For anyone of this, we should get the URL
                var promises = [];
                for(var i=0; i<messagesIDs.length; i++){
                    promises[i] = this.firebase.getValue("/messages/"+messagesIDs[i]).then(result => {
                        playableURLs.push(result.value.downloadURL);
                    });
                }
                return Promise.all(promises);
                //Promise.all(promises).then(resolve(playableURLs));
            }).then(() => {
                resolve(playableURLs);
            })
        });
    }

    /**
     * Retrieve the messages of a particular conversation, considering heap
     * Heap is a nullable timestamp. Contains the most recent timestamp of the message seen by the user, or it is null.
     * Thus, we should pass to the AudioManager only more recent conversation
     * @param   {String}    conversationId      the ID of conversation to consider
     * @param   {String}    heap                timestamp of the last message seen by the user
     * @return  {Promise}                       the asyncrounous executor returned by the method
     * @var     {Array}     playableURLs        the array of audio URLs of the specific conversation 
     */

    retrieveMessagesNEW(conversationId, heap){
        if (!heap) heap = 0; 
        var playableURLs = [];
        return new Promise (resolve => {
            //Getting list of messages id from conversation
            this.firebase.getValue("/conversations/"+conversationId).then(result =>{
                var messagesIDs = result.value.messages.split("|");
                //For anyone of this, we should get the URL
                var promises = [];
                for(var i=0; i<messagesIDs.length; i++){
                    promises[i] = this.firebase.getValue("/messages/"+messagesIDs[i]).then(result => {
                        if (result.value.timestamp > heap)
                            /*playableURLs.push({
                                "timestamp": result.value.timestamp,
                                "url": result.value.downloadURL
                            });*/
                            playableURLs.push(result.value.timestamp + "|" + result.value.downloadURL)
                    });
                }
                return Promise.all(promises);
            }).then(() => {
                resolve(playableURLs);
            })
        });
    }



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
   
    /**
     * Understand if a set of users (contained in conversationManager.partecipants) is registered in the app
     * and adjusts conversationManager.partecipants in order to be send messages according to user desire to invite
     * friends in the app
     * @var     userQueryPromises   an array of promises (firebase remote calls), each for user
     * @returns {Promise}           the promise resolved only when all users have been checked (Promise.all)
     * 
     */ 
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
        return Promise.all(userQueryPromises).then(() => {
                //if (userManager.isTesting) return true;
                if (conversationManager.partecipantsWithoutApp.length != 0){ 
                    //Should ask user if we want to keep the non-registered receivers and send them an SMS. ONLY ONCE
                    var options = ["Send SMS to invite friends","Invite friends in other ways","Send message only to registered"];
                    dialogs.action({
                        message: "Ops! Seems that some of your contacts have still not yet installed Audiolog.",
                        cancelButtonText: "Cancel",
                        actions: options
                    }).then(result => {
                        switch (result) {
                            case options[0]:
                                console.log("YEAH! I should send message to everyone!");
                                //resolve(true);
                                break;
                            case options[1]:
                                console.log("Ok, let's open share overlay");
                                //resolve(true)
                                break;
                            case options[2]:{
                                //TODO: TEST IT MOTHERFUCKER!
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
                                break;
                            }
                            case "Cancel":{
                                var userChoice = confirm("Are you really sure to delete your message?");
                                if (userChoice){
                                    //rollback: deselect everything
                                    //deselect users: easy
                                    conversationManager.partecipants = [];
                                    //Deselect users from UI: a little bit more difficult

                                }else{
                                    //go back to options, without closing
                                    //Should propose again the question
                                }
                            }
                                break;
                         }
                         //resolve();
                        });
                    }
            
        }).catch( () => console.log("Error in the general promise"));
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
        
*/
    }

}
   
   module.exports = BackendManager;
