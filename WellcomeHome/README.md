

# WellcomeHome
WellcomeHome è un software che nasce con l'obbiettivo di ottenere un maggior controllo all'interno di un contesto privato, come ad esempio un appartamento, un ufficio o più generalmente un qualsiasi luogo non aperto al pubblico.
## Panoramica

Grazie alle tecnologie offerte dal Cloud, WellcomeHome è stato progettato con lo scopo di ridurre al minimo le risorse utilizzate on-premise dal dispositivo di videosorveglianza. La bassa complessità computazionale che preme sul dispositivo di hosting della camera permette infatti di impiegare un qualunque tipo di hardware: a partire da un semplice Raspberry fino ad arrivare a dispositivi più complessi come un Jetson Nano.

------------

L'utente interagisce con WellcomeHome attraverso l'utilizzo di un bot presente sul canale di comunicazione Telegram (**@wellcomehome_bot**). 

Ad un primo accesso, il bot chiederà all'utente di accedere al proprio account di GitHub in modo da poter registrare la sua identità nel dominio dell'applicazione.
 
Ogni utente avrà il suo ambiente, da personalizzare tramite l'inserimento di profili da far riconoscere a WellcomeHome. Tramite questo bot, l'utente sarà in grado di:
- aggiungere nuove identità all'interno dell'applicazione;
- rimuovere identità già presenti all'interno dell'applicazione;
- aggiornare identità già presenti all'interno dell'applicazione;
- testare il funzionamento dell'applicazione dal bot stesso;
- controllare i volti identificati dal dispositivo di videosorveglianza;


## Servizi Azure Utilizzati
WellcomeHome sfrutta diversi servizi servizi offerti da Azure.
La tabella seguente riassume e motiva tutti i servizi in Cloud utilizzati da WellcomeHome.
| # | Servizio | Ruolo |
|-|-|-|
|1|**Functions**|Sfruttano la capacità di computazione serverless di Azure per poter identificare quando necessario i volti presenti all'interno di un frame catturato dal dispositivio di videosorveglianza.| 
|2|**Cognitive Services - Face Recognition**|Wellcome Home sfrutta la Face Recognition dei Cognitive Services per identificare i volti presenti in un immagine. La Face Recognition viene utilizzata all'interno delle Functions.|
|3|**App Service**|Questo servizio viene impiegato (insieme al Bot Channel Registration) per poter hostare il bot in Cloud.|
|4|**Blob Storage**|Lo storage viene sfruttato dal dispositivo di videosorveglianza per poter effettuare l'upload di immagini, in modo da invocare l'esecuzione di una Function.|
|5|**Cosmos DB**|Il Cosmos DB immagazzina informazioni circa gli utenti che si registrano all'applicazione WellcomeHome ed informazioni circa le varie identità inserite dai diversi utenti. |
|6|**Key Vault**|Viene sfruttato sia dal Bot che dalle Functions per poter accedere ad informazioni sensibili come password, chiavi, etc.|
|7|**Bot Channel Registration**|In sinergia con App Service, il servizio di Bot Channel Registration viene impiegato per effettuare il binding del bot al canale di comunicazione Telegram.|

## Architettura
Gli attori principali dell'applicazione sono l'utente e la IoT Camera. L'interfaccia utente è definita dal bot, hostato attraverso l'utilizzo di un App Service e di un Bot Channel Registration.

La comunicazione tra l'utente ed il bot avviene grazie al canale di comunicazione telegram. Per utilizzare l'applicazione, l'utente deve necessariamente effettuare l'accesso al suo account di GitHub in modo da essere riconosciuto nel dominio dell'applicazione. L'autenticazione avviene grazie al provider OAuth di GitHub. 

La IoT camera si occupa di effettuare l'upload di frame all'interno di un Blob Storage tramite una stringa di connessione dotata di firma di accesso condiviso (SAS).

Quando viene effettuato l'upload di un immagine all'interno del Blob Storage viene eseguita la funzione FaceDetection che si avvale della Face Recognition di Azure per identificare il volto presente nell'immagine.

L'Azure Cosmos DB contiene informazioni circa gli utenti registrati all'applicazione e le corrispettive identità dei volti inseriti.

La funzione ManagePeople effettua operazioni di inserimento o aggiornamento di identità all'interno del database.

Infine sono presenti altre due funzioni StorageCleaner e CognitiveServiceCleaner che vengono eseguite rispettivamente ogni 15 minuti ed una volta a settimana. La prima elimina dal Blob Storage tutte le immagini caricate dalla camera che non sono state utilizzate nei 15 minuti precedenti, la seconda funzione invece serve per mantenere consistenti le informazioni che persistono nei Cognitive Services con quelle presenti nel database.

![Architettura](/architettura.png)
*ps. Sia le Functions che il Bot comunicano con il servizio di Azure Key Vault per accedere alle informazioni sensibili.*

## Installazione e guida all'utilizzo

### Installazione in Cloud
In questa sezione verranno elencate tutte le procedure per poter hostare su Azure l'applicazione WellcomeHome.

#### Risorse
Le risorse in Cloud che utilizza WellcomeHome sono le seguenti:

 1. App Web
 2. Functions
 3. Storage Account
 4. Cosmos DB
 5. Bot Channel Registration
 6. Cognitive Services
 7. GitHub OAuth
 8. Key Vault

#### Storage Account
Lo storage account è necessario per poter mantenere le immagini caricate dalla IoT Camera e procedere con l'identificazione.
Creare quindi una risorsa Storage Account dal portale di Azure ed inserire un blob container chiamato "img".

Dalla risorsa creata, recarsi nel pannello *Firma di accesso condiviso*, nella sezione *Servizi consentiti* spuntare solamente *Blob*. Come *Tipi di risorse consentite* salvare selezionare *Servizio* e *Oggetto*. Infine come *Autorizzazioni consentite* selezionare solamente *Scrittura* o *Crea*.
Ora come protocollo consentito abilitare solamente *HTTPS* e cliccare su *Genera firma di accesso condiviso e stringa di connessione* utilizzando come chiave la *key2*.
È sufficiente ora memorizzare la *stringa di connessione*.

#### Cosmos DB
Il Cosmos DB viene impiegato da WellcomeHome per tenere traccia delle identità riconosciute dal bot e degli utenti registrati all'applicazione.
Creare una risorsa Cosmos DB dal portale di Azure e procedere con la creazione di un Database (SQL Based) chiamato "WellcomeHomeDB".
Aggiungere due container al database precedentemente creato:

 1. Creare il container "People" e selezionare come **partition-key** la stringa "person_group_id".
 2. Creare il container "Users" e selezionare come **partition-key** la stringa "pkey".

#### Cognitive Services
Il servizio fornito dai Cognitive Service di Azure serve a WellcomeHome per identificare uno o più volti all'interno di un immagine.
È sufficiente creare la risorsa dei Cognitive Services dal portale di Azure e memorizzare l'endpoint e la chiave primaria del servizio.

#### App Web
L'App Web è il servizio che ci permette di hostare il bot in Cloud.
Dal portale di Azure creare la risorsa App Web, selezionando nome "WellcomeHomeBotApp" e come stack di runtime Python 3.8.

A questo punto è necessario inserire variabili d'ambiente all'interno della risorsa:
Accedere alla risorsa appena creata e selezionare **Configurazione -> Nuova impostazione applicazione** ed inserire le seguenti variabili d'ambiente:

 1. AZURE_CLIENT_ID (contiene il client ID dell'applicazione)
 2. AZURE_CLIENT_SECRET (contiene il client secret dell'applicazione)
 3. AZURE_COSMOSDB_ENDPOINT (contiene l'endpoint di connessione alla risorsa CosmosDB)
 4. AZURE_FUNCTION_ENDPOINT (contiene l'endpoint di connessione alla funzione "ManagePeople")
 5. AZURE_STORAGE_CONNECTION (contiene la stringa connessione all'account di storage)
 6. AZURE_TENANT_ID (contiene il tenant id dell'applicazione)
 7. KEYVAULT_URI (contiene l'url della risorsa Key Vault)
 8. MicrosoftAppId (contiene il client ID dell'applicazione)
 9. MicrosoftAppPassword  (contiene il client secret dell'applicazione)

A questo punto è necessario aprire la cartella "Bot" presente all'interno del Repository con l'editor Visual Studio Code (assicurarsi di aver installato anche il plug-in per Azure e di aver eseguito l'accesso).
Da Visual Studio Code aprire la scheda relativa al plug-in per Azure e cliccare sulla freccia blu nella sezione "App Service". A questo punto è sufficiente cliccare su "WellcomeHomeBotApp" dal menù a tendina mostrato da Visual Studio Code.

#### Functions
Le Functions vengono impiegate da WellcomeHome per diversi scopi: Identificare una persona in un immagine, inserire o aggiornare nuove identità, pulire lo storage ed i Cognitive Services.

Dal portale di Azure creare la risorsa Azure Functions selezionando come nome "wellcomehome-functions" e come stack di runtime Python 3.8.

A questo punto è necessario inserire variabili d'ambiente all'interno della risorsa:
Accedere alla risorsa appena creata e selezionare **Configurazione -> Nuova impostazione applicazione** ed inserire le seguenti variabili d'ambiente:

1. AZURE_CLIENT_ID (contiene il client ID dell'applicazione)
2. AZURE_CLIENT_SECRET (contiene il client secret dell'applicazione)
3. AZURE_STORAGE_CONNECTION (contiene la stringa connessione all'account di storage)
4. AZURE_TENANT_ID (contiene il tenant id dell'applicazione)
5. BOT_NOTIFY_CHANNEL (contiene l'url del bot dedicato per la ricezione dei messaggi proattivi: [url risorsa WellcomeHomeBotApp]/api/notify").
6. KEYVAULT_URI (contiene l'url della risorsa Key Vault)
7. COSMOSDB_ENDPOINT (contiene l'endpoint di connessione alla risorsa CosmosDB)
8. COGNITIVE_SERVICES_ENDPOINT (contiene la chiave primaria della risorsa Cognitive Services)

Per effettuare il deploy è sufficiente aprire la cartella "Functions" presente nel repository attraverso Visual Studio Code (assicurarsi sempre di aver installato il plug-in di Azure e di aver effettuato l'accesso).
Da Visual Studio Code aprire la scheda relativa al plug-in per Azure e cliccare sulla freccia blu nella sezione "Functions". A questo punto è sufficiente cliccare su "wellcomehome-functions" dal menù a tendina mostrato da Visual Studio Code.

#### Key Vault
WellcomeHome utilizza Azure Key-Vault per accedere alle informazioni sensibili dell'applicazione.
Creare la risorsa Key Vault dal portale di Azure ed accedere alla sezione "Segreti".
A questo punto è necessario aggiungere i seguenti segreti cliccando su "Genera/Importa":

 1. *app-password*: la password dell'applicazione creata;
 2. *bot-password*: la password associata al bot;
 3. *insert-people-function-key*: la chiave della risorsa "wellcomehome-functions" associata alla funzione "ManagePeople";
 4. *Trust-Token-ProactiveMessages*: è un token che serve al bot per accettare messaggi proattivi solo dalla funzione "FaceDetection" (può essere generato in maniera casuale);
 5. *wellcomehome-cs-key*: la chiave primaria di connessione ai cognitive services;
 6. *wellcomehome-db-key*: la chiave di connessione all'Azure Cosmos DB.

ps. Evitare di inserire una data di scadenza per un segreto durante la sua creazione.

#### Bot Channel Registration
Questa risorsa è fondamentale per utilizzare Telegram come canale di comunicazione.
Accedere al portale di Azure e creare una risorsa "Bot Channel Registration".

Dopo aver creato la risorsa, nella sezione "Impostazioni" modificare il parametro *Endpoint di messaggistica*: qui è necessario inserire l'url della risorsa "WellcomeHomeBotApp" seguito da */api/messages*;

A questo punto è necessario abilitare l'applicazione all'utilizzo del protocollo OAuth. Per farlo bisogna accedere al proprio account di GitHub, recarsi nella sezione *Settings* di GitHub e cliccare su *Developer Settings*. Da qui aprire il pannello *OAuth Apps* e cliccare su *New OAuth App*. Nel campo *Application name* inserire il nome desiderato, nel campo *Homepage URL* inserire la stringa "https://dev.botframework.com" e nel campo *Authorization callback URL* inserire la stringa "https://token.botframework.com/.auth/web/redirect".
È necessario memorizzare l'id ed il secret dell'applicazione appena creata.

Ora dal portale di Azure, nella risorsa Bot Channel Registration creata, sempre dalla sezione *Impostazioni* è sufficiente cliccare sul pulsante *Aggiungi Impostazione* sotto la voce *Impostazione di connessione OAuth*. Inserire come nome "github-auth-conn" e come provider "GitHub". Nel campo *Client id* e nel campo *Client secret* inserire rispettivamente l'id e la password precedentemente memorizzati, e nel campo *Ambiti* inserire la stringa "read:user,user:email".

Ora non rimane altro che collegare il Bot a Telegram: recarsi nella scheda *Canali* della risorsa e nella voce *Altri canali* selezionare *Telegram*. A questo punto è sufficiente seguire le istruzioni di Azure per collegare WellcomeHome a Telegram.

#### Avviare l'applicazione
Per eseguire l'applicazione è sufficiente accedere alle risorse "WellcomeHomeBotApp" e "wellcomehome-functions" e cliccare il pulsante *Avvia* nella scheda *Panoramica* delle risorse. 

------------

### Installazione On-Premise della Videocamera
All'interno di questa repository è presente la cartella "WellcomeHome_Raspberry" con all'interno un file chiamato script.py che deve essere eseguito all'interno della macchina host della camera.
I test sono stati eseguiti con un Raspberry Pi 4, al quale è stata collegata una webcam ordinaria.

Di seguito verranno riportati i passi per eseguire l'applicazione su un Raspberry Pi 4.

#### 0. Effettuare il primo accesso al bot
Collegarsi al bot da Telegram (**@wellcomehome_bot**) ed effettuare l'accesso con il proprio account GitHub seguendo le istruzioni del bot.
Memorizzare il proprio **ID** inviando al bot un messaggio contenente il testo "id" o cliccando l'apposito pulsante consigliato dal bot.

#### 1. Aggiornare il raspberry
Accedere al Raspberry e digitare i seguenti comandi:

    $ sudo apt-get update
    $ sudo apt-get upgrade
   
#### 2. Installare Python
Se si dispone già di una versione di python 3.8 o superiore è possibile saltare questo passaggio, altrimenti digitare i seguenti comandi:

    $ sudo apt-get install python3
    $ sudo apt-get install pip3

#### 3. Inizializzare l'applicazione
Scaricare la cartella **WellcomeHome_Raspberry** presente all'interno del repository.

Dall'interno della cartella installare le dipendenze dell'applicazione eseguire il comando:

    $ pip3 install -r requirements.txt

A questo punto è necessario copiare il file **/data/haarcascade_frontalface_default.xml** all'interno del percorso di installazione del pacchetto di OpenCV **[percorso installazione python]/site-packages/cv2/data** installato precedentemente. Nel mio caso il pacchetto è stato installato al percorso */usr/local/lib/python3.8/site-packages/cv2* 

All'interno del file **key**, presente all'interno della stessa cartella, è necessario inserire la stringa di connessione **ad accesso condiviso** (sezione Installazione  in Cloud -> Storage Account) per poter effettuare l'upload delle immagini all'interno del Blob Storage. 

#### 4. Avviare l'applicazione
Collegare una webcam al raspberry ed eseguire il comando:

    $ python3 script.py <ID dello step 0> <percorso installazione python>/site-packages/cv2/data/haarcascade_frontalface_default.xml

Ora WellcomeHome è pronto!

------------

### Guida all'utilizzo

Ora che l'applicazione è in funzione è sufficiente comprendere quali sono le funzionalità principali offerte dal bot.

#### Rilevamento volti
Nel momento in cui la camera di sorveglianza rileva un volto, il bot ci invierà uno dei seguenti messaggi:

> [Nome] [Cognome] è tornato a casa.

nel caso in cui l'applicazione sia riuscita correttamente ad identificare il volto, oppure

> Qualcuno è tornato a casa ma non so chi sia.
> [immagine con volto evidenziato]

nel caso contrario.

#### Inserimento di una nuova identità
L'utente può insegnare nuove identità al bot con l'apposito comando "Inserisci Persona".
Il bot chiederà all'utente di inviargli un immagine (contenente solo il volto della persona che si vuole far riconoscere al bot).

A questo punto l'utente può decidere o di creare un'identità da zero digitando o cliccando su "Nuovo", oppure di aggiornare un profilo già presente nel database  cliccando su "Esistente".

Nel primo caso il bot chiederà di inserire il nome ed il cognome della persona da aggiungere al database.
Nel secondo caso invece il bot mostrerà l'elenco delle persone già presenti nel database, l'utente dovrà solo cliccare sul pulsante contenente il nome ed il cognome della persona di cui si vuole aggiornare l'identità. 

#### Eliminare un'identità
L'utente ha anche la possibilità di far dimenticare al bot un'identità già conosciuta cliccando sul pulsante "Cancella Persona". Il bot mostrerà l'elenco delle persone presenti nel database.

#### Testare il funzionamento dell'applicazione
Tramite il comando "Test" l'utente può testare il funzionamento dell'applicazione inviando al bot un immagine contenente uno o più volti da identificare, a prescindere dal funzionamento della camera di sorveglianza.

#### Comandi di utility
Con il comando "Logout" l'utente può scollegare il suo account GitHub dall'applicazione.
Tramite il comando "Cancel" l'utente può annullare qualunque operazione in corso.
Infine il comando "Aiuto" è possibile visualizzare un messaggio che aiuta l'utente con la sua esperienza con il bot.

## Crediti
WellcomeHome è stata realizzata da De Caro Antonio, studente magistrale con curriculum Cloud Computing dell'Università degli Studi di Salerno (UNISA).

Email: antonio.decaro99@outlook.it.
