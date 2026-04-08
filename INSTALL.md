# Configure Ubuntu VM with Multi KonText and Manatee

## [host] Install Manatee

`sudo apt install build-essential libtool autoconf-archive libpcre3-dev bison libltdl-dev swig3.0 python3-dev`


`git clone https://github.com/czcorpus/manatee-open.git`

`cd manatee-open`

`git checkout release-2.225.8`

`autoreconf --install --force`

`./configure --with-pcre`

`make`

`sudo make install`

`sudo ldconfig`

#### correct destination folder of python manatee library, if needed

`sudo cp -r /usr/local/local/lib/python3.12/dist-packages/* /usr/local/lib/python3.12/dist-packages/`

#### link local python manatee library, if needed

`mkdir -p ~/.local/lib/python3.12/`

`ln -s /usr/local/lib/python3.12/site-packages /home/lablita/.local/lib/python3.12/site-packages`


## [host] Setup kontext container


`sudo apt-get install lxc`

`sudo lxc-create -t download -n kontext-container -- -d ubuntu -r noble -a amd64`


### configure shared folder between host and container:

`sudo mkdir -p /opt/corpora`

`sudo nano /var/lib/lxc/kontext-container/config`

write at the end of file:

`lxc.mount.entry = /opt/corpora opt/corpora none bind,create=dir 0 0`

### configure a static IP address for the container

`sudo nano /var/lib/lxc/kontext-container/config`

put this line at the end of network configuration:

`lxc.net.0.hwaddr = 00:16:3e:ab:cd:10`

edit the lxc-net configuration file

`sudo nano /etc/default/lxc-net`

add the following line:

`LXC_DHCP_CONFILE=/etc/lxc/dnsmasq-hosts.conf`

create the file dnmasq-hosts.conf

`sudo nano /etc/lxc/dnsmasq-hosts.conf`

add the following line:

`dhcp-host=00:16:3e:ab:cd:10,10.0.3.100`

clean and restart lxc

`sudo systemctl stop lxc-net`

`sudo rm -f /var/lib/misc/dnsmasq.lxcbr0.leases`

`sudo systemctl start lxc-net`

### start the container

`sudo lxc-start -n kontext-container`

`sudo lxc-info -n kontext-container -iH`

check the ip address --> e.g. 10.0.3.100

log container vm:

`sudo lxc-attach -n kontext-container`

## [container] install multi_kontext

`apt-get update`

`apt-get install -y ca-certificates git nano nodejs`

`apt-get install -y npm`

`cd /opt`

`git clone https://github.com/liu-dilef/multi_kontext.git /opt/multi_kontext/`

`python3 /opt/multi_kontext/scripts/install/install.py`


### [container] build the app

`npm install; npm start build:production`


## [container] setup users

copy users configuration file:

`cp /opt/multi_kontext/lib/plugins/default_auth/scripts/users.sample.json /opt/multi_kontext/conf/users.json`

add users:

`./venv/bin/python3 lib/plugins/default_auth/scripts/import_users.py conf/users.json`

add corpora to user (e.g. user id = 2)

`./venv/bin/python3 lib/plugins/default_auth/scripts/usercorp.py 2 add impaqts,susanne`

remove corpus from user:

`./venv/bin/python3 lib/plugins/default_auth/scripts/usercorp.py 2 remove susanne`


remove all corpora from user:

`./venv/bin/python3 lib/plugins/default_auth/scripts/usercorp.py 2 remove_all`


list user corpora:

`./venv/bin/python3 lib/plugins/default_auth/scripts/usercorp.py 2 list`


## [container] Run Multi KonText

`./venv/bin/python3 public/app.py --address 0.0.0.0 --port 5000`


## Add corpus

### [host] 

copy registry file to `/opt/corpora/reg` (via SFTP or other network protocol)

copy vertical file to `/opt/corpora/vert`

`export MANATEE_REGISTRY=/opt/corpora`

`compilecorp --recompile-corpus --no-sketches impaqts /opt/corpora/vert/newcorpus.vrt`

### [container]

add the new corpus to the kontext configuration files:

* conf/config.xml
* conf/corplist.xml

!! adjust the user permissions on corpora access !!


## [host] Apache configuration

#### Install Apache

`sudo apt update`

`sudo apt install apache2 -y`

#### Enable proxy modules

`sudo a2enmod proxy`

`sudo a2enmod proxy_http`

`sudo a2enmod rewrite`

`sudo systemctl restart apache2`

#### edit apache configuration

`sudo nano /etc/apache2/sites-available/000-default.conf`

---
    <VirtualHost *:80>
    ServerName localhost

    ProxyPreserveHost On

    ProxyPass / http://10.0.3.100:5000/
    ProxyPassReverse / http://10.0.3.100:5000/

    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
    </VirtualHost>
---

`sudo systemctl restart apache2`


## [container] Multi KonText as a service

`nano /etc/systemd/system/multi_kontext.service`

---
    [Unit]
    Description=Multi Kontext Sanic app
    After=network.target
    
    [Service]
    Type=simple
    User=root
    Group=root
    WorkingDirectory=/opt/multi_kontext
    ExecStart=/opt/multi_kontext/venv/bin/python3 /opt/multi_kontext/public/app.py --address 0.0.0.0 --port 5000
    Restart=always
    RestartSec=5
    
    Environment=PYTHONUNBUFFERED=1
    
    [Install]
    WantedBy=multi-user.target
---

`sudo systemctl daemon-reload`

`sudo systemctl enable multi_kontext.service`

`sudo systemctl start multi_kontext.service`
