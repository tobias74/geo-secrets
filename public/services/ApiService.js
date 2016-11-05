'use strict';

angular.module('chatApp').factory('ApiService', function($http){
  return {
    
    sendGeoSecret: function(messageData){
        $http.post('/send-geo-secret',messageData).then(function(data){
            console.log(data);
        });
    },
    
  };
  
});




