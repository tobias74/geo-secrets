
  var chatIndex = require('../chat_index');
  var _ = require('underscore');
  var gcm = require('node-gcm');
  var config = require('../config');
  var redis = require('redis');

  var socketsBySessionId = {};


  var redisPublisher = redis.createClient(config.redisPort, config.redisUrl);
  var redisSubscriber = redis.createClient(config.redisPort, config.redisUrl);

  var sendMessageToGcm = function(messageData){
    return false; // not doing this for now....
    
    console.log('in the method for sending to gcm-------------------------------------------------------------');
    chatIndex.searchSubscriptionsForMessage({
      lat: messageData.lat,
      lon: messageData.lon,
      visibilityRadius: messageData.visibilityRadius,
      message: messageData.message,
      messageSecret: messageData.messageSecret
    }, 
    function(subscriptions){
      console.log("returned from searching subscriptions");
      _.uniq(subscriptions,true,function(sub){return sub.gcmSubscriptionId}).forEach(function(subscription){
        console.log('sending out to gcm  ' + subscription.gcmSubscriptionId);
        var regTokens = [];
        if (subscription.gcmSubscriptionId){
          regTokens.push(subscription.gcmSubscriptionId);
        }
        var message = new gcm.Message({
          notification: {
              title: "Hello, World",
              icon: "ic_launcher",
              body: "This is a notification that will be displayed ASAP."
          },
          data: {
            message: messageData.message,
            displayName: messageData.displayName
          }
        });
        var sender = new gcm.Sender(config.google.apiKey);
        sender.send(message, { registrationTokens: regTokens }, function (err, response) {
          if (err){
            console.log(err);
          }
          else {
            console.log(response);
          }
        });

        
      });
    });
  
  };


  var broadcastMessage = function(messageData){
    console.log("now searching for server subscriptions");
    console.log(messageData);
    
    sendMessageToGcm(messageData);
    
    chatIndex.searchServersSubscriptionsForMessage({
      lat: messageData.lat,
      lon: messageData.lon,
      visibilityRadius: messageData.visibilityRadius,
      message: messageData.message,
      messageSecret: messageData.messageSecret
    }, 
    function(servers){
      console.log("returned from searching servers");  
      servers.forEach(function(server){
        console.log('sending out to server  ' + server.serverId);

        redisPublisher.publish(getRedisChannelNameByServerId(server.serverId), JSON.stringify( messageData ));
      });
    });

  };


  var publishMessage = function(messageData){
    console.log(messageData);
    chatIndex.indexMessage( messageData );
    broadcastMessage( messageData );
  };

  var publishMessageTentatively = function(messageData){
    chatIndex.indexMessage( messageData );
    if (messageData.isReady && (messageData.publishAtTimestamp <= (new Date().getTime()) )  && (messageData.expiresAt >= (new Date().getTime()))   ){
      broadcastMessage( messageData );
    }
  };

  var getRedisChannelNameByServerId = function(serverId){
    return serverId + '_' + config.environmentName;
  };
    
    
  var announceSocket = function(socket){
      socketsBySessionId[socket.id] = socket;
  };
  
  var removeSocket = function(socket){
    delete socketsBySessionId[socket.id];
  };

  var subscribeToMessagesForMyServer = function(callback){
    
      console.log('Subscribing this server to the redis-pubsub. this should alwaqys be done? yeah...');
      redisSubscriber.subscribe(getRedisChannelNameByServerId(config.serverId));
      redisSubscriber.on('message', function(redisChannel, redisMessage){
        if (redisChannel != getRedisChannelNameByServerId(config.serverId)){
          console.log('THIS SHOULD NOT HAPPEN!');
          throw new Error('redis misunderstanding');
        }
    
        var data = JSON.parse(redisMessage);
    
    
        chatIndex.searchSubscriptionsForMessageAndServer({
          serverId: config.serverId,
          lat: data.lat,
          lon: data.lon,
          visibilityRadius: data.visibilityRadius,
          message: data.message,
          messageSecret: data.messageSecret
        }, function(subscriptions){
    
          var affectedSockets = subscriptions.map(function(subscription){
              return socketsBySessionId[subscription.sessionId];
          }).filter(function(mySocket){
              if (mySocket === undefined){
                //console.log('undefined socket for user ' + subscription.myUserId + ' and sessionId ' + subscription.sessionId);
                return false;
              }
              else {
                //console.log('happily passing ht emaesage along, thank you');
                return true;
              }              
          });

          callback(affectedSockets, data);

        });
      });
      
  };
    
    
    
 module.exports = {
      publishMessage: publishMessage,
      broadcastMessage: broadcastMessage,
      publishMessageTentatively: publishMessageTentatively,
      subscribeToMessagesForMyServer: subscribeToMessagesForMyServer,
      announceSocket: announceSocket,
      removeSocket: removeSocket
  };
    
