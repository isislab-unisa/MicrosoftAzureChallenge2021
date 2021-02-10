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
    class Utente
    {
        private String username;
        private String password;
        private String personID;
        public Utente(String username, String password)
        {
            this.username = username;
            this.password = password;
        }

        public String getUsername()
        {
            return username;
        }
        public String getPassword()
        {
            return password;
        }

        public void setUsername(String username)
        {
            this.username = username;
        }
        public void setPassword(String password)
        {
            this.password = password;
        }

        public String getPersonID()
        {
            return personID;
        }
        public void setPersonID(String personID)
        {
            this.personID = personID;
        }
    }
}