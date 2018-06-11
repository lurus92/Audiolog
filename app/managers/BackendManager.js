
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
        this.firebase.uploadFile({
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
        }).then(
            function (uploadedFile) {
                this.firebase.updateProfile({
                    photoURL: uploadedFile.url
                }).then(callback);
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
        var remotePath = "uploads/messages/"+senderEncodedNumber+"|"+receiverEncodedNumber+"|"+filename;
        console.log("remotePath "+remotePath);
        //File System Module is needed
        var fs = require('file-system');
        this.firebase.uploadFile({
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
                            'timestamp': filename //not really needed, but maybe useful
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

    retrieveConversations(){
        var userConversations = [];
        var returnPromise = new Promise((resolve, reject) => {
            var updateCallback = function(){
                console.log("Query performed");
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
                            //FOR EACH OF THESE CONVERSATIONS, WE SHOULD RETRIEVE MESSAGES
                        }
                        console.log("Result available: ");
                        resolve(userConversations);
                });
        });
        return returnPromise;
    


        
    }


/*
    storeMessageInDB (remoteMessagePath){

    }*/
    
    /**
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
   
   }
   
   module.exports = BackendManager;
   