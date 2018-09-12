var fs = require('file-system');

/* DATA MANAGER
** The data manager class allows the app to communicate to the filesystem of the device,
** storing a copy of the remote database
*/
class DataManager{   
    
    constructor(){
        this.currentUser = "";
        this.audioFolder = fs.knownFolders.currentApp().getFolder("audio");
    }

    


   
}
   
module.exports = DataManager;