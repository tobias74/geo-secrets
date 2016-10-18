'use strict';


angular.module('chatApp').controller('ChatController', 
['$location','$scope','$route','$resource','$http','ResponsiveService','FileUploader','socketIO','$rootScope','$q','store',
function($location,$scope,$route,$resource,$http,ResponsiveService,FileUploader,socketIO,$rootScope,$q,store) {
  
  var socket = false;
  var positionPromise; 
  
  
  console.debug('making new chatcontroller...!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  
  $scope.data = {};
  $scope.data.scrollData = {};
  $scope.newMessageStack = [];
  $scope.isScrolled = false;
  $scope.finishedLoadingMessages = false;  
  

  $scope.myPosition = {}; 
  $scope.myPosition.coords = {};
  $scope.myPosition.isValid = false;
  $scope.myTagFilter = "";
  $scope.mySecretString = "";
  
  $scope.messages = [];
  
  
  
  $scope.ranges = [
      {name:'5m', value:'5m'},
      {name:'10m', value:'10m'},
      {name:'20m', value:'20m'},
      {name:'30m', value:'30m'},
      {name:'50m', value:'50m'},
      {name:'70m', value:'70m'},
      {name:'100m', value:'100m'},
      {name:'200m', value:'200m'},
      {name:'500m', value:'500m'},
      {name:'1km', value:'1km'},
      {name:'2km', value:'2km'},
      {name:'5km', value:'5km'},
      {name:'10km', value:'10km'},
      {name:'100km', value:'100km'},
      {name:'1000km', value:'1000km'}
    ];
  $scope.mySubscriptionRange = $scope.ranges[11];
  $scope.myVisibilityRange = $scope.ranges[11];


  $scope.ttls = [
      {name:'10 seconds', value:10 * 1000},
      {name:'1 minute', value:60 * 1000},
      {name:'5 minutes', value:5 * 60  * 1000},
      {name:'10 minutes', value:10 * 60  * 1000},
      {name:'60 minutes', value:60 * 60  * 1000},
      {name:'2 hours', value:120 * 60  * 1000},
      {name:'1 day', value:1 * 24 * 60 * 60  * 1000},
      {name:'7 days', value:7 * 24 * 60 * 60  * 1000},
      {name:'21 days', value:21 * 24 * 60 * 60  * 1000},
      {name:'31 days', value:31 * 24 * 60 * 60  * 1000},
      {name:'365 days', value:365 * 24 * 60 * 60  * 1000}
    ];
  $scope.myTTL = $scope.ttls[10];



  $scope.messageDelays = [
      {name:'immediately', value: 0},
      {name:'after 10 seconds', value: 10 * 1000},
      {name:'after 30 seconds', value: 30 * 1000},
      {name:'after 1 minute',   value: 60 * 1000},
      {name:'after 2 minutes',  value: 120 * 1000},
      {name:'after 3 minutes',  value: 180 * 1000},
      {name:'after 5 minutes',  value: 5 * 60 * 1000},
      {name:'after 10 minutes',  value: 10 * 60 * 1000},
      {name:'after 20 minutes',  value: 20 * 60 * 1000},
      {name:'after 30 minutes',  value: 30 * 60 * 1000},
      {name:'after 45 minutes',  value: 45 * 60 * 1000},
      {name:'after 60 minutes',  value: 60 * 60 * 1000},
      {name:'after 90 minutes',  value: 90 * 60 * 1000},
      {name:'after 2 hours',     value:120 * 60 * 1000},
      {name:'after 3 hours',     value:3 * 60 * 60 * 1000},
      {name:'after 4 hours',     value:4 * 60 * 60 * 1000},
      {name:'after 5 hours',     value:5 * 60 * 60 * 1000},
      {name:'after 8 hours',     value:8 * 60 * 60 * 1000},
      {name:'after 10 hours',     value:10 * 60 * 60 * 1000},
      {name:'after 12 hours',     value:12 * 60 * 60 * 1000},
      {name:'after 18 hours',     value:18 * 60 * 60 * 1000},
      {name:'after 24 hours',     value:24 * 60 * 60 * 1000},
      {name:'after 2 days',       value:2 * 24 * 60 * 60 * 1000},
      {name:'after 3 days',       value:3 * 24 * 60 * 60 * 1000},
      {name:'after 4 days',       value:4 * 24 * 60 * 60 * 1000},
      {name:'after 5 days',       value:5 * 24 * 60 * 60 * 1000},
      {name:'after 7 days',       value:7 * 24 * 60 * 60 * 1000},
      {name:'after 10 days',       value:10 * 24 * 60 * 60 * 1000},
    ];
  $scope.myMessageDelay = $scope.messageDelays[0];


  
  


  var stopWatchingLogin = $rootScope.$watch('myProfile', function(myProfile){
    if (!myProfile){
      console.debug('myProfile was undefined.. not acting on it now.');
    }
    else {
      console.debug('login status changed, refreshing socket');
      refreshSocket();
      $scope.clickForRecentMessages();
    }
  });
  
  

  var disconnectSocket = function(){
    $scope.disconnectScheduled=true;
    socket && socket.disconnect();
    socket && socket.close();
    setTimeout(function(){
      $scope.disconnectScheduled=false;
    },0);
  };

  var refreshSocket = function(){
    if (socket){
      disconnectSocket();
      
    }
    
    console.debug('making new socket................###########################################################');

    socket = socketIO({
      'forceNew': true,
      'reconnection': true,
      'reconnectionDelay': 500,
      'reconnectionAttempts': 10
    });
  
  
    socket.on('connect', function () {
      socket.emit('jwt_token', {token: 'Bearer ' + store.get('token')});
    });

    socket.on('no_login_in_error', function(data){
      alert('we did get a no-login-in-error back from the backend: ' +  data);
      $route.reload();
    });
  
    socket.on('disconnect', function(){
      if (!$scope.disconnectScheduled){
        //alert('we got disconnected, trying to reconnect');
        refreshSocket();
      }
    });
  
    socket.on('new message', function (data) {
      console.debug('new message');
      console.debug(data);
      $scope.$apply(function(){
        if ($scope.isScrolled){
          console.debug('pushing to stack');
          $scope.newMessageStack.push(data);  
        }
        else {
          console.debug('Releasing');
          releaseMessage(data);
        }
      });
    });
    
    $scope.updateSubscription();

  };
  

  $scope.getTranscodedVideoUrl = function(format, payloadId){
    return '/transcodedVideo/' + format + '/' + payloadId;    
  };


  $scope.scrolledForMore = function(){
    console.debug('scrolled for more....######################################################################');
    var oldest = $scope.findOldestMessage();
    console.debug(oldest);

    $scope.loadMessages({
      maxId: oldest.timestampedSortableId
    });
  };


  $scope.findOldestMessage = function(){
    var oldestMessage = $scope.messages.reduce(function(previousValue, currentValue){
      if (!previousValue.timestampedSortableId){
        return currentValue;
      }
      else {
        if (previousValue.timestampedSortableId <= currentValue.timestampedSortableId){
          return previousValue;
        }
        else {
          return currentValue;
        }
      }
    },{});
    
    return oldestMessage;
  };



  var aborter = $q.defer();

  $scope.loadMessages = function(options){
    
    aborter.resolve();
    
    options = options || {};
    
    var query = {
      latitude: $scope.myPosition.coords.latitude,
      longitude: $scope.myPosition.coords.longitude,
      radius: $scope.mySubscriptionRange.value,
      hashTag: $scope.myTagFilter,
      secretString: $scope.mySecretString,
      count: 20
    };

    if (options.maxId){
      query.maxId = options.maxId;      
    }
    
    if ($scope.myPosition.isValid){
      aborter = $q.defer();
      getRecentMessages(query, aborter, function(items){
  
        // dont mark messages on first loading. and not in case this is a scrolled loading. boy this is hacked beyond belief, rethink completely.
        if ($scope.finishedLoadingMessages && !options.maxId ){
          items.forEach(function(item){
            if (!$scope.messages.some(function(testItem){
              return (item._id == testItem._id);
            }))
            {
              markAsNew(item);
            }
          });
        }
  
        // ok, this next line is a total hack. : do not push to stack when scrolled, when loading at the bottom witrh maxId.. we should rethink this altogether.
        if ($scope.isScrolled && !options.maxId){
          console.debug('pushing to stack from loading');
          // avoid pushing doublettes!!!!
          items.forEach(function(item){
              if (
              !$scope.newMessageStack.some(function(testItem){
                  return (item._id == testItem._id);
                })  
                &&
              !$scope.messages.some(function(testItem){
                  return (item._id == testItem._id);
                })  
                )
                {
                  $scope.newMessageStack.push(item);  
                }
          });
          $scope.finishedLoadingMessages = true;  

        }
        else 
        {
          mergeLoadedMessages(items);
          $scope.finishedLoadingMessages = true;  
        }
        
      });
    }
    
    
  };

  $scope.clickForRecentMessages = function(){
    // abort old request here.
    $scope.loadMessages();
  };

  


  
  
  
  $scope.scrollInNewMessages = function(){
    $scope.data.scrollData.doScrollTop();
  };
  
  
  $scope.$watch('data.scrollData',function(newValue,oldValue){
    //console.debug(newValue);
    if (newValue.scrollTop === 0 || newValue.scrollTop == undefined){
      $scope.isScrolled = false;
      if ($scope.hasNewMessages()){
        releaseNewMessages();
      }
    } 
    else {
      $scope.isScrolled = true;
    }
      
  },true);
  
  
  


  
  var mergeLoadedMessages = function(items){
    items.forEach(function(item){
      if (!$scope.messages.some(function(testItem){
            return (item._id == testItem._id);
          }))
      {
        $scope.messages.push(item);  
      }
    });

    $scope.messages.sort(descendingDateOrderer);
    
  };
  
  
  $scope.$watch('myPosition',function(newPosition,oldPosition){
    console.debug('position has Changed...');
    console.debug(newPosition);
    console.debug(oldPosition);
    $scope.updateSubscription();
    $scope.clickForRecentMessages();    
  },true);





  $scope.$watch('myTagFilter',function(newValue,oldValue){
    if ($scope.myTagFilter == ""){
      $scope.subscribedToTags = null;
      $scope.onNewTagFilter();
    }
  },true);

  $scope.$watch('mySecretString',function(newValue,oldValue){
    if ($scope.mySecretString == ""){
      $scope.messageSecret = null;
      $scope.onNewSecretString();
    }
  },true);
  


  
  
  





  $scope.deleteMessage = function(message){
    console.log('deleteig' + message.id);
    console.log(message);
    socket.emit('delete_message', {messageId: message.id});

    $scope.messages = $scope.messages.filter(function(innerMessage){
      return (message.id !== innerMessage.id);
    });

  };
  
  $scope.sendMessage = function(){
    var channelTag = "";
    if ($scope.myTagFilter != ""){
      channelTag = " ( " + $scope.myTagFilter + " )";
    }
    if (($scope.messageInput != "") && ($scope.messageInput != undefined)){
      var messageData = {
          message: $scope.messageInput + channelTag,
          messageType: "text",
          messageSecret: $scope.messageSecret,
          visibilityRadius: $scope.myVisibilityRange.value,
          messageDelay: $scope.myMessageDelay.value,
          expiresAt: $scope.myTTL.value + Date.now() + $scope.myMessageDelay.value,
          position: {
            latitude: $scope.myPosition.coords.latitude,
            longitude: $scope.myPosition.coords.longitude
          }
      };
      
      console.debug('sending message');
      console.debug(messageData);

      socket.emit('new message', messageData);
      $scope.messageInput = "";
    }
  };
  




  

  
  
  var markAsNew = function(message){
    message.isNew = true;
    setTimeout(function(){
      message.isNew = false;
    },3000);
  };


  var releaseNewMessages = function(){
    $scope.newMessageStack.forEach(function(data){
      markAsNew(data);
      $scope.messages.push(data);
    });
    $scope.newMessageStack = [];
    $scope.messages.sort(descendingDateOrderer);
  };
  
  var releaseMessage = function(data){
    markAsNew(data);
    $scope.messages.push(data);
    $scope.messages.sort(descendingDateOrderer);
  };


  
  





  
  
  
  
  
  




  $scope.onNewTagFilter = function(){

    if ($scope.myTagFilter == ""){
      $scope.subscribedToTags = null;
    }
    else {
      $scope.subscribedToTags = $scope.myTagFilter.split(" ");
    }
    if ($scope.myPosition.isValid){
      $scope.messages = [];
      $scope.newMessageStack = [];
      $scope.isScrolled = false;
      $scope.finishedLoadingMessages = false;  
      $scope.updateSubscription();
      $scope.clickForRecentMessages();    
    }
  };
  
  $scope.onNewSecretString = function(){

    if ($scope.mySecretString == ""){
      $scope.messageSecret = null;
    }
    else {
      $scope.messageSecret = $scope.mySecretString.split(" ");
    }
    if ($scope.myPosition.isValid){
      $scope.messages = [];
      $scope.newMessageStack = [];
      $scope.isScrolled = false;
      $scope.finishedLoadingMessages = false;  
      $scope.updateSubscription();
      $scope.clickForRecentMessages();    
    }
  };




  $scope.uploader = new FileUploader({
    autoUpload:true,
    removeAfterUpload: true,
    url:'/upload',
    onCompleteItem: function(item, response, status, headers){
      console.debug('image upload complete.');
      
      console.debug(response);
      
      var channelTag = "";
      if ($scope.myTagFilter != ""){
        channelTag = " ( " + $scope.myTagFilter + " )";
      }
      
      $scope.buttonCaption = 'Upload Media';
  
      response.forEach(function(myResponse){
        var messageData = {
          message: channelTag,
          messageType: myResponse.payloadType,
          messageSecret: $scope.messageSecret,
          messageDelay: $scope.myMessageDelay.value,
          payloadId: myResponse.fileId,
          payloadType: myResponse.payloadType,
          visibilityRadius: $scope.myVisibilityRange.value,
          expiresAt: $scope.myTTL.value + Date.now() + $scope.myMessageDelay.value,
          position: {
            latitude: $scope.myPosition.coords.latitude,
            longitude: $scope.myPosition.coords.longitude
          }
        };
        
        console.debug(messageData);
        socket.emit('new message', messageData);
      });
    },
    onAfterAddingFile: function(item){
      $scope.buttonCaption = 'Uploading...';
    }
  });

  $scope.buttonCaption = 'Upload Media';



  $scope.$watch('mySubscriptionRange',function(newValue, oldValue){
    $scope.updateSubscription();
    $scope.myVisibilityRange = $scope.mySubscriptionRange;
    $scope.messages = [];
    $scope.newMessageStack = [];
    $scope.isScrolled = false;
    $scope.finishedLoadingMessages = false;  
    $scope.clickForRecentMessages();    
  });


  $scope.updateSubscription = function(){
    console.debug('registering me on the promise');
    
    positionPromise.then(function(position){
      console.debug('the position promise was successfully resolved in the updateSubscription-Method. sending the position now.');
      console.log('laitude: ' + position.coords.latitude);
      console.log('longitude: ' + position.coords.longitude);
      socket.emit('new position',{
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        observeRadius: $scope.mySubscriptionRange.value,
        subscribedToTags: $scope.subscribedToTags,
        messageSecret: $scope.messageSecret
      });
    }, function(reason){
      console.debug('could not send position, because something wetn wrong with the position.');
    }, function(update){
      console.debug('we are about to send the position, because the promise was update3d!!!');
    });
  };











  var producePosition = function(){
    var deferred = $q.defer();

    navigator.geolocation.getCurrentPosition(function(position){
        deferred.notify('navigator returned response');
        deferred.resolve(position);
    });

    return deferred.promise;

  };


  var makePositionPromise = function(){
    var promise = producePosition();
    promise.then(function(position){
        $scope.myPosition.isValid = true;
        $scope.myPosition.coords.latitude = position.coords.latitude;
        $scope.myPosition.coords.longitude = position.coords.longitude;
    }, function(reason){
        console.debug('producing position failed because: ' +  reason);
    }, function(update){
        console.debug('Got position notification: ' + update);
    });
    
    return promise;    
  };

  

  var timerMessageReload = setInterval(function(){
    console.debug('producing position');
    positionPromise = makePositionPromise();
  },60000);
  
  positionPromise = makePositionPromise();

  refreshSocket();

  
  var timerMessageDecay = setInterval(function(){
    
    $scope.$apply(function(){
      $scope.messages.forEach(function(message){
        var timeNow = Date.now();
        message._expirationTimestamp = message.expiresAt;
        message._remainingMilliSeconds = message.expiresAt - timeNow;
        message._remainingSeconds = Math.floor(message._remainingMilliSeconds / 1000);
        if (message._remainingMilliSeconds < 0){
          message._expired = true;
        }
      });
    });
    
    $scope.$apply(function(){
      $scope.messages = $scope.messages.filter(function(message){
        return !message._expired;
      });
    });
  },1000);
    
    
  var timerSocketCheck =   setInterval(function(){
    $scope.connected = socket.connected;
    if (!socket.connected && !$scope.disconnectScheduled){
      refreshSocket();
    }
  },1000);


    
  $scope.$on("$destroy", function() {
    if (timerMessageDecay) {
        clearInterval(timerMessageDecay);
    }
    if (timerMessageReload) {
        clearInterval(timerMessageReload);
    }
    if (timerSocketCheck) {
      clearInterval(timerSocketCheck);
    }
    stopWatchingLogin();
    disconnectSocket();
  });

  
  











  // no side effects from here on down:

  $scope.hasNewMessages = function(){
    return ($scope.newMessageStack.length > 0);
  };

  $scope.hasMessages = function(){
    return (($scope.messages.length > 0) || ($scope.hasNewMessages()))  ;
  };

  var getRecentMessages = function(params,aborter,callback){
    var res;
    if (params.maxId){
      res = $resource('/loadRecentMessages?maxId=:maxId&latitude=:latitude&longitude=:longitude&radius=:radius&count=:count&hashTag=:hashTag&secretString=:secretString',{},{
        timeout: aborter.promise
      });
    }
    else {
      res = $resource('/loadRecentMessages?latitude=:latitude&longitude=:longitude&radius=:radius&count=:count&hashTag=:hashTag&secretString=:secretString',{},{
        timeout: aborter.promise
      });
    }
    
    return res.query(params,callback);
  };




  var ascendingDateOrderer = function(itemA,itemB){
    if (itemA.timestamp < itemB.timestamp){
      return -1;
    }
    else {
      return 1;
    }
  };

  var descendingDateOrderer = function(itemA,itemB){
    if (itemA.timestamp < itemB.timestamp){
      return 1;
    }
    else {
      return -1;
    }
  };




  
}]);



