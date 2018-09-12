
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
        if (this.isRemoteFile) return this.player.playFromURL(this.playerOptions);
        return this.player.playFromFile(this.playerOptions);
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


   
}
   
module.exports = AudioManager;