# Script per l'installazione del desktop environment su macchine ubuntu

curl "$1/VmCreatingDesktop?name=$2"
sudo apt-get update
sudo apt install -y xfce4
sudo wget https://github.com/LorenzoFasolino/createvirtualmachine/blob/main/VNC-Server.tar.gz?raw=true
sudo tar zxvf VNC-Server.tar.gz?raw=true
cd VNC-Server-6.7.2-Linux-x64
sudo ./vncinstall
sudo systemctl enable vncserver-virtuald.service
sudo systemctl start vncserver-virtuald.service
sudo systemctl enable vncserver-x11-serviced.service
sudo systemctl start vncserver-x11-serviced.service
sudo vnclicense -add FLW2G-MLWJB-WJ2LB-ZZXQG-TBWHA
vncserver -geometry 1920x1080
curl "$1/VmReady?name=$2&ipAddr=$3"
