# RecognitionNote

<img align="center" height="204" src="https://github.com/mario-santoro/FaceUnlockVocalNote/blob/master/documentazione/immagini/icona cloud.png" >

Questa è un app Android sviluppata per l'esame di laurea magistrale informatica curriculum Cloud Computing dell'Università degli Studi di Salerno.
Ha come scopo quello di utilizzare i servizi offerti da Microsoft Azure. 

## Indice
<ul>
	<li> <a href="https://github.com/mario-santoro/RecognitionNote#contesto">Contesto</a></li>
	<li> <a href="https://github.com/mario-santoro/RecognitionNote#descrizione">Descrizione</a></li>
	<li> <a href="https://github.com/mario-santoro/RecognitionNote#architettura">Architettura</a></li>
	<li> <a href="https://github.com/mario-santoro/RecognitionNote#risorse">Risorse</a></li>
	<li> <a href="https://github.com/mario-santoro/RecognitionNote#usage">Usage</a></li>
	<li> <a href="https://github.com/mario-santoro/RecognitionNote#installazione-di-pacchetti-nuget">Installazione di pacchetti NuGet</a></li>
	<li> <a href="https://github.com/mario-santoro/RecognitionNote#about-us">About us</a></li>
</ul>

## Contesto
Lo scopo di quest’applicazione è fornire un servizio di note testuali che ha come obiettivo quello di percepire lo stato emotivo dell’utente scattando una foto in tempo reale effettuando l'accesso all'applicativo, e attraverso uno studio dei colori cerca di migliorare il suo umore o mantenerlo positivo cambiando user interface nel modo appropriato e cambiando frase di benvenuto a seconda dell'emozione percepita.<br>
Poi attraverso sentiment analysis del testo, quando l'utente scrive una nota o cattura il testo da un immagine, capisce se l’umore è migliorato o meno assegnando all'intero periodo un emoji posizionata alla fine della frase.

## Descrizione
L’utente si ritrova inizialmente in una pagina dove deve decidere tra registrazione e login. Essendo il primo accesso decide di registrarsi, inserendo un username (univoco) una password e una foto istantanea che servirà per il suo riconoscimento facciale per i prossimi accessi. Completata la procedura si ritroverà nella HomePage dell’app.
Effettuando successivamente il login può scegliere se effettuare l’accesso in modo classico (username e password) oppure con username e <b>riconoscimento facciale</b>. Utilizzando quest’ultimo all’accesso verrà fatto <b>l'emotion recognition</b> della foto (8 tipi diversi di emozioni percepite), in base a quest'ultima verrà visualizzato un tema differente dell'app (ogni colore messo ad hoc per mantenere o cambiare l'umore dell'utente in maniera positiva) e un messaggio di benvenuto. 
Il servizio in sé permette all’utente di tener traccia di note testuali (inserimento, cancellazione e modifica) con la possibilità di scattare una foto a del testo o un immagine contenente testo e poi il servizio cognitivo <b>riconosce il testo</b> in essa contenuta e in maniera automatica inserisce il testo riconosciuto nel contenuto della nota, pronta per essere salvata o modificata. Infine con il <b>Sentiment Analysis</b> del testo viene inserita un emoji a seconda del sentimento riscontrato nel testo.

## Architettura
<img align="center" height="250" src="https://github.com/mario-santoro/RecognitionNote/blob/master/documentazione/immagini/architettura.jpg?raw=true" >

## Prerequisiti
<ul>
	<li>Sottoscrizione Azure</li>
	<li>Visual Studio</li>
</ul>


## Risorse
 <ul>
	<li>Database SQL: per memorizzare in maniera persistente i dati anagrafici e di accesso dell’utente e le note testuali.</li>
	<li>l'API Visione artificiale in Servizi cognitivi di Azure: 
	<ul>
		<li>Face - Analizza i visi umani in un'immagine riconoscimento facciale e emotion recognition.</li>
		<li>Vision: OCR e Lettura - estrazione di testo (riconoscimento ottico dei caratteri) stampato o scritto a mano da immagini e creare le note testuali.</li> 
		<li>Text Analytics: Sentiment Analysis – un’analisi dei sentimenti e delle opinioni espresse nei testi.</li>
	</ul>
</ul>

## Usage
<ul>
	<li><a href="https://docs.microsoft.com/it-it/azure/azure-sql/database/single-database-create-quickstart?tabs=azure-portal">Database SQL</a>:  Una volta recatosi sul portale Azure di Microsoft l'utente dovrà creare la risorsa SQL, accedendo prima al pannello di creazione di un Database SQL presente nella pagina "Risorse" di Azure, successivamente creare la risorsa cliccando sul bottone "crea risorsa" e andare a settare i seguenti parametri: </li>
	<ul>
		<li>In Gruppo di risorse selezionare Crea nuovo, immettere myResourceGroup e quindi fare clic su OK</li>
		<li>In Nome database immettere il nome del database</li>
		<li>In server selezionare Crea nuovo e compilare il modulo Nuovo server con i valori seguenti:</li>
		<ul>
			<li>Nome server: immettere mysqlserver e aggiungere alcuni caratteri per l'univocità. Non è possibile specificare un nome di server esatto da usare perché i nomi di tutti i server di Azure devono essere univoci a livello globale, non solo univoci all'interno di una sottoscrizione. Immettere quindi un valore come mysqlserver12345 e il portale segnala se è disponibile o meno.</li>
			<li>Account di accesso amministratore server: digitare azureuser.</li>
			<li>Password: immettere una password che soddisfi i requisiti e immetterla di nuovo nel campo Conferma password.</li>
			<li>Località: selezionare una località dall'elenco a discesa.</li>
		</ul>
		<li>Lasciare l'opzione Usare il pool elastico SQL? impostata su No</li>
		<li>In Calcolo e archiviazione selezionare Configura database</li>
		<li>Questo argomento di avvio rapido usa un database serverless, quindi selezionare Basic e quindi Applica</li>
		<li>Selezionare Avanti: Rete nella parte inferiore della pagina.</li>
		<li>In Regole del firewall impostare Aggiungi indirizzo IP client corrente su Sì. Lasciare l'opzione Consenti alle risorse e ai servizi di Azure di accedere a questo server impostata su No.
</li>
		<li>Selezionare Avanti: Impostazioni aggiuntive nella parte inferiore della pagina.</li>
		<li>Selezionare Rivedi e crea nella parte inferiore della pagina</li>		
	</ul>
	<li><a href="https://docs.microsoft.com/it-it/azure/cognitive-services/cognitive-services-apis-create-account?tabs=multiservice%2Cwindows">Servizi cognitivi</a>: L'utente si trova sul portale Azure cliccando su Servizi cognitivi si troverà nel marketplace dei servizi cognitivi, e tramite la barra di ricerca potrò cercare i seguenti servizi:
	<ul>
		<li>Viso: Una volta recatosi sul portale Azure di Microsoft l'utente dovrà creare la risorsa Face, accedendo prima al pannello di creazione di servizi cognitivi presente nella pagina "Risorse" di Azure, successivamente creare la risorsa cliccando sul bottone "crea risorsa" e andare a settare i seguenti parametri: </li>
		<ul>
			<li>Gruppo di risorse (Cerarne uno nuovo nel caso non vi è presente già uno precedentemente creato)</li>
			<li>Settare la regione del server a quale fare riferimento</li>
			<li>Settare il nome della risorsa che si sta creando</li>
			<li>Andare a selezionare la fatturazione del servizio, F0 darà risorse gratis fino a 20 chiamate al minuto e 30k chiamate al mese</li>
		</ul>
		<li>Visione artificiale, per OCR e lettura: l'utente cliccherà sul bottone crea e avrà avanti a se la schermata con le varie impostazioni da settare:</li> 
		<ul>
			<li>Gruppo di risorse (Cerarne uno nuovo nel caso non vi è presente già uno precedentemente creato)</li>
			<li>Nome del servizio</li>
			<li>Piano tariffario, F0 che darà gratis 20 chiamate al minuto e 5k chiamate al mese</li>
		</ul>
		<li>Text Analytics: Sentiment Analysis: </li>
		<ul>
			<li>Gruppo di risorse (Cerarne uno nuovo nel caso non vi è presente già uno precedentemente creato)</li>
			<li>Nome del servizio</li>
			<li>Piano tariffario, F0 che darà gratis 5k transizioni per i primi 30 giorni</li>
		</ul>
	</ul>
	<li>Creazione PersonGroup, recarsi alla pagina relativa delle <a href="https://westeurope.dev.cognitive.microsoft.com/docs/services/563879b61984550e40cbbe8d/operations/563879b61984550f30395244">API</a> selezionare la regione del server sul quale la risorsa viene utilizzata, e nella seguente pagina andare a cambiare il Name con la seconda opzione disponibile, per poter inserire il Resource Name, inserire un personGroup ID a propria scelta, inserire la propria OCP key, precedentemente presa dal servizio sul portale Azure, e scendere a fondo pagina per poter cliccare su Send, aspettare il responso positivo dell'operazione (200 OK) e andare a sostituire l'id del personGroup appena scelto all'interno del file "MyCognitive.cs"</li>
<li>Per importare il DataBase, con un qualsiasi programma di gestione Database (ad esempio Navicat) collegarsi all’istanza del DB con le credenziali scritte precedentemente importare il file sql in documentazione "recognitionNote.sql" presente nella repository
</li>
	<li>Per poter utilizzare i servizi cognitivi, recarsi in ognuna delle risorse create e prendere le rispettive chiavi (Key) ed endpoint, e andarli a sostituire nel file MyCognitive.cs</li>
	
</ul>



## Installazione di pacchetti NuGet
Per poter andare a utilizzare librerie che si interfacciano con gli strumenti messi a disposizione da Azure, da Visual Studio bisogna, dopo aver creato un progetto App Android (Xamarin), bisogna cliccare con il tasto destro sul nome del progetto, presente nel pannello esplora risorse sulla destra dell'interfaccia, e selezionare l'opzione pacchetti NuGet, da qui ci si aprirà una schermata dalla quale potremmo vedere i pacchetti già installati, quelli da aggiornare e installarne di nuovi. Cliccando sul tab "installa" avremo avanti una schermata che ci proporrà tutti i pacchetti messi a disposizione, e tramite una ricerca possiamo andare a filtrare i pacchetti proposti. Quelli da ricercare e installare sono i seguenti: 
<ul>
	<li>System.Data.SqlClient</li>
	<li>Cognitive services</li>
</ul>
Per il pacchetti "Cognitive services" bisogna prima andare sulla console di gestione di pacchetti NuGet di progetto, dalla quale possiamo accedere tramite il menù a tendina su Visual studio nominato "Strumenti" -> "Gestione pacchetti NuGet" -> "Console", e inserire il seguente codice 

```console
Install-Package Microsoft.Azure.CognitiveServices.Vision.Face -Version 2.6.0-preview.1
```

## About Us
<b>Autori</b>:
<ul> 
	<li>Mario Santoro</li>
	<li>Raffaele Marino</li>
</ul>
<img align="center" height="300" src="https://github.com/mario-santoro/FaceUnlockVocalNote/blob/master/documentazione/immagini/aboutUs.png" >
