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





