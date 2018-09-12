/* CONVERSATION MANAGER
** The conversation manager allows the set up of the basic Conversation features,
** acting as an utility module between the front-end and the backend manager
*/
class ConversationManager{   
    
    constructor(){
        this.conversationID = null;
        this.partecipants = [];
        this.partecipantsChecked = 0;
        this.partecipantsWithoutApp = [];
    
    }

    intialize(id){
        this.conversationID = id;
    }

    addPartecipant(rawPhoneNumber){
        var phoneNumber = userManager.getE164phone(rawPhoneNumber);
        if (userManager.isNumberOK(phoneNumber)){
            this.partecipants.push(backendManager.encodePhone(phoneNumber));
        }else{
            alert("ConversationManager > Some problems with the number selected. Raw Number: "+rawPhoneNumber);
        }
    }

    removePartecipant(rawPhoneNumber){
        var phoneNumber = userManager.getE164phone(rawPhoneNumber);
        //Being selected, we assume the phone number is already ok
        this.partecipants.pop(backendManager.encodePhone(phoneNumber));
    }

    /**
     * Function that converts the partecipants, from an array (as present in the obj) to a string, separated by a pipe "|"
     * @return {String}: the formatted string
     */
    stringifyPartecipants(){
        var str = "";
        for (let i = 0; i < this.partecipants.length; i++) {
            str = str + this.partecipants[i] + "|";
        }
        return str; 
    }
    /**
     * Function that analyse the partecipants of a certain conversation, understanding if everybody has the app installed
     * If this 
     */
    checkPartecipants(){
        
    }
    


   
}
   
module.exports = ConversationManager;