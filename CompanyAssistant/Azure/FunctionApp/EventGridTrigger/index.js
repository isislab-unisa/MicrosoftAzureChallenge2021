const request = require('request');
const axios = require('axios');
const querystring = require('querystring');
const SSHConnection = require('node-ssh-forward').SSHConnection;
const tanentId = 'TENANT-ID';
const subId = 'SUBSCRIPTION-ID';
const clientId = 'CLIENT-ID';
const clientSecret = 'CLIENT-SECRET';
const resGroup = 'RES-GROUP';
const scopeAzure = "SCOPE"
const server = "SERVER-URL" //url del server dove è in esecuzione la WebApp

var username;
var password;

module.exports =  async function (context, eventGridEvent) {

    var eventType = eventGridEvent.eventType

    

    vmID = eventGridEvent.subject
    array = eventGridEvent.subject.split('/');
    vmName = array[array.length-1];




    if(eventType == 'Microsoft.Resources.ResourceWriteSuccess'){

            var inCreation;
            try {
                const response =  await axios.post(server+'/ifVmExist?name=' + vmName, {});
                
                inCreation = response.data.inCreation;
                username = response.data.username
                password = response.data.password
                os = response.data.os

                if(inCreation){


                     getToken(function (err,token){

                        if(!err){
                            
                             getVM(vmID,token,function(err,res){

                                    if(!err){

                                        console.log(res);

                                        var ipAddr = JSON.parse(res).properties.ipAddress +'';

                                        if(os == "windows"){

                                            const response = axios.get(server+'/VmReady?name='+vmName+'&ipAddr='+ipAddr, {});

                                        }else{

                                            const sshConnection = new SSHConnection({
                                            endHost: JSON.parse(res).properties.ipAddress,
                                            username: username,
                                            password: password
                                            })

                                            var request = "sudo wget https://raw.githubusercontent.com/LorenzoFasolino/createvirtualmachine/main/config.sh; sudo chmod 777 config.sh; ./config.sh "+server+" "+vmName+" "+ipAddr; 

                                            sshConnection.executeCommand(request);


                                        }
                                        

                                    }else{
                                        context.log("VM Non trovata");
                                    }


                            });



                        }else{

                            context.log("Token non preso!");

                        }


                    });

                    

                }

        } catch (error) {
            context.log(error); 
        }

    }else{

            var promiseToken = new Promise(function (resolve, reject) {

                getToken(function(err,token){
                    if(!err){
                        resolve(token);
                    }else{
                        resolve(null);
                    }
                    
                });

            });

            var token = await promiseToken;

            var promiseDisk= new Promise(function (resolve, reject) {

                deleteDisk(token,function(err,res){

                    if(!err){
                        resolve(true);
                    }else{
                        resolve(false);
                    }

                });

            });

            var diskDeleted = await promiseDisk;


            var promiseNet= new Promise(function (resolve, reject) {

                deleteNetworkInterface(token,function(err,res){

                    if(!err){
                        resolve(true);
                    }else{
                        resolve(false);
                    }

                });

            });

            var netDeleted = await promiseNet;

            

            var promiseIp = new Promise(function (resolve, reject) {

                setTimeout(function(){

                    deleteIp(token,function(err,res){

                        if(!err){
                            resolve(true);
                        }else{
                            resolve(false);
                        }

                    });

                }, 2000);

                

            });

            var ipDeleted = await promiseIp;


            
        


    }



};


var getVM = function(vmID,token,callback){
    
    var options = {
        uri: "https://management.azure.com/subscriptions/"+subId+"/resourceGroups/"+resGroup+"/providers/Microsoft.Network/publicIPAddresses/"+vmName+"_ip?api-version=2020-07-01",
        method: 'GET',
        headers:{
            'Authorization': "Bearer "+token
        }
    };

    request(options, function (error, response, body){

              
        if(!error && response.statusCode == 200){
            callback(null,body);
            
        }else{
            callback("Errore", body);
        }
            
    });



}




//PRENDE IL TOKEN 
var getToken = function(callback){

    var token

    var data = {
        client_id:clientId,
        client_secret:clientSecret,
        grant_type:'client_credentials',
        scope : scopeAzure
    }

    var form = querystring.stringify(data);

    var options = {
        uri:'https://login.microsoftonline.com/'+tanentId+'/oauth2/v2.0/token',
        method: 'POST',
        headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body:form
    };

    request(options, function (error, response, body){

              
        if(response.statusCode != 200){
            callback(response,null);
        }else{
            token = JSON.parse(body).access_token;
            callback(null,token);
        }
            
    });
}




//Cancella LA NETWORK INTERFACE 
var deleteNetworkInterface = function(token,callback){

    var options = {
        uri:'https://management.azure.com/subscriptions/'+subId+'/resourceGroups/'+resGroup+'/providers/Microsoft.Network/networkInterfaces/'+vmName+'_netInterface?forceDelete=true&api-version=2020-07-01',
        method: 'DELETE',
        headers:{
            'Authorization': "Bearer "+token
        }
    };

    request(options, function (error, response, body){

              
        if(!error && response.statusCode == 202){
            callback(null,response);
            
        }else{
            callback(error, body);
        }
            
    });


}



//Cancella L' IP'
var deleteIp = function(token,callback){

    var options = {
        uri:'https://management.azure.com/subscriptions/'+subId+'/resourceGroups/'+resGroup+'/providers/Microsoft.Network/publicIPAddresses/'+vmName+'_ip?forceDelete=true&api-version=2020-07-01',
        method: 'DELETE',
        headers:{
            'Authorization': "Bearer "+token
        }
    };

    request(options, function (error, response, body){

              
        if(!error && response.statusCode == 202){
            callback(null,response);
            
        }else{
            callback(error, body);
        }
            
    });


}

//Cancella Il dico
var deleteDisk = function(token,callback){

    var options = {
        uri:'https://management.azure.com/subscriptions/'+subId+'/resourceGroups/'+resGroup+'/providers/Microsoft.Compute/disks/Disk_'+vmName+'?api-version=2020-06-30',
        method: 'DELETE',
        headers:{
            'Authorization': "Bearer "+token
        }
    };

    request(options, function (error, response, body){

              
        if(!error && response.statusCode == 202){
            callback(null,response);
            
        }else{
            callback(error, body);
        }
            
    });


}



