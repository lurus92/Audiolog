var platform = require("platform"); 

//Phone number utilities, documentation here: https://github.com/ruimarinho/google-libphonenumber
const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

class UserManager{   
    
    constructor(){
        this.name = "Mario Rossi";
        this.phoneNumber = "00000000";
        this.id = "0000";
        this.encodedPhoneNumber = ""
        this.defaultLocale = platform.device.region;
        this.allowSendSMS = false;
        this.isTesting = true;      //TODO: CHANGE/DELETE IN PRODUCTION
    }

    getE164phone(rawPhoneNumber){
        try{
            var phoneNumber = phoneUtil.parseAndKeepRawInput(rawPhoneNumber, this.defaultLocale);
            return phoneUtil.format(phoneNumber, PNF.E164)
        }catch(e){
            console.log("error: "+e);
        }
        
    }
   
    isNumberOK(E164Phone){
        var phoneNumberObj = phoneUtil.parseAndKeepRawInput(E164Phone, this.defaultLocale);
        return phoneUtil.isPossibleNumber(phoneNumberObj) && phoneUtil.isValidNumber(phoneNumberObj) && phoneUtil.isValidNumberForRegion(phoneNumberObj, userManager.defaultLocale);
    }
}
   
module.exports = UserManager;