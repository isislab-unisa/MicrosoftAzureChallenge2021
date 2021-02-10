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
using Newtonsoft.Json;
using Plugin.Media;
using Android.Graphics;
using Android;
using Android.Support.V4.Content;

namespace FaceUnlockVocalNode
{
    [Activity(Label = "ModificaNota")]
    public class ModificaNota : Activity
    {
         
        Button img;
        String emozione;
        LinearLayout l;
        Note n= new Note();
        int start;
        Button Salva, foto;
        readonly string[] permissionGroup =
        {
            Manifest.Permission.ReadExternalStorage,
            Manifest.Permission.WriteExternalStorage,
            Manifest.Permission.Camera
        };
        protected override void OnCreate(Bundle savedInstanceState)
        {
            base.OnCreate(savedInstanceState);
            SetContentView(Resource.Layout.modificaNotaLayout);
            //prendiamo il titolo dall'intent e lo settiamo nell'EditText
            String t = Intent.GetStringExtra("titolo");
            EditText titolo = (EditText)FindViewById(Resource.Id.titoloMod);
            titolo.Text += t;
            //prendiamo il contenuto dall'intent e lo settiamo nell'EditText
            String c = Intent.GetStringExtra("contenuto");
            EditText contenuto = (EditText)FindViewById(Resource.Id.contenutoMod);
            contenuto.Text += c;
            start = 0;
            //listener sulla edit text che controlla ogni volta che c'è un cambiamento di testo
            contenuto.TextChanged += (object sender, Android.Text.TextChangedEventArgs e) =>
            {
                //prendiamo il testo inserito, lo convertiamo in stringa e ne controlliamo l'ultimo carattere inserito.
                //Se questo è un "." allora indica che la frase/periodo è finita e deve farne il Sentiment Analysis.
                string s = contenuto.Text.ToString();

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
                        String pezzoText = s.Substring(start, finish - start);
                      
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
                        contenuto.Text += emoji;
                        contenuto.SetSelection(finish + 3);
                        start = finish;
                    }

                }

            };
            Button b = (Button)FindViewById(Resource.Id.modifica);
            //prendiamo l'id della nota dall'intent e creiamo un nuovo oggetto Nota, passandogli tutte le informazioni dall'intent
            int id = int.Parse(Intent.GetStringExtra("id"));
            
            n.setId_nota(id);
             n.setUsername(Intent.GetStringExtra("username"));
            b.Click += modificaOnClick;

            img = (Button)FindViewById(Resource.Id.mfoto);
            img.Click += CamptureButton_Click;

            l = FindViewById<LinearLayout>(Resource.Id.m);
            foto = FindViewById<Button>(Resource.Id.mfoto);
            Salva = FindViewById<Button>(Resource.Id.modifica);ù
            // a seconda dell'emozione cambiamo colore interfaccia
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

        //metodo che si attiva quando l'utente dell'app preme il tasto Back del telefono portandolo alla schermata Home
        public override bool OnKeyDown(Keycode keyCode, KeyEvent e)
        {
            switch (keyCode)
            {
                // in smartphone
                case Keycode.Back:
                    Intent openPage1 = new Intent(this, typeof(Home));
                    String username = Intent.GetStringExtra("username");
                    emozione = Intent.GetStringExtra("emozione");
                    openPage1.PutExtra("username", username);
                    openPage1.PutExtra("emozione", emozione);
                    StartActivity(openPage1);
                    break;


            }
            return base.OnKeyDown(keyCode, e);
        }

        //evento  lanciato nel momento che si preme il bottone per salvare le modifiche
        private void modificaOnClick(object sender, EventArgs eventArgs)
        {
           
            //prendiamo il titolo dall'Edit text e lo settiamo nell'oggetto Nota
            EditText tit = (EditText)FindViewById(Resource.Id.titoloMod);
            string titolo = tit.Text.ToString();
            n.setTitolo(titolo);
            //prendiamo il contenuto dall'Edit text e lo settiamo nell'oggetto Nota
            EditText ct = (EditText)FindViewById(Resource.Id.contenutoMod);
            string contenuto = ct.Text.ToString();
     
            

            n.setContenuto(contenuto);
            //prendiamo la data corrente e lo settiamo nell'oggetto Nota
            DateTime d = DateTime.Now;            
            n.setData(d.ToString());
            //richiamiamo il metodo per modificare la nota nel DB passandogli l'oggetto nota
            MySQL m = new MySQL();
            m.updateNota(n);


            //si torna alla schermata home
            String username = Intent.GetStringExtra("username");
            Intent openPage1 = new Intent(this, typeof(Home));
            openPage1.PutExtra("username", username);
            openPage1.PutExtra("emozione", emozione);
            StartActivity(openPage1);



        }

        //si attiva quando si scatta la foto
        public void CamptureButton_Click(object sender, System.EventArgs eventArgs)
        {
            TakePhoto();
         
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


        //definisce il comportamento dopo aver scattato la foto
        async void TakePhoto()
        {
            await CrossMedia.Current.Initialize();
            //dove e in che modo salvare la foto sul telefono
            var file = await CrossMedia.Current.TakePhotoAsync(new Plugin.Media.Abstractions.StoreCameraMediaOptions
            {
                PhotoSize = Plugin.Media.Abstractions.PhotoSize.Medium,
                CompressionQuality = 40,
                Name = "img.jpg",
                Directory = "sample"
            });

            if (file == null) { return; }
            //la foto viene convertito in un array di byte
            byte[] imageArray = System.IO.File.ReadAllBytes(file.Path);
            Bitmap b = BitmapFactory.DecodeByteArray(imageArray, 0, imageArray.Length);
            String path = file.Path.ToString();
            //viene richiamato il metodo per il riconoscimento del testo nelle immagini
            String testo = FaceUnlockVocalNode.Resources.MyCognitive.getText(path);
            //il testo riconosciuti viene aggiunto nel contenuto della nota nell'EditText
            EditText contenuto = (EditText)FindViewById(Resource.Id.contenutoMod);
            //verifichiamo con il sentiment Analysis se lo score è positivo o negativo
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
            else
            {
                contenuto.Text += Emoji(0x1F610);

            }

        }

    }
}
