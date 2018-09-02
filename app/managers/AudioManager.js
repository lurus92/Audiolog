
/* AUDIO MANAGER
** The recorder manager class provide capabilities to record and play audio files
*/
var audio = require("nativescript-audio");


class AudioManager{   
    
    constructor(){
        this.isRecording = false;
        this.playerOptions = {}
        this.player = new audio.TNSPlayer();
        this.isRemoteFile = undefined;
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


   
}
   
module.exports = AudioManager;