'use strict';

angular.module('chatApp').factory('ApiService', function($http){
  return {
    
    sendGeoSecret: function(messageData, callback){
        $http.post('/send-geo-secret',messageData).then(function(data){
            console.log(data);
            callback && callback(data);
        });
    },
    
  };
  
});




