using Android;
using Android.App;
using Android.Content;
using Android.Graphics;
using Android.OS;
using Android.Support.Design.Widget;
using Android.Views;
using Android.Widget;
using Plugin.Media;
using System;


namespace FaceUnlockVocalNode
{
    [Activity(Label = "Reg")]


    public class Reg : Activity
    {
        ImageView img;

        readonly string[] permissionGroup =
        {
            Manifest.Permission.ReadExternalStorage,
            Manifest.Permission.WriteExternalStorage,
            Manifest.Permission.Camera
        };

        EditText username;
        EditText password;
        string user;
        string pass;
        string path;
        protected override void OnCreate(Bundle savedInstanceState)
        {
            base.OnCreate(savedInstanceState);
            SetContentView(Resource.Layout.regLayout);

            img = (ImageView)FindViewById(Resource.Id.frameImage);
            img.Click += CamptureButton_Click;
            Button b = (Button)FindViewById(Resource.Id.registrati);
            b.Click += RegOnClick;
        }

        private void RegOnClick(object sender, EventArgs eventArgs)
        {
            //recuperiamo l'username
            username = (EditText)FindViewById(Resource.Id.textUser);
            user = username.Text.ToString();
            //recuperiamo la password
            password = (EditText)FindViewById(Resource.Id.password);
            pass = password.Text.ToString();
            //settiamo l'oggetto utente
            Utente u = new Utente(user, pass);
            MySQL m = new MySQL();
            //inserimento dell'utente
            Boolean flag = m.inserimentoUtente(u.getUsername(), u.getPassword());

            View view = (View)sender;
            
            if (flag && path!=null)//se l'username inserite non esiste già e la foto è stata scattata
            {
                var id = FaceUnlockVocalNode.Resources.MyCognitive.addPerson(user, ""); //creo un nuovo PersonGroup Person con l'username utente              
                m.inserimentoPersonID(user, id);       //inserisco nel DB l'id PersonId dell'utente        
                FaceUnlockVocalNode.Resources.MyCognitive.addFace(id, path);//aggiungo una faccia al groupPerson Person passando il path della foto scattata
                FaceUnlockVocalNode.Resources.MyCognitive.trainPersonGroup("1"); //faccio il train del PersonGroup
                //si passa alla home passando anche l'username dell'utente.
                Intent openPage1 = new Intent(this, typeof(Home));
                openPage1.PutExtra("username", u.getUsername());
                StartActivity(openPage1);

            }
            else
            {
                Snackbar.Make(view, "Errore esiste già un utente con questo username: " + user, Snackbar.LengthLong)
                 .SetAction("Action", (Android.Views.View.IOnClickListener)null).Show();
            }
            

        }

        //chiede i permessi per la fotocamera
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


