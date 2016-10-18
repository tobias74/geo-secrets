var geoTools = require('../geo_tools');
var io = require('socket.io');
var extend = require('extend');


module.exports = function(dependencies){

  var messagingService = dependencies.messagingService;

  var chatWebSockets = {};



  var frontController = require('./socket-front-controller')(dependencies);




  chatWebSockets.startChat = function startIo(server,options){

    messagingService.subscribeToMessagesForMyServer(function(affectedSockets, data){
      affectedSockets.forEach(function(mySocket){
        var dataToSend = extend({}, data);
        dataToSend.myDistance = geoTools.distance(data.lat, data.lon, mySocket.myGeoPosition.latitude, mySocket.myGeoPosition.longitude, 'K');
        dataToSend.lat = undefined;
        dataToSend.lon = undefined;
        dataToSend.visibilityRadius = undefined;
        dataToSend.messageSecret = undefined;
        mySocket.emit('new message', dataToSend);
      });
    });



    io = io.listen(server,options);

    var packtchat = io.of('/');

    packtchat.on('connection', function(socket){
      socket.on('disconnect', function () {
        console.log('disconneting user in chat-system');
        messagingService.removeSocket(socket);
      });
      
      console.log('-------------------new incoming connection for socket');
      socket.myGeoPosition = {};
      messagingService.announceSocket(socket);
      frontController.attachEventHandlersToSocket(socket);
    });

  };
  
  return chatWebSockets;

};
