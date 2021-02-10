

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

using Nancy.Json;

namespace FaceUnlockVocalNode
{
    public class CustomAdapter : BaseAdapter<Note>
    {
        List<Note> items;
        private Activity context;
        Note item2;
        String emozione;
        int P = 0;
        public CustomAdapter(Activity context, List<Note> items)
            : base()
        {
            this.context = context;
            this.items = items;
        }
        public override long GetItemId(int position)
        {
            return position;
        }
        public override Note this[int position]
        {
            get { return items[position]; }
        }
        public override int Count
        {
            get { return items.Count; }
        }
        public override View GetView(int position, View convertView, ViewGroup parent)
        {
           
            var item = items[position];
            item2 = item;
            View view = convertView;
            if (view == null)
                view = context.LayoutInflater.Inflate(Resource.Layout.home, null);
            // in ogni view mettiamo titlo, data ultima modifica e il bottone cancella
            view.FindViewById<TextView>(Resource.Id.titoloNota).Text = item.getTitolo();
            view.FindViewById<TextView>(Resource.Id.dataNota).Text = "ultima modifica: " + item.getData();
            view.FindViewById<Button>(Resource.Id.elimina).Text = "Cancella";

            // al click del bottone cancella, viene cancellata la nota dal database e poi si ritorna (ricaricando la pagina) alla home
            view.FindViewById<Button>(Resource.Id.elimina).Click += (sender, args) =>
            {
                if (P == 0)
                {

                    emozione = context.Intent.GetStringExtra("emozione");
                    MySQL s = new MySQL();                  
                    s.deleteNota(item.getId_nota());
                    Intent openPage1 = new Intent(context, typeof(Home));
                    openPage1.PutExtra("username", item.getUsername());
                    openPage1.PutExtra("emozione", emozione);
                    context.StartActivity(openPage1); 
                    P++;

                }
               


            };
             
            //al click sulla view si va alla pagina di modifica Nota passando nell'intent username, idNota, titolo e contenuto
            view.Click += (sender, args) =>
            {
                
                emozione = context.Intent.GetStringExtra("emozione");
                Intent openPage1 = new Intent(context, typeof(ModificaNota));
                openPage1.PutExtra("username", item.getUsername());
                openPage1.PutExtra("id", "" + item.getId_nota());
                openPage1.PutExtra("titolo", item.getTitolo());
                openPage1.PutExtra("contenuto", item.getContenuto());
                 openPage1.PutExtra("emozione", emozione);
                context.StartActivity(openPage1); 
            };

            return view;
        }


    }
}
