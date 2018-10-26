
/* AUDIO MANAGER
** The recorder manager class provide capabilities to record and play audio files
*/
var audio = require("nativescript-audio");
var app = require( "application" );



class AudioManager{   
    
    constructor(){
        //get permssion for recording
        if(app.android)
            permissions.requestPermission(android.Manifest.permission.RECORD_AUDIO, "Let me hear your thoughts...").then(this.prepareRecording);
        else
            this.prepareRecording();
        if (audio.TNSRecorder.CAN_RECORD()) console.log("NO RECORDING CAPABILITIES");
        // Class Initialization
        this.isRecording = false;
        this.playerOptions = {}
        this.player = new audio.TNSPlayer();
        this.isRemoteFile = undefined;
        this.recorder = new audio.TNSRecorder();

    }

    prepareRecording(){
        this.audioPath = dataManager.audioFolder.path + '/'+Date.now()+'.caf';
        this.recorderOptions = {
            filename: this.audioPath,
            infoCallback: function () {
            console.log('infoCallback');
            },
            errorCallback: function () {
            console.log('errorCallback');
            alert('Error recording.');
            }
        }
            
    }

    initializeWithURL(url){
        this.isRemoteFile = true;
        this.playerOptions = {
                audioFile: url,
                loop: false
        }
    }

    initializeWithFile(url){
        this.isRemoteFile = false;
        this.playerOptions = {
                audioFile: url,
                loop: false
        }
    }


    initializeWithCustomOptions(options){
        this.playerOptions = options;
    }

    play(){
        if (this.isRemoteFile) return this.player.playFromUrl(this.playerOptions);
        return this.player.playFromFile(this.playerOptions);
    }

    playImmediately(){
        if (this.isRemoteFile) this.player.playFromUrl(this.playerOptions);
        else this.player.playFromFile(this.playerOptions);
    }

    record(){
        if (this.isRecording) return;
        this.prepareRecording();
        this.recorder.start(this.recorderOptions).then((res) => {
            //Things to do after the recording is started
            console.log("recording started");
            this.isRecording = true;
   
        }, function (err) {
            console.log('ERROR: ' + err);
        });
    }
    /**
     * @returns {Promise} the promise that will stop the recording. Check the result
     */
    stopRecording(){
        return this.recorder.stop().then(() => {
            this.isRecording = false;
            console.log("Recording Stopped");
        });
    }


    /**
     * Function that play an array of files passed via URL as parameters
     * @param       {Object[]}  urlArray              an array of objects containing two properties, url and timestamp.
     * @property    {String}    url                   the actual downloadable url of the  message, ready to be played by the player
     * @property    {Number}    timestamp             the timestamp of the file     
     * IMPORTANT NOTICE: THE OBJECT urlArray CAN BE NOT SORTED BY TIMESTAMP (as being built asyncronously)
     * @param       {Button}    conversationButton    the conversation Button is the model of the conversation, merged with the UI. 
     *                                                The audioManager should update its heapConversation property to the timestamp of the 
     *                                                last message heard by the user
     */
    playConversation(dataArray, conversationButton){
        console.log("Received the following url Array that I should play");
        console.log(JSON.stringify(dataArray));
        //In order to destroy all risk of incorrect matching, dataArray is an Array with element formatted as such
        // <timestamp>|<downloadURL
        // First thing, let's split them all
        var timestamps = [];
        var downloadURLs = []; 
        for (let i = 0; i < dataArray.length; i++) {
            timestamps [i] = dataArray[i].split("|")[0];
            downloadURLs [i] = dataArray[i].split("|")[1];            
        }
        //TODO: sort downloadURLs by timestamps

        /*PLAY THE AUDIO FILES
        for (let i = 0, p = Promise.resolve(); i < dataArray.length; i++) {
            p = p.then(_ => new Promise(resolve => {
                // TO TEST
                this.initializeWithURL(downloadURLs[i]);
                this.playImmediately();
                conversationButton.heapConversation = timestamps[i];
                //console.log(urlArray[i].url);
                resolve();
            }
            ));
        }*/
        for (let i = 0, p = Promise.resolve(); i < dataArray.length; i++) {
            p = p.then( () => {
                this.initializeWithURL(downloadURLs[i]);
            }).then( _ => 
                this.play()
            )
            
        }
    }


   
}
   
module.exports = AudioManager;