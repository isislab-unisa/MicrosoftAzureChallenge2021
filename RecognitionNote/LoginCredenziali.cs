using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Android.App;
using Android.Content;
using Android.OS;
using Android.Runtime;
using Android.Support.Design.Widget;
using Android.Views;
using Android.Widget;


namespace FaceUnlockVocalNode
{
    [Activity(Label = "Activity1")]
    public class LoginCredenziali : Activity
    {

        EditText username;
        EditText password;
        string user;
        string pass;
        protected override void OnCreate(Bundle savedInstanceState)
        {
            base.OnCreate(savedInstanceState);
            SetContentView(Resource.Layout.loginLayout);

            Button b = (Button)FindViewById(Resource.Id.log);
            b.Click += LogOnClick;
        }


        //al click del bottone per il login 
        private void LogOnClick(object sender, EventArgs eventArgs)
        {
            //recuperiamo l'username dall'editText
            username = (EditText)FindViewById(Resource.Id.userLog);
            user = username.Text.ToString();
            //recuperiamo la password dall'editText
            password = (EditText)FindViewById(Resource.Id.passLog);
            pass = password.Text.ToString();
            //settiamo l'oggetto Utente
            Utente u = new Utente(user, pass);
            //controlliamo le credenziali nel DB
            MySQL m = new MySQL();
            Boolean flag = m.loginUtente(u.getUsername(), u.getPassword());
            View view = (View)sender;
            if (flag)//se sono giuste si accede alla home, altrimenti messaggio di errore
            {
                Intent openPage1 = new Intent(this, typeof(Home));
                openPage1.PutExtra("username", u.getUsername());
                StartActivity(openPage1);

            }
            else
            {
                Snackbar.Make(view, "Errore credenziali errate", Snackbar.LengthLong)
                 .SetAction("Action", (Android.Views.View.IOnClickListener)null).Show();
            }

        }

    }
}