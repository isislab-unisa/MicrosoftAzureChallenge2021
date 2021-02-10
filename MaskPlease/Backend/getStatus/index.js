const { QueueServiceClient } = require("@azure/storage-queue");
const connStr = process.env["AzureWebJobsStorage"];
const queueServiceClient = QueueServiceClient.fromConnectionString(connStr);


module.exports = async function (context, req) {


    const idreq = (req.query.idreq || (req.body && req.body.idreq));
    
    const queueName = idreq;

    // Check Messages
    try{
        const queueClient = queueServiceClient.getQueueClient(queueName);
        const response = await queueClient.receiveMessages();
        
        if (response.receivedMessageItems.length == 1) {
            const receivedMessageItem = response.receivedMessageItems[0];
            
            let isMask = 300;
            if(receivedMessageItem.messageText == "NO MASK") isMask = 250;
            if(receivedMessageItem.messageText == "OK MASK") isMask = 251;
            
            const deleteMessageResponse = await queueClient.deleteMessage(
            receivedMessageItem.messageId,
            receivedMessageItem.popReceipt
            );


            context.res = {
                status: isMask,
                body: receivedMessageItem.messageText
            };

        }
            await queueClient.delete();


    }
    catch(err) {
        context.res = {
            status: 300,
            body: "No messages ready ..."
        };
    }

}
