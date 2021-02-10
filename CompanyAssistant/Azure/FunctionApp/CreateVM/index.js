const request = require('request');
const querystring = require('querystring');
const tanentId = 'TENANT-ID';
const subId = 'SUBSCRIPTION-ID';
const clientId = 'CLIENT-ID';
const clientSecret = 'CLIENT-SECRET';
const resGroup = 'RES-GRUOP';
var vmName = 'test64';
var vmSize = 'Standard_B1s';
const scopeAzure = "SCOPE"
var imageRef =  {}

module.exports =  async function (context, req) {

    imageRef = {};

    vmName = (req.query.name || (req.body.name));
    user = (req.query.username || (req.body.username));
    pass = (req.query.password || (req.body.password));
    vmSize = (req.query.vmSize || (req.body.vmSize));
    os = (req.query.os || (req.body.os));


    if(os.toString().trim() == "windows"){
        imageRef = {
                        "sku": "2016-Datacenter-smalldisk",
                        "publisher": "microsoftwindowsserver",
                        "version": "latest",
                        "offer": "windowsserver"
                    }
    }else{
        imageRef =  {
                        "sku": "16.04-LTS",
                        "publisher": "Canonical",
                        "version": "latest",
                        "offer": "UbuntuServer"
                    }
    }


    var error = null;

    var promiseToken = new Promise(function (resolve, reject) {

                getToken(function(err,token){
                    if(!err){
                        resolve(token);
                    }else{
                        error = err;
                        resolve(null);
                    }
                    
                });

            });

    var token = await promiseToken;

    var promiseIP = new Promise(function (resolve, reject) {

                createIp(token,function(err,res){
                    if(!err){
                        resolve(res);
                    }else{
                        error = err;
                        resolve(null);
                    }
                    
                });

    });

    var resIP = await promiseIP;

    var promiseNetInterface = new Promise(function (resolve, reject) {

        setTimeout(function(){

                createNetInterface(token,function(err,res){
                    if(!err){
                        resolve(res);
                    }else{
                        error = err;
                        resolve(null);
                    }
                    
                });

        },1200);

    });

    var resNetInterface = await promiseNetInterface;

    var promiseVM = new Promise(function (resolve, reject) {

        setTimeout(function(){

                createVm(token,function(err,res){
                    if(!err){
                        resolve(res);
                    }else{
                        error = err;
                        resolve(null);
                    }
                    
                });

        },1200);

    });

    var resVm = await promiseVM;

    var res 

    if(!error){

        res = {"resIP" : resIP,
                "resNetInterface" : resNetInterface,
                "resVm": resVm
            }

    }else{

        res = {"resIP" : resIP,
                "resNetInterface" : resNetInterface,
                "resVm": resVm,
                "error": error
            }

    }
        
    context.res = {

        body : res,
        headers: {
        'Content-Type': 'application/json'
        }

    }

    context.done();

        
}


var createIp = function(token, callback){

    var data = {
        "properties": {
            "publicIPAllocationMethod": "Static",
            "idleTimeoutInMinutes": 10,
            "publicIPAddressVersion": "IPv4"
        },
        "sku": {
            "name": "Basic",
            "tier": "Regional"
        },
        "location": "westeurope"
        }

    var options = {
        uri:'https://management.azure.com/subscriptions/'+subId+'/resourceGroups/'+resGroup+'/providers/Microsoft.Network/publicIPAddresses/'+vmName+'_ip?api-version=2020-07-01',
        method: 'PUT',
        headers:{
            'Content-Type':'application/json',
            'Authorization': "Bearer "+token
        },
        json:data
    };

    request(options,function(error, response, body){

        if(!error && response.statusCode == 200 ){

            callback(null,response);

        }else{
            callback(error,body);
        }

    });



}


var createNetInterface = function(token, callback){

    var data = {
        "properties": {
            "enableAcceleratedNetworking": false,
            "ipConfigurations": [
            {
                "name": "ipconfig1",
                "properties": {
                    "publicIPAddress": {
                        "id": "/subscriptions/"+subId+"/resourceGroups/"+resGroup+"/providers/Microsoft.Network/publicIPAddresses/"+vmName+"_ip"
                    },
                    "subnet": {
                        "id": "/subscriptions/"+subId+"/resourceGroups/"+resGroup+"/providers/Microsoft.Network/virtualNetworks/Default-vnet/subnets/default",
                    },
                }
            }
            ],
            "networkSecurityGroup":{
                "id": "/subscriptions/"+subId+"/resourceGroups/"+resGroup+"/providers/Microsoft.Network/networkSecurityGroups/Default-nsg"
            },
        },
        "location": "westeurope"
        }

    var options = {
        uri:'https://management.azure.com/subscriptions/'+subId+'/resourceGroups/'+resGroup+'/providers/Microsoft.Network/networkInterfaces/'+vmName+'_netInterface?api-version=2020-07-01',
        method: 'PUT',
        headers:{
            'Content-Type':'application/json',
            'Authorization': "Bearer "+token
        },
        json:data
    };

    request(options,function(error, response, body){

        if(!error && response.statusCode == 200 ){

            callback(null,response);

        }else{
            callback(error,body);
        }

    });

}


//CREA LA VM 
var createVm = function(token,callback){

    var data = {
        "location": "westeurope",
        "properties": {
            "hardwareProfile": {
            "vmSize": vmSize
            },
            "storageProfile": {
            "imageReference": imageRef,
            "osDisk": {
                "caching": "ReadWrite",
                "managedDisk": {
                "storageAccountType": "Standard_LRS"
                },
                "name": "Disk_"+vmName,
                "createOption": "FromImage"
            }
            },
            "osProfile": {
            "adminUsername": user,
            "computerName": vmName,
            "adminPassword": pass
            },
            "networkProfile": {
            "networkInterfaces": [
                {
                "id": "/subscriptions/"+subId+"/resourceGroups/"+resGroup+"/providers/Microsoft.Network/networkInterfaces/"+vmName+"_netInterface",
                "properties": {
                    "primary": true
                }
                }
            ]
            }
        }
    }


    var options = {
        uri:'https://management.azure.com/subscriptions/'+subId+'/resourceGroups/'+resGroup+'/providers/Microsoft.Compute/virtualMachines/'+vmName+'?api-version=2017-12-01',
        method: 'PUT',
        headers:{
            'Content-Type':'application/json',
            'Authorization': "Bearer "+token
        },
        json:data
    };

    request(options, function (error, response, body){

              
        if(!error && response.statusCode == 200){
            callback(null,response);
            
        }else{
            callback(error, body);
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
            callback(body.error,null);
        }else{
            token = JSON.parse(body).access_token;
            callback(null,token);
        }
            
    });
}






