using Android.App;
using Android.OS;
using Android.Support.V7.App;
using Android.Runtime;
using Android.Widget;
using System;
 
using Android.Content;
using System.Text;

namespace FaceUnlockVocalNode
{


    [Activity(Label = "@string/app_name", Theme = "@style/AppTheme", MainLauncher = true)]
    public class MainActivity : AppCompatActivity
    {
      
        protected override void OnCreate(Bundle savedInstanceState)
        {
            base.OnCreate(savedInstanceState);
            Xamarin.Essentials.Platform.Init(this, savedInstanceState);
       
            SetContentView(Resource.Layout.activity_main);
            Button b1 = (Button)FindViewById(Resource.Id.button);
            b1.Click += LogOnClick;

            Button b2 = (Button)FindViewById(Resource.Id.buttonReg);
            b2.Click += RegOnClick;
 
        }
 

      

        //se si preme il bottone per il login si va alla schermata del login
        private void LogOnClick(object sender, EventArgs eventArgs)
        {
            Intent openPage1 = new Intent(this, typeof(Login));
            StartActivity(openPage1);
        }

        //se si preme il bottone per la registrazione si va alla schermata di registrazione
        private void RegOnClick(object sender, EventArgs eventArgs)
        {
            Intent openPage1 = new Intent(this, typeof(Reg));
            StartActivity(openPage1);
        }
        //richiesta dei permessi all'utente
        public override void OnRequestPermissionsResult(int requestCode, string[] permissions, [GeneratedEnum] Android.Content.PM.Permission[] grantResults)
        {
            Xamarin.Essentials.Platform.OnRequestPermissionsResult(requestCode, permissions, grantResults);

            base.OnRequestPermissionsResult(requestCode, permissions, grantResults);
        }

    }
}
