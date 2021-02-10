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
using Plugin.Media;
using Android.Graphics;
using Android;
using Android.Support.V4.Content;
using System.IO;

namespace FaceUnlockVocalNode
{
    [Activity(Label = "NuovaNota")]
    public class NuovaNota : Activity
    {
        LinearLayout l;
        Button Salva, foto;
        Button img;
        String emozione;
        int start;
        //richiede permessi
        readonly string[] permissionGroup =
        {
            Manifest.Permission.ReadExternalStorage,
            Manifest.Permission.WriteExternalStorage,
            Manifest.Permission.Camera
        };
        protected override void OnCreate(Bundle savedInstanceState)
        {
            base.OnCreate(savedInstanceState);
            SetContentView(Resource.Layout.nuovaNotaLayout);

            Button b = (Button)FindViewById(Resource.Id.Salva);
            b.Click += NuovaNotaOnClick;

            img = (Button)FindViewById(Resource.Id.foto);
            img.Click += CamptureButton_Click;
            EditText cont = (EditText)FindViewById(Resource.Id.contenuto);
              start = 0;
              //listner sulla EditText che controlla ogni volta che c'è un cambiamento di testo
            cont.TextChanged += (object sender, Android.Text.TextChangedEventArgs e) =>
            {
            
            //prendiamo il testo inserito lo convertiamo in stringa e ne controlliamo l'ultimo carattere inserito, se questo è un "." allora indica che
            //la frase/periodo è finita è deve fare il sentiment analysis
                string s = cont.Text.ToString();
      
                int finish = 0;
                int i = s.Length;

                if (i <= 1)
                {

                    if (s.Equals("."))
                    {
                         
                    }
                }
 
                else
                {
                    string a = s.Substring(i - 1);
                  


                    if (a.Equals("."))
                    {
                        finish = i - 1;
                        String pezzoText = s.Substring(start, finish-start);
                        
                        double score = FaceUnlockVocalNode.Resources.MyCognitive.getSentimentText(pezzoText);
                        String emoji = "";
                        if (score >= 0.60)
                        {

                            emoji = Emoji(0x1f600);
                        }
                        else if (score <= 40)
                        {

                            emoji = Emoji(0x1F608);
                        }
                        else
                        {

                            emoji = Emoji(0x1F610);

                        }
                        cont.Text += emoji;
                        cont.SetSelection(finish+3);
                        start = finish;
                    }
 
                }

            };
            l = FindViewById<LinearLayout>(Resource.Id.n);
            foto = FindViewById<Button>(Resource.Id.foto);
            Salva = FindViewById<Button>(Resource.Id.Salva);
             emozione = Intent.GetStringExtra("emozione");
            switch (emozione)
            {

                case "happines":

                    l.SetBackgroundResource(Resource.Color.colorBackgroudnHappiness);
                    foto.SetBackgroundResource(Resource.Color.colorPrimaryHappiness);
                    Salva.SetBackgroundResource(Resource.Color.colorPrimaryHappiness);

                    Window.SetStatusBarColor(new Android.Graphics.Color(ContextCompat.GetColor(this, Resource.Color.colorPrimaryDarkHappiness)));
                    Window.DecorView.SystemUiVisibility = (StatusBarVisibility)SystemUiFlags.LightStatusBar;
                    break;
                    ;

                case "sadness":
                    l.SetBackgroundResource(Resource.Color.colorBackgroudnSadness);
                    foto.SetBackgroundResource(Resource.Color.colorPrimarySadness);
                    Salva.SetBackgroundResource(Resource.Color.colorPrimarySadness);

                    Window.SetStatusBarColor(new Android.Graphics.Color(ContextCompat.GetColor(this, Resource.Color.colorPrimaryDarkSadness)));
                    Window.DecorView.SystemUiVisibility = (StatusBarVisibility)SystemUiFlags.LightStatusBar;
                    break;
                    ;

                case "fear":
                    l.SetBackgroundResource(Resource.Color.colorBackgroudnFear);
                    foto.SetBackgroundResource(Resource.Color.colorPrimaryFear);
                    Salva.SetBackgroundResource(Resource.Color.colorPrimaryFear);

                    Window.SetStatusBarColor(new Android.Graphics.Color(ContextCompat.GetColor(this, Resource.Color.colorPrimaryDarkFear)));
                    Window.DecorView.SystemUiVisibility = (StatusBarVisibility)SystemUiFlags.LightStatusBar;
                    break;
                    ;

                case "anger":
                    l.SetBackgroundResource(Resource.Color.colorBackgroudnAngry);
                    foto.SetBackgroundResource(Resource.Color.colorPrimaryAngry);
                    Salva.SetBackgroundResource(Resource.Color.colorPrimaryAngry);

                    Window.SetStatusBarColor(new Android.Graphics.Color(ContextCompat.GetColor(this, Resource.Color.colorPrimaryDarkAngry)));

                    break;
                    ;

                case "contempt":

                    l.SetBackgroundResource(Resource.Color.colorBackgroudnContempt);
                    foto.SetBackgroundResource(Resource.Color.colorPrimaryContempt);
                    Salva.SetBackgroundResource(Resource.Color.colorPrimaryContempt);
                    Window.SetStatusBarColor(new Android.Graphics.Color(ContextCompat.GetColor(this, Resource.Color.colorPrimaryDarkContempt)));



                    break;
                    ;

                case "surprise":

                    l.SetBackgroundResource(Resource.Color.colorBackgroudnSurprise);
                    foto.SetBackgroundResource(Resource.Color.colorPrimarySurprise);
                    Salva.SetBackgroundResource(Resource.Color.colorPrimarySurprise);
                    Window.SetStatusBarColor(new Android.Graphics.Color(ContextCompat.GetColor(this, Resource.Color.colorPrimaryDarkSurprise)));
                    Window.DecorView.SystemUiVisibility = (StatusBarVisibility)SystemUiFlags.LightStatusBar;


                    break;
                    ;

                case "disgust":

                    l.SetBackgroundResource(Resource.Color.colorBackgroudnDisgust);
                    foto.SetBackgroundResource(Resource.Color.colorPrimaryDisgust);
                    Salva.SetBackgroundResource(Resource.Color.colorPrimaryDisgust);
                    Window.SetStatusBarColor(new Android.Graphics.Color(ContextCompat.GetColor(this, Resource.Color.colorPrimaryDarkDisgust)));


                    break;
                    ;

                case "neutral":

                    l.SetBackgroundResource(Resource.Color.colorBackgroudnNeutral);
                    foto.SetBackgroundResource(Resource.Color.colorPrimaryNeutral);
                    Salva.SetBackgroundResource(Resource.Color.colorPrimaryNeutral);
                    Window.SetStatusBarColor(new Android.Graphics.Color(ContextCompat.GetColor(this, Resource.Color.colorPrimaryDarkNeutral)));
                    Window.DecorView.SystemUiVisibility = (StatusBarVisibility)SystemUiFlags.LightStatusBar;

                    break;
                    ;

                default:
                   
                    break;
                    ;

            }
        }

        


        private void NuovaNotaOnClick(object sender, EventArgs eventArgs)
        {
            //Inizializzo l'oggetto nota
            Note n = new Note();
            //prendo il titolo e lo setto nell'oggetto
            EditText tit = (EditText)FindViewById(Resource.Id.titolo);
            String titolo = tit.Text.ToString();
            n.setTitolo(titolo);
            //prendo il contenuto della nota e lo setto nell'oggetto
            EditText cont = (EditText)FindViewById(Resource.Id.contenuto);
             String contenuto = cont.Text.ToString();
            
            //prendo la data corrente e lo setto nell'oggetto
            DateTime d = DateTime.Now;
            
            n.setData(d.ToString());
            //recupero dall'intent l'username utente
            String username = Intent.GetStringExtra("username");

            MySQL m = new MySQL();
            //inserimento nota
     

            //settiamo il testo ottenuto nell'EditText contenuto
                       
            n.setContenuto(contenuto);
            m.inserimentoNota(username, n);

            //torna alla home passando sempre l'username nell'intent
            Intent openPage1 = new Intent(this, typeof(Home));
              openPage1.PutExtra("username", username);
              openPage1.PutExtra("emozione", emozione);
              StartActivity(openPage1);
            

        }

        private String Emoji(int co)
        {
            int[] codes = new int[] { co };
            var sb = new StringBuilder(codes.Length);
            var s = "";
            foreach (var code in codes)
                s += Char.ConvertFromUtf32(code);
            return s;
        }

        //evento che cattura il bottone per fare la foto
        public void CamptureButton_Click(object sender, System.EventArgs eventArgs)
        {
            TakePhoto();
            
        }

        //funzione che identifica cosa fare dopo aver fatto la foto
        async void TakePhoto()
        {
            await CrossMedia.Current.Initialize();
            //definiamo dove  e come salvare la fot nel telefono
            var file = await CrossMedia.Current.TakePhotoAsync(new Plugin.Media.Abstractions.StoreCameraMediaOptions
            {
                PhotoSize = Plugin.Media.Abstractions.PhotoSize.Medium,
                CompressionQuality = 40,
                Name = "img.jpg",
                Directory = "sample"
            });

            if (file == null) { return; }
            //convertiamo l'immagine in array di byte
            byte[] imageArray = System.IO.File.ReadAllBytes(file.Path);
            Bitmap b = BitmapFactory.DecodeByteArray(imageArray, 0, imageArray.Length);
            String path = file.Path.ToString();
            //recuperiamo il testo dalla foto
            String testo = FaceUnlockVocalNode.Resources.MyCognitive.getText(path);

            //settiamo il testo ottenuto nell'EditText contenuto
            EditText contenuto = (EditText)FindViewById(Resource.Id.contenuto);
            double score = FaceUnlockVocalNode.Resources.MyCognitive.getSentimentText(testo);
            contenuto.Text += testo;
            if (score >= 0.60)
            {
                contenuto.Text += Emoji(0x1f600);
            }
            else if (score <= 40)
            {
                contenuto.Text += Emoji(0x1F608);
            }
            else {
                contenuto.Text += Emoji(0x1F610);

            }
       
            

           
        }
    }
}
