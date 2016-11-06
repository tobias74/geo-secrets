'use strict';


angular.module('chatApp').controller('ChatController', 
['$location','$scope','$route','$resource','$http','ResponsiveService','FileUploader','$rootScope','$q','store','ApiService',
function($location,$scope,$route,$resource,$http,ResponsiveService,FileUploader,$rootScope,$q,store,ApiService) {
  
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
    ];
  $scope.mySubscriptionRange = $scope.ranges[4];
  $scope.myVisibilityRange = $scope.ranges[4];





  
  


  var stopWatchingLogin = $rootScope.$watch('myProfile', function(myProfile){
    if (!myProfile){
      console.debug('myProfile was undefined.. not acting on it now.');
    }
    else {
      console.debug('login status changed, refreshing socket');
      $scope.clickForRecentMessages();
    }
  });
  
  


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
      secretString: $scope.mySecretString,
      count: 20
    };

    if ($scope.myPosition.isValid){
      aborter = $q.defer();
      getRecentMessages(query, aborter, function(items){
          $scope.messages = items;
          $scope.messages.sort(descendingDateOrderer);
          $scope.finishedLoadingMessages = true;  
      });
    }
    
    
  };

  $scope.clickForRecentMessages = function(){
    // abort old request here.
    $scope.loadMessages();
  };

  

  

  $scope.$watch('myPosition',function(newPosition,oldPosition){
    console.debug('position has Changed...');
    console.debug(newPosition);
    console.debug(oldPosition);
    $scope.clickForRecentMessages();    
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
    
    ApiService.deleteGeoSecret(message.id);

    $scope.messages = $scope.messages.filter(function(innerMessage){
      return (message.id !== innerMessage.id);
    });

  };
  
  $scope.sendMessage = function(){
    if (($scope.messageInput != "") && ($scope.messageInput != undefined)){
      var messageData = {
          message: $scope.messageInput,
          messageType: "text",
          messageSecret: $scope.messageSecret,
          visibilityRadius: $scope.myVisibilityRange.value,
          position: {
            latitude: $scope.myPosition.coords.latitude,
            longitude: $scope.myPosition.coords.longitude
          }
      };
      
      console.debug('sending message');
      console.debug(messageData);


      ApiService.sendGeoSecret(messageData, $scope.loadMessages);

      
      $scope.messageInput = "";
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
      $scope.clickForRecentMessages();    
    }
  };




  $scope.uploader = new FileUploader({
    autoUpload:true,
    removeAfterUpload: true,
    url:'/upload',
    headers: {
      'Authorization': 'Bearer ' + store.get('token'),
    },
    onCompleteItem: function(item, response, status, headers){
      console.debug('image upload complete.');
      
      console.debug(response);

      $scope.buttonCaption = 'Upload Media';
  
      response.forEach(function(myResponse){
        var messageData = {
          message: '',
          messageType: myResponse.payloadType,
          messageSecret: $scope.messageSecret,
          payloadId: myResponse.fileId,
          payloadType: myResponse.payloadType,
          visibilityRadius: $scope.myVisibilityRange.value,
          position: {
            latitude: $scope.myPosition.coords.latitude,
            longitude: $scope.myPosition.coords.longitude
          }
        };
        
        console.debug(messageData);
  
        ApiService.sendGeoSecret(messageData, $scope.loadMessages);
      });
    },
    onAfterAddingFile: function(item){
      $scope.buttonCaption = 'Uploading...';
    }
  });

  $scope.buttonCaption = 'Upload Media';



  $scope.$watch('mySubscriptionRange',function(newValue, oldValue){
    $scope.myVisibilityRange = $scope.mySubscriptionRange;
    $scope.messages = [];
    $scope.newMessageStack = [];
    $scope.isScrolled = false;
    $scope.finishedLoadingMessages = false;  
    $scope.clickForRecentMessages();    
  });













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


  

    


    
  $scope.$on("$destroy", function() {
    if (timerMessageReload) {
        clearInterval(timerMessageReload);
    }
    stopWatchingLogin();
  });

  
  











  // no side effects from here on down:


  $scope.hasMessages = function(){
    return ($scope.messages.length > 0)  ;
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



