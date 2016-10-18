module.exports = function(dependencies){

  var auth0Helper = require('../auth0-helper');
  var chatIndex = require('../chat_index');
  var config = require('../config');

  
  var auth0 = dependencies.auth0;
  var expressMediaServer = dependencies.expressMediaServer;
  var messagingService = dependencies.messagingService;
  var boundedBuzzService = dependencies.boundedBuzzService;
    
    
    
  return {
    attachEventHandlersToSocket: function(socket){
      
      socket.on('jwt_token', function(data){
        console.log('we did get the token:');
        console.log(data);
        
        var token = data.token;
    
        var jwtToken = auth0Helper.extractJWTToken(token);
        
        console.log('we did get the extracted token: ');
        console.log(jwtToken);
        
        auth0.tokens.getInfo(jwtToken, function(err, userInfo){
          console.log('returned in the callback with the jwtToken?????');
          console.log(err);
          console.log(userInfo);
          if (err || !userInfo) {
            console.log('user is NOT authenticated the token somehow failed.');
            socket.user = {
              isAnonymous: true,
              user_id: 'anonymous',
              name: {
                givenName: 'Anonymous User'
              }
            };
    
          }
          else {
            socket.user = userInfo;
          }
    
        });
    
      });
    
      socket.on('delete_message', function(data){
        console.log('delete message command received.');
        console.log(data);
        chatIndex.getMessage(data.messageId, function(messageData){
          console.log('this is what we got back');
          console.log(messageData);
          if (messageData._source && socket.user && (messageData._source.myUserId === socket.user.user_id)){
            chatIndex.deleteMessage(messageData._id);
            expressMediaServer.deleteMedia(messageData._source.payloadId);
          }
          else {
            console.log('preventing unauthroized delte, or message was not there...');
          }
        });
      });
    
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      socket.on('new message', function (data) {
        console.log('socket new message');
        
        console.log('this is the user ' + socket.user);
        
        if (!socket.user || !socket.user.user_id){
          console.log('anonymous user trying to post something, blocking that.');
          console.log(data.message);
          socket.emit('no_login_in_error',{'yeah':'thats just it'});
          return false;
        }
    
        if (data.position.latitude === undefined || data.position.longitude === undefined){
          console.log('received wrong position');
          socket.emit('chat_error',{
            message: "position was invalid, could not send message."
          });
          return false;
        }
        else
        {
          boundedBuzzService.getTimestampedSortableId(function(timestampedSortableId){
            var myId = timestampedSortableId + '_' + Math.random(1000000,9999999);
            var messageData = {
              messageType: data.messageType,
              messageSecret: data.messageSecret,
              payloadId: data.payloadId,
              message: data.message,
              messageDelay: data.messageDelay,
              myUserId: socket.user.user_id,
              displayName: socket.user.name,
              profileImageUrl: socket.user.picture,
              lat: data.position.latitude,
              lon: data.position.longitude,
              visibilityRadius: data.visibilityRadius,
              timestampedSortableId: parseInt(timestampedSortableId),
              expiresAt: data.expiresAt,
              timestamp: Date.now(),
              _id: myId,
              id: myId
            };
    
            var currentTimestamp = new Date().getTime();
    
            if (data.messageDelay)
            {
              messageData.publishAtTimestamp = currentTimestamp + data.messageDelay;
    
              if ((data.messageType === 'video') || (data.messageType === 'image'))
              {
                messageData.isReady = false;
                chatIndex.indexMessage(messageData);
                expressMediaServer.announceMediaForTranscoding(messageData.payloadId, messageData);
              }
              else
              {
                messageData.isReady = true;
                chatIndex.indexMessage(messageData);
              }
              
              setTimeout(function(){
                if ((data.messageType !== 'video') && (data.messageType !== 'image'))
                {
                  messagingService.broadcastMessage( messageData );
                }
              },data.messageDelay);
            }
            else
            {
              messageData.publishAtTimestamp = currentTimestamp;
    
              if ((data.messageType === 'video') || (data.messageType === 'image'))
              {
                messageData.isReady = false;
                chatIndex.indexMessage(messageData);
                expressMediaServer.announceMediaForTranscoding(messageData.payloadId, messageData);
              }
              else
              {
                messageData.isReady = true;
                chatIndex.indexMessage(messageData);
                messagingService.broadcastMessage( messageData );
              }
            }
          });
        }
      });
    
      socket.on('gcm_subscription_id', function(data){
        socket.gcmSubscriptionId = data.gcmSubscriptionId;
      });
    
      socket.on('new position', function(data){
    
        console.log('socket got new position');
    
        socket.myGeoPosition = {
          latitude: data.latitude,
          longitude: data.longitude
        };
    
        chatIndex.indexSubscription({
          sessionId: socket.id,
          serverId: config.serverId,
          gcmSubscriptionId: socket.gcmSubscriptionId,
          myUserId: socket.user ? socket.user.user_id : null,
          subscribedToTags: data.subscribedToTags,
          messageSecret: data.messageSecret,
          lat: data.latitude,
          lon: data.longitude,
          subscriptionRadius: data.observeRadius, //"100000000m",
          visibilityRadius: data.visibilityRadius, //"100000000m"
        });
    
      });
    
    
      socket.on('disconnect', function () {
        console.log('disconneting user in socket-front-controller');
        chatIndex.deleteSubscription(socket.id);
      });
      
    }
  };  
    
    
    
};