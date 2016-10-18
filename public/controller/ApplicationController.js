'use strict';


angular.module('chatApp').controller('ApplicationController', 
['$location','$scope','$route','$resource','$http','ResponsiveService','FileUploader','$rootScope','store','auth', 
function($location,$scope,$route,$resource,$http,ResponsiveService,FileUploader,$rootScope,store, auth) {

  console.debug('Loading Application COntoller +++++++++++++++++++++++++++++++++++++++++++++++++++');
  


  $scope.clickLoginAuth0 = function(callback){

    auth.signin({popup: true}, function(profile, token){
      // console.log('this is our token: ' + token);
      callback && callback();
    }, function(err){
      // If anything goes wrong
    });

  };


  $scope.clickLogoutAuth0 = function(){
    console.log('click logout');
    auth.signout();
  };
  





  $scope.applicationTitle = "bounded.buzz";                         




  $scope.baseUrl = BOUNDED_BUZZ_BASE_URL;

  $scope.isLargeDevice = ResponsiveService.isLargeDevice;
  $scope.isSmallDevice = ResponsiveService.isSmallDevice;
  $scope.isExtraSmallDevice = ResponsiveService.isExtraSmallDevice;
  $scope.isSuperSmallDevice = ResponsiveService.isSuperSmallDevice;

  $scope.$route = $route;

	


  
  

    


    
  if ('serviceWorker' in navigator) {
   console.log('Service Worker is supported!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1');
   navigator.serviceWorker.register('/service-workers/sw.js').then(function(reg) {
     console.log('--------------------------------------------------------- we instzalled the pushtihing###################################', reg);
     reg.pushManager.subscribe({
        userVisibleOnly: true
      }).then(function(sub) {
        console.log('endpoint:', sub.endpoint);
        var subscriptionId = (sub.endpoint.split("/").slice(-1))[0];
        console.debug('this is our subscription ID which we will want to send to the server: ' +  subscriptionId);

        $http.post('/gcm-subscription-id',{
          'gcmSubscriptionId': subscriptionId
        }).success(function(result){
          console.debug('sent gcm subscription id');
          console.debug(result);  
        });

      });
      
      
     
     
   }).catch(function(err) {
     console.log(':^(', err);
   });
  }  
  
  
  
}]);



