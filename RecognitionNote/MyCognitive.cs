using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Android.App;
using Android.Content;
using Android.OS;
using Android.Runtime;
using Android.Views;
using Android.Widget;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using System.Net.Http.Headers;
using Microsoft.Azure.CognitiveServices.Vision.Face;
using Microsoft.Azure.CognitiveServices.Vision.Face.Models;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Net.Http;
using System.Net;
using Newtonsoft.Json;
using System.Text.RegularExpressions;

namespace FaceUnlockVocalNode.Resources
{
    class MyCognitive
    {
        //chiave per servizio cognitivo per riconoscimento facciale
        static string key = "<chiave-servizio-Viso>";
        //chiave per servizio cognitivo OCR di riconoscimento testo nelle immagini
        static string keyOCR = "<chiave-servizio-VisioneArtificiale>";
        static string keySentimentAnalsys = "<chiave-servizio-TextAnalytics>";
        //chiave per servizio cognitivo per sentiment analisys del testo

        //metodo che fa una richiesta API per utilizzare la funzionalità Detect del riconoscimento facciale: dato in in input un path di una immagine, ne crea un faceId
        //inoltre identifica anche l'emozione percepita dalla foto, la variabile numFrase è un intero che ci identifica l'emozione, emozioneMassima e numFrase sono array di grandezza 1
        //in modo da essere modificati per riferimento 
        public static string Detect(string imageFilePath, string[] emozioneMassima, int[] numFrase)
        {
            //request della richiesta
            var request = (HttpWebRequest)WebRequest.Create("https://<nome-risorsa-Viso>.cognitiveservices.azure.com/face/v1.0/detect?returnFaceId=true&returnFaceAttributes=emotion&returnFaceLandmarks=false&recognitionModel=recognition_03&returnRecognitionModel=false&detectionModel=detection_01");
            //conversione della foto in un array di byte 
            byte[] byteData = GetImageAsByteArray(imageFilePath);

            //settaggio dei parametri dalla request
            request.Method = "POST";
            request.ContentType = "application/octet-stream";
            request.ContentLength = byteData.Length;
            request.Headers.Add("Ocp-Apim-Subscription-Key", key);
            request.Host = "<host-visio>";

            using (var stream = request.GetRequestStream())
            {
                stream.Write(byteData, 0, byteData.Length);
            }
            //prendiamo la response e la convertiamo in un oggetto json
            var response = (HttpWebResponse)request.GetResponse();
            var responseString = new StreamReader(response.GetResponseStream()).ReadToEnd();
           
            dynamic json = JsonConvert.DeserializeObject(responseString);
            //array con le percentuali di ogni emozione percepita nella foto analizzata
            double[] valoreEmozioni = { (double)json[0].faceAttributes.emotion.anger, (double)json[0].faceAttributes.emotion.contempt, (double)json[0].faceAttributes.emotion.disgust, (double)json[0].faceAttributes.emotion.fear, (double)json[0].faceAttributes.emotion.happiness, (double)json[0].faceAttributes.emotion.neutral, (double)json[0].faceAttributes.emotion.sadness, (double)json[0].faceAttributes.emotion.surprise };
            //array delle emozioni
            string[] emotion = { "anger", "contempt", "disgust", "fear", "happines", "neutral", "sadness", "surprise" };
            emozioneMassima[0] = emotion[0];
            double max = valoreEmozioni[0];
            numFrase[0] = 0;
            //si cerca l'emozione che ha avuto la percentuale maggiore nella foto e la si setta nella variabile passata come argomento
            for (int i = 1; i < 8; i++)
            {
                if (valoreEmozioni[i] > max)
                {
                    max = valoreEmozioni[i];
                    emozioneMassima[0] = emotion[i];
                    numFrase[0] = i;
                }
            }
            //restituisce il faceId generato
            var id = json[0].faceId;
            return id;
        }


        // Returns the contents of the specified file as a byte array.
        static byte[] GetImageAsByteArray(string imageFilePath)
        {
            using (FileStream fileStream = new FileStream(imageFilePath, FileMode.Open, FileAccess.Read))
            {
                BinaryReader binaryReader = new BinaryReader(fileStream);
                return binaryReader.ReadBytes((int)fileStream.Length);
            }

        }

        //metodo che fa una richiesta API per utilizzare la funzionalità identify del riconoscimento facciale: dato in in input il faceId generato dalla detect, 
        //controlla se quella faccia è di una persona memorizzata nel GroupPerson del servizio cognitivo 
        public static string identify(String img)
        {
            //request della richiesta
            var request = (HttpWebRequest)WebRequest.Create("https://<nome-risorsa-Viso>.cognitiveservices.azure.com/face/v1.0/identify?recognitionModel=recognition_03");
            //settaggio dei parametri dalla request
            var postData = "{\"PersonGroupId\": \"<Nome_personGroup>\",\"faceIds\":[\"" + img + "\"], \"maxNumOfCandidatesReturned\": 1, \"confidenceThreshold\": 0.5}";
            var data = Encoding.UTF8.GetBytes(postData);
            request.Method = "POST";
            request.ContentType = "application/json";
            request.ContentLength = data.Length;
            request.Headers.Add("Ocp-Apim-Subscription-Key", key);
            request.Host = "<host-visio>";

            using (var stream = request.GetRequestStream())
            {
                stream.Write(data, 0, data.Length);
            }
            //prendiamo la response e la convertiamo in un oggetto json
            var response = (HttpWebResponse)request.GetResponse();
            var responseString = new StreamReader(response.GetResponseStream()).ReadToEnd();
            dynamic json = JsonConvert.DeserializeObject(responseString);
            string b = String.Join(" ", json[0].candidates);

            if (b != "") //se trova effettivamente una persona o candidato nel servizio cognitivo a cui può appattenere la faccia in analisi
            {

                int c = (int)json[0].candidates[0].confidence;
                if (c > 0.65)// controlliamo il grado di confidence, se è maggiore dello 0.65 è affidabile, e può accedere
                {
                    return json[0].candidates[0].personId; //restituisce il personId del Person GroupPerson memorizzato nel servizio cognitivo, cioè del candidato trovato
                }
                else
                {
                    return "";
                }
            }
            else
            {
                return "";
            }
        }

        //metodo che fa una richiesta API per utilizzare la funzionalità addPerson del riconoscimento facciale: crea un nuovo Person nel GroupPerson, 
        //gli si passa l'username dell'utente aggiunto e si può passare una descrizione (entrambi parametri opzionali) 
        public static string addPerson(string nome, string userData)
        {
            //request della richiesta
            var request = (HttpWebRequest)WebRequest.Create("https://<nome-risorsa-Viso>.cognitiveservices.azure.com/face/v1.0/persongroups/<nome_personGroup>/persons?recognitionModel=recognition_03");
            //settaggio dei parametri dalla request
            var postData = "{\"name\": \"" + nome + "\",\"userData\":\"" + userData + "\"}";
            var data = Encoding.UTF8.GetBytes(postData);
            request.Method = "POST";
            request.ContentType = "application/json";
            request.ContentLength = data.Length;
            request.Headers.Add("Ocp-Apim-Subscription-Key", key);
            request.Host = "<host-visio>";

            using (var stream = request.GetRequestStream())
            {
                stream.Write(data, 0, data.Length);
            }
            //prendiamo la response e la convertiamo in un oggetto json
            var response = (HttpWebResponse)request.GetResponse();
            var responseString = new StreamReader(response.GetResponseStream()).ReadToEnd();
           
            dynamic json = JsonConvert.DeserializeObject(responseString);
            
            return json.personId;

        }

        //metodo che fa una richiesta API per utilizzare la funzionalità addFace del riconoscimento facciale: aggiunge una nuova faccia a un Person nel GroupPerson, 
        //gli si passa il personId di cui si vuole aggiungere la faccia e il path dell'immagine 
        public static void addFace(string personId, string pathImage)
        {
            //request della richiesta
            var request = (HttpWebRequest)WebRequest.Create("https://<nome-risorsa-Viso>.cognitiveservices.azure.com/face/v1.0/persongroups/<nome_personGroup>/persons/" + personId + "/persistedFaces?detectionModel=detection_01&recognitionModel=recognition_03");
            // l'immagine viene converita in un array di byte per essere passata comestream di dati
            byte[] byteData = GetImageAsByteArray(pathImage);
            //settaggio dei parametri della request
            request.Method = "POST";
            request.ContentType = "application/octet-stream";
            request.ContentLength = byteData.Length;
            request.Headers.Add("Ocp-Apim-Subscription-Key", key);
            request.Host = "<host-visio>";

            using (var stream = request.GetRequestStream())
            {
                stream.Write(byteData, 0, byteData.Length);
            }
            //prendiamo la response e la convertiamo in un oggetto json
            var response = (HttpWebResponse)request.GetResponse();
            var responseString = new StreamReader(response.GetResponseStream()).ReadToEnd();
            


        }

        ////metodo che fa una richiesta API per utilizzare la funzionalità create del PersonGroup del riconoscimento facciale: crea un nuovo PersonGroup
        //prende in input il nome del personGroup da creare
        public static void createPersonGroup(string personGroup)
        {
            var request = (HttpWebRequest)WebRequest.Create("https://<nome-risorsa-Viso>.cognitiveservices.azure.com/face/v1.0/persongroups/" + personGroup + "?recognitionModel=recognition_03");

            var postData = "{\"name\": \"nome\",\"userData\":\"gruppo\",\"recognitionModel\":\"recognition_03\"}";
            var data = Encoding.UTF8.GetBytes(postData);


            request.Method = "PUT";
            request.ContentType = "application/json";
            request.ContentLength = data.Length;
            request.Headers.Add("Ocp-Apim-Subscription-Key", key);
            request.Host = "<host-visio>";

            using (var stream = request.GetRequestStream())
            {
                stream.Write(data, 0, data.Length);
            }

            var response = (HttpWebResponse)request.GetResponse();
            var responseString = new StreamReader(response.GetResponseStream()).ReadToEnd();
            dynamic json = JsonConvert.DeserializeObject(responseString);
        }
        //metodo che fa una richiesta API per utilizzare la funzionalità Train del PersonGroup del riconoscimento facciale: 
        //fa il train del personGroup ogni volta si aggiunge una nuova Person al GroupPerson 

        public static void trainPersonGroup(string personGroupId)
        {

            var request = (HttpWebRequest)WebRequest.Create("https://<nome-risorsa-Viso>.cognitiveservices.azure.com/face/v1.0/persongroups/" + personGroupId + "/train?recognitionModel=recognition_03");

            var postData = "";
            var data = Encoding.UTF8.GetBytes(postData);

            request.Method = "POST";
            request.ContentType = "application/json";
            request.ContentLength = data.Length;
            request.Headers.Add("Ocp-Apim-Subscription-Key", key);
            request.Host = "<host-visio>";

            using (var stream = request.GetRequestStream())
            {
                stream.Write(data, 0, data.Length);
            }

            var response = (HttpWebResponse)request.GetResponse();

        }

        //metodo che fa una richiesta API per utilizzare la funzionalità OCR del servizio cognitivo di ricnoscimento del testo nelle immagini:
        //prende in input il path dell'immagine da analizzare
        public static string getText(string imageFilePath)
        {

            var request = (HttpWebRequest)WebRequest.Create("https://<nome-risorsa-VisioneArtificiale>.cognitiveservices.azure.com/vision/v3.1/ocr?language=it&detectOrientation=true");
            byte[] byteData = GetImageAsByteArray(imageFilePath);

            request.Method = "POST";
            request.ContentType = "application/octet-stream";
            request.ContentLength = byteData.Length;
            request.Headers.Add("Ocp-Apim-Subscription-Key", keyOCR);
            request.Host = "<host-visioneArtificiale>";

            using (var stream = request.GetRequestStream())
            {
                stream.Write(byteData, 0, byteData.Length);
            }

            var response = (HttpWebResponse)request.GetResponse();
            var responseString = new StreamReader(response.GetResponseStream()).ReadToEnd();
           
            dynamic json = JsonConvert.DeserializeObject(responseString);
            string testo = "";
            //scorre l'oggetto json per salvare il testo trovato in una stringa da restituire in input
            for (int i = 0; i < json.regions[0].lines.Count; i++)
            {
                for (int j = 0; j < json.regions[0].lines[i].words.Count; j++)
                {
                    testo += json.regions[0].lines[i].words[j].text + " ";

                }
            }
           
            return testo;
        }

        public static double getSentimentText(string frase)
        {
            var client = new WebClient();
            client.Headers.Add("Ocp-Apim-Subscription-Key", keySentimentAnalsys);
            client.Headers.Add("Content-type", "application/json");
            client.Headers.Add("Accept", "application/json");
            // Determine sentiment
            var postData2 = @"{""documents"":[{""id"":""1"", ""language"":""@language"", ""text"":""@sampleText""}]}".Replace(
                                 "@sampleText", frase).Replace("@language", "it");
            var response2 = client.UploadString("https://<nome-risorsa-textAnalytics>.cognitiveservices.azure.com/text/analytics/v2.1/sentiment", postData2);
            var sentimentStr = new Regex(@"""score"":([\d.]+)").Match(response2).Groups[1].Value;
            var sentiment = Convert.ToDouble(sentimentStr, System.Globalization.CultureInfo.InvariantCulture);

 
            //restituiamo lo score 
            return  sentiment;
        }
    }
}
