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

namespace FaceUnlockVocalNode
{

    public class Note
    {
        private int id_nota;
        private String titolo;
        private String data;
        private String contenuto;
        private String username;
        public Note() { }
        public Note(int id_nota, String titolo, String data, String contenuto, String username)
        {
            this.id_nota = id_nota;
            this.titolo = titolo;
            this.data = data;
            this.contenuto = contenuto;
            this.username = username;
        }
        public int getId_nota()
        {
            return id_nota;
        }
        public String getTitolo()
        {
            return titolo;
        }
        public String getUsername()
        {
            return username;
        }
        public String getData()
        {
            return data;
        }
        public String getContenuto()
        {
            return contenuto;
        }
        public void setTitolo(String titolo)
        {
            this.titolo = titolo;
        }
        public void setData(String data)
        {
            this.data = data;
        }
        public void setUsername(String username)
        {
            this.username = username;
        }
        public void setContenuto(String contenuto)
        {
            this.contenuto = contenuto;
        }
        public void setId_nota(int id_nota)
        {
            this.id_nota = id_nota;
        }
    }
}