const ApiKeyCredentials = require('@azure/ms-rest-js').ApiKeyCredentials;

const ComputerVisionClient = require('@azure/cognitiveservices-computervision').ComputerVisionClient;
const keyV = process.env["keyVision"];
const endpointV = process.env["endpointVision"];
const computerVisionClient = new ComputerVisionClient(new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': keyV } }), endpointV);

const FaceClient = require('@azure/cognitiveservices-face').FaceClient;
const keyF = process.env["keyFaceAPI"];
const endpointF= process.env["endpointFaceAPI"];
const clientFace = new FaceClient(new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': keyF } }), endpointF);

const { QueueServiceClient } = require("@azure/storage-queue");
const connStr = process.env["AzureWebJobsStorage"];
const queueServiceClient = QueueServiceClient.fromConnectionString(connStr);
const queueName = process.env["queueNAME"];

const { CosmosClient } = require("@azure/cosmos");
const endpoint = process.env["endpointCosmos"];
const key = process.env["keyCosmos"];
const clientDB = new CosmosClient({ endpoint, key });


//Create queue
async function createQueue(path){
        let idqueue = path.match(/[^\/?#]+(?=$|[?#])/)[0];
        const queueClient = queueServiceClient.getQueueClient(idqueue);
        const createQueueResponse = await queueClient.create();
        return queueClient;
}

//Update cosmosDB
async function updateCosmos(container){
    var d = new Date();
    var today = new Date().toISOString().slice(0, 10);

    var queri = "SELECT * FROM c WHERE c.date = '"+today+"'";

    const { resources } = await container.items.query(queri).fetchAll();

    if(resources.length == 0){
         const ogg = {date: today, numMask: 1};
         container.items.create(ogg);
    
    }else{
        for (const o of resources) {
            o.numMask = o.numMask + 1;
            const { resource: updatedItem } = await container.item(o.id, o.date).replace(o);
        }
    }
}

var maskDetected = false;

// Check with Computer Vision 
async function checkVision(context, url){
        
    const caption = (await computerVisionClient.describeImage(url)).captions[0];
    
    var descr = caption.text;
    return descr.includes("mask");
}

// Check with Face API 
async function checkFaceAPI(context, url){

    let find = false;

    const options = {
        returnFaceLandmarks: true,
        returnFaceAttributes: ["accessories"]
    }; 
    let singleDetectedFace = await clientFace.face.detectWithUrl(url, options)
        .then((result ) => {
            
            result[0].faceAttributes.accessories.forEach(function(entry) {
                if(entry.type == "mask"){
                    find =  true;
                }  
            });
        }).catch((err) => {
           
            find = false;
        })

    return find;
}




module.exports = async function (context, myBlob) {

   const urlToProcess = process.env["BlobStorage"]+context.bindingData.blobTrigger;

    // SETTING COSMOS DB
    const { database } = await clientDB.databases.createIfNotExists({ id: "DBmaskplease" });
    
    const { container } = await database.containers.createIfNotExists({ id: "MaskXday" });
   


    //Create client queue
    const queueClient = await createQueue(context.bindingData.blobTrigger); 

    if(await checkVision(context, urlToProcess) || await checkFaceAPI(context, urlToProcess)){
        
        // send message to queue
        await queueClient.sendMessage("OK MASK");

        //Update CosmosDB
        await updateCosmos(container);

        return;
    }
    else {
        
        await queueClient.sendMessage("NO MASK");
        
        }

};
