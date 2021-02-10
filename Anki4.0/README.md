# Anki 4.0 - AI Powered Study

_The Anki 4.0 project was developed in the context of the Cloud Computing exam at the University of Saleno_

Anki 4.0 is a bot for Telegram, easily adaptable to other platforms, which exploits the services provided by Microsoft Azure. The purpose of the bot is to help students in the study / repetition phase.

The bot is based on one of the most famous study methods in the world, the **flashcard** method, combined with the concept of **spaced repetition**.

## Architecture

![Anki4.0 Architecture](img/architecture.png)

## Prerequisites

- [An Azure Subscription](https://portal.azure.com/)
- Node.js
- Python
- [Azure CLI](https://docs.microsoft.com/it-it/cli/azure/install-azure-cli)
- [ngrok](https://ngrok.com/)
- [Question Generate Model](https://drive.google.com/file/d/1mUAh_2PEHy9_hheN4IGzIWqCZtFKSBkM/view?usp=sharing)
- [Check Answer Model](https://sbert.net/models/stsb-roberta-base.zip)
- [Stripe account](https://stripe.com/it)

## Stripe Setup

1. First of all, you need to create an account on Stripe.
2. After logging in, in the top right you can create an account for this particular "shop", by clicking on "New account" you just need to enter the account name and the country in which it is located.
3. On the page that opens, click on "Download your API keys" copy the publishable key and save it in the _.env_ file in the `STRIPE_PUBLIC` field and copy the secret key saving it in the `STRIPE_PRIVATE` field.
4. Now we need to create a webhook, to do this click on "Developers" in the menu on the left and then on "Webhook", click on "Add endpoint" at the top right and here enter:
    - In the Endpoint URL field enter the server URL by copying it from the ngrok tab in the terminal and add this to the end /api/checkout_completed, you will get something like `https://88a25b9e15a7.ngrok.io/api/checkout_completed`.
    - For the "Events to be sent" field, the following event must be selected from the drop-down menu `checkout.session.completed`.
    - Finally you can finish by clicking on "Add endpoint".

## Resources

Based on [Azure Bot Service](https://docs.microsoft.com/en-us/azure/bot-service) Anki 4.0 utilises some resources on Microsoft Azure to run, furthermore the available functionalities exploit several Azure services that are connected to the bot using specific credentials.
In this section a tutorial for the creation of all the required Azure resources is proposed, both the [Portal](https://portal.azure.com) and the Azure CLI will be used. In order to maintain the cost low as much as possible will be chosen the free tier when available.

**ATTENTION** Unless otherwise indicated, when we talk about .env file we refer to `Bot/.env`

### Resource Group

First thing first an Azure Resource Group is required, this is pretty straightforward to do using the Azure Portal and can also be done dinamically while creating the first resource.

**ATTENTION** The selected region must be the same for all the remaining resources.

### Bot Channels Registration

Bot Channels Registration allows to register a bot in Microsoft Azure Portal with the Azure Bot Service.

1. Create a new resource and using the search bar find 'Bot Channels Registration'.
1. Give the bot a name, this name will be showed on Microsoft Teams, Discord, etc.
1. Provide the details for the Subscription, Resource Group (if you don't have one, here you can create a new one), and Location.
1. Choose the 'Princing tier' F0 (Free).
1. Leave all the others fields as default and press Create. When the resource is been correctly deployed go to resource.
1. In the lateral menu choose 'Settings'.
1. Search for the 'Microsoft App ID', copy it and save it in the file .env in the main folder of the project in MicrosoftAppId field. **ATTENTION** The file can be hidden, press CTRL+H to see it.
1. Click on 'Manage' next to the 'Microsoft App ID' field and click on 'New client secret' bottom.
1. Save the value field of the created key in the file .env in ```MicrosoftAppPassword``` field.

### Text To Speech/Speech To Text

1. Using the search bar find 'Speech'.
2. Provide the details for the Subscription, Resource Group, the name and select the Free tier F0 in the 'Pricing tier' field.
3. Check the box and create. When the resource is been correctly deployed go to resource.
4. In the lateral menu choose 'Keys and Endpoint', click on 'Show keys'.
5. Copy one the two keys and save it in the file .env in ```SPEECH_API``` field.
6. Copy position and save it in the file .env in ```SPEECH_LOCATION``` field.

### CosmosDB

1. Using the search bar find 'CosmosDB'.
2. Provide the details for the Resource Group, the name and leave other field with the default. For the API field, select Azure Cosmos DB for MongoDB API.
3. Check the box and create. When the resource is been correctly deployed go to resource.
4. In the lateral menu choose 'Data explorer'.
5. Click on 'New Database in the top left.'
6. In the lateral menu choose 'Connection string'.
7. Copy Username and save it in the file .env in ```COSMOSDB_USER``` field.
8. Copy one the two passwords and save it in the file .env in ```COSMOSDB_PASSWORD``` field.
9. Copy database name (in the top left) and save it in the file .env in ```COSMOSDB_DBNAME``` field.
10. Copy host and save it in the file .env in ```COSMOSDB_HOST``` field.
11. Copy port and save it in the file .env in ```COSMOSDB_PORT``` field.
12. Repeat same copy operations for `Functions/.env`

### Function App

[Azure Function App](https://docs.microsoft.com/en-us/azure/azure-functions/functions-overview) is the Serverless Computing service offered by Azure that allows to run blocks of code called function.
Anki 4.0 uses a function to work with QuestionAndAnswerML.
Using the Azure Portal.

1. Create a new resource and using the search bar find 'Function App'.
2. Provide the details for the Subscription, Resource Group and the name.
3. Select Node.js as 'Runtime stack', choose the Region and leave the remaining fields as default.
When the resource is been correctly deployed go to resource.
4. In the lateral menu choose 'Functions' and create a new function using the button 'Add'.
5. Select the 'Template HTTP trigger' and insert a name for the function.
6. The Portal will redirect you automaticaly in the function page, click on 'Get Function URL'. copy the URL and save it in the file _.env_ in `FunctionEndpoint` field.
7. In the lateral menu of the same page choose 'Code+test', replace the code with the one inside the file ```Functions/retrieveQna.js``` in the servicesResources folder and save.
8. Go to `https://<FunctionAppName>.scm.azurewebsites.net` and choose 'Debug Console' -> 'CMD'.

```sh
$ cd site/wwwroot
```

9. Upload Question.js file and .env file.
10. In the CMD run the follow line.
```sh
$ npm install axios mongoose dotenv
```

### Machine Learning

The Azure Machine Learning service empowers developers and data scientists with a wide range of productive experiences for building, training, and deploying machine learning models faster. Accelerate time to market and foster team collaboration with industry-leading MLOps—DevOps for machine learning.
Anki4.0 uses Machine Learning services for the creation of contaners, which expose the edpoits of our models.

In this section, you will learn how to deploy the models for creating questions and verifying answers.

Using the Azure Portal.

1. Create a new resource and using the search bar find 'Machine Learning'.
2. Provide the details for the Subscription, Resource Group and the name.
3. Leave all the others fields as default.

When the resource is been correctly deployed go to resource.

1. Donwload `Question Generate Model` and extract into `/multi-qg-qa` folder.
2. Donwload `Check Answer Model` and extract into `/checkanswer/models` folder.
3. In `MachineLearning/loader.py` enter the missing data required from the file. you can find them on the main page of the resource. Then run commands below.

```sh
$ pip install azureml-sdk
$ python MachineLearning/loader.py
```

4. Wait for the script to finish.
5. Go `MachineLearning/multi-qg-qa` folder and run the script below.

```sh
$ az ml model deploy -n qgenerationn -m qgeneration:1 --ic inferenceconfig.json --dc deploymentconfig.json -w WORKSPACE_NAME -g RESOUCEGROUP_NAME
```

6. Go `MachineLearning/checkanswer` folder and run the script below.

```sh
$ az ml model deploy -n checkanswer -m checkanswer:1 --ic inferenceconfig.json --dc deploymentconfig.json -w WORKSPACE_NAME -g RESOUCEGROUP_NAME
```

Now both containers have been deployed. It may take several minutes for them to start.
Through the `Studio web URL` field inside the resource it is possible to monitor the cotainers and the registered models.
Inside, in the **endpoint** section you can view the **links** to query the generated endpoint.
Add the related links to the endpoints in the `.env`, you can find this informations in `consume` field.

7. The `QNA_ML_ENDPOINT` field for the model dedicated to generation of questions (in `Functions/.env`).

8. The `QNA_ML_TOKEN` field for the access to the model dedicated to generation of questions (in `Functions/.env`).

9. The `CHECK_ML_ENDPOINT` field for the model dedicated to check answer.

10. The `CHECK_ML_TOKEN` field for the access to the model dedicated to check answer.

## Execution

A bot developed with Azure Bot Service can be hosted both on Cloud using Web App service and in local using [ngrok](https://ngrok.com/). In this case the bot work well only using Telegram because the Bot Emulator doesn/t provide all necessary functionalities. The bot will work in the same way but is clearly better to run the bot in a local environment while testing.
### Local hosting

#### Testing the bot in Telegram

1. Start ngrok

```sh
$ ./ngrok http -host-header=rewrite 3978
```

2. Copy the URL showed in terminal by ngrok and save it in _.env_ file in `SERVER_URL`.

3. Open a terminal in Bot folder and start the bot

```sh
$ npm i
$ npm start
```

1. Go to the Bot Channels Registration resource using the Azure Portal:
    - Search BotFather in Telegram
    - Start the conversation and digit ```/newbot```, set a correct name and copy the API Key.
    - In the lateral menu choose 'Channels', select Telegram in the list and paste the API Key copied in the previous step.
    - In the lateral menu choose 'Settings' and insert as 'Messaging endpoint' the URL showed in terminal by ngrok followed by 'api/messages/". You should get something like `https://1aa1a1234567.ngrok.io/api/messages`.
    - Click on 'Save'.
    - Go in Telegram and search the newly created bot, everything is already working.
