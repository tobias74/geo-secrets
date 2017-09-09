sudo apt-get install software-properties-common python-software-properties

docker
======

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

sudo apt-get update

apt-cache policy docker-ce

sudo apt-get install -y docker-ce




mpongodb
========

sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 0C49F3730359A14518585931BC711F9BA15703C6

echo "deb [ arch=amd64,arm64 ] http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.4.list

sudo apt-get update

sudo apt-get install -y mongodb-org

sudo service mongod start





rabbitmq
========

echo 'deb http://www.rabbitmq.com/debian/ testing main' | sudo tee /etc/apt/sources.list.d/rabbitmq.list
     
wget -O- https://www.rabbitmq.com/rabbitmq-release-signing-key.asc | sudo apt-key add -

sudo apt-get update

sudo apt-get install rabbitmq-server

rabbitmqctl add_user tobias  p*ssword

rabbitmqctl set_permissions tobias ".*" ".*" ".*"





elasticsearch 
=============

sudo add-apt-repository ppa:webupd8team/java

sudo apt-get update

sudo apt-get install oracle-java8-installer

wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -

sudo apt-get install apt-transport-https

echo "deb https://artifacts.elastic.co/packages/5.x/apt stable main" | sudo tee -a /etc/apt/sources.list.d/elastic-5.x.list

sudo apt-get update && sudo apt-get install elasticsearch

sudo update-rc.d elasticsearch defaults 95 10

sudo -i service elasticsearch start




nginx
=====

sudo apt-get install apache2-utils

sudo htpasswd -c /etc/nginx/passwords tobias







spatial-chat
============


sudo apt-get install npm

sudo npm -g install nodemon

sudo npm -g install forever

sudo ln -s /usr/bin/nodejs /usr/bin/node

sudo apt-get install imagemagick

apt-get install rabbitmq-server

sudo apt-get install libav-tools

sudo apt-get install libavcodec-extra



Erlang
------
wget http://packages.erlang-solutions.com/erlang-solutions_1.0_all.deb

sudo dpkg -i erlang-solutions_1.0_all.deb

wget http://packages.erlang-solutions.com/ubuntu/erlang_solutions.asc

sudo apt-key add erlang_solutions.asc

sudo apt-get update

sudo apt-get install erlang





RabbitMQ
--------
wget http://www.rabbitmq.com/community-plugins/v3.5.x/rabbitmq_delayed_message_exchange-0.0.1-rmq3.5.x-9bf265e4.ez

cp rabbitmq_delayed_message_exchange-0.0.1-rmq3.5.x-9bf265e4.ez /usr/lib/rabbitmq/lib/rabbitmq_server-3.5.3/plugins/

rabbitmq-plugins enable rabbitmq_delayed_message_exchange


the following lines in the config will open your rabbitmq-server for the outside world!
Enforce appropriate firewall rules!

//  overwrite the /etc/rabbitmq/rabbitmq.config file with the below config :

[{rabbit, [{loopback_users, []}]}].




rabbitmqctl add_user tobias password

rabbitmqctl set_permissions tobias ".*" ".*" ".*"



elasticsearch.yml
-----------------
script.disable_dynamic: false





