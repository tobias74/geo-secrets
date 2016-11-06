'use strict';

angular.module('chatApp').factory('ApiService', function($http){
  return {
    
    sendGeoSecret: function(messageData, callback){
        $http.post('/send-geo-secret',messageData).then(function(data){
            console.log(data);
            callback && callback(data);
        });
    },
    
    deleteGeoSecret: function(geoSecretId, callback){
        $http.post('/delete-geo-secret', {'geoSecretId':geoSecretId}).then(function(data){
            console.log(data);
            callback && callback(data);
        });
    }
    
  };
  
});




