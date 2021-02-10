using Android.App;
using Android.OS;
using Android.Support.V7.App;
using Android.Widget;
using Android.Content;
using System;
using Android;
using Plugin.Media;
using Android.Graphics;
using Android.Views;
using Android.Support.Design.Widget;
using Android.Support.V4.Content;

namespace FaceUnlockVocalNode
{
    [Activity(Label = "Login")]
    public class Login : Activity
    {
        Button ButtonLogin;
        ImageView img;
       
      
   
        readonly string[] permissionGroup =
        {
            Manifest.Permission.ReadExternalStorage,
            Manifest.Permission.WriteExternalStorage,
            Manifest.Permission.Camera
        };

        EditText username;
        string user;
        string path;
        protected override void OnCreate(Bundle savedInstanceState)
        {
            base.OnCreate(savedInstanceState);
            SetContentView(Resource.Layout.logFaceLayout);

            RequestPermissions(permissionGroup, 0);
            img = (ImageView)FindViewById(Resource.Id.frameImage);
            img.Click += CamptureButton_Click;
      
            ButtonLogin = (Button)FindViewById(Resource.Id.ButtonLogin);
            ButtonLogin.Click += LogOnClick;

            Button b1 = (Button)FindViewById(Resource.Id.Credenziali);
            b1.Click += LogconCred;

        }
        private void LogOnClick(object sender, EventArgs eventArgs)
        {            
            //recuperiamo l'username dall'EditText
            username = (EditText)FindViewById(Resource.Id.textUser);
            user = username.Text.ToString();
            MySQL m = new MySQL();
            //controlliamo che l'utente esista nel Database
            Boolean flag = m.controlloUtente(user);

            View view = (View)sender;
            if (flag && path!=null) //se esiste un utente con questo username
            {
                string[] emozione = { "" };
                int[] numFrase = new int[1];
                //richiamiamo il metodo detect per analizzare l'emozione della foto e per ottenere il faceId della foto
                var id = FaceUnlockVocalNode.Resources.MyCognitive.Detect(path, emozione, numFrase);
                //richiamiamo il metodo identify per controllare se la foto con il faceId generato appartiene a una Person del PersonGroup
                string idP = FaceUnlockVocalNode.Resources.MyCognitive.identify(id);
                if (idP != "")
                { //se esiste un utente con questa faccia avrà un id diverso da stringa vuota
                    if (m.getPersonID(user, idP)) //e quell'id deve appartenere all'username dichiarato
                    {
                        //si accede alla home passando delle informazioni nell'intent


                       
                        Intent openPage1 = new Intent(this, typeof(Home));
                        openPage1.PutExtra("username", user);
                        openPage1.PutExtra("emozione", emozione[0]);
                        openPage1.PutExtra("numFrase", numFrase[0]);
                        StartActivity(openPage1);

                    }
                    else
                    {//altrimenti messaggio di errore
                        Snackbar.Make(view, "Errore mismatch tra foto e username: ", Snackbar.LengthLong)
                   .SetAction("Action", (Android.Views.View.IOnClickListener)null).Show();

                    }
                }
                else
                {
                    Snackbar.Make(view, "Errore riconoscimento: ", Snackbar.LengthLong)
                     .SetAction("Action", (Android.Views.View.IOnClickListener)null).Show();
                }
            }
            else
            {
                Snackbar.Make(view, "Errore inserisci tutti campi, o username errato: " + user, Snackbar.LengthLong)
                 .SetAction("Action", (Android.Views.View.IOnClickListener)null).Show();
            }


        }
        //quando si preme sul bottone di login con credenziali si passa alla schermata loginCredenziali
        private void LogconCred(object sender, EventArgs eventArgs)
        {

            Intent openPage1 = new Intent(this, typeof(LoginCredenziali));
            StartActivity(openPage1);
        }

        //richiesta dei permessi all'utente
        public override void OnRequestPermissionsResult(int requestCode, string[] permissions, Android.Content.PM.Permission[] grantResults)
        {

            Plugin.Permissions.PermissionsImplementation.Current.OnRequestPermissionsResult(requestCode, permissions, grantResults);
        }
        //quando si scatta la foto
        public void CamptureButton_Click(object sender, System.EventArgs eventArgs)
        {
            TakePhoto();
 
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
            //salvo il percorso dell'immagine in una variabile di istanza
            path = file.Path.ToString();
            //setta nel widget ImageView la foto scattata
            img.SetImageBitmap(b);
        }

    }
}
