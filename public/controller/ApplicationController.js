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
  





  $scope.applicationTitle = "geosecrets";                         




  $scope.baseUrl = BOUNDED_BUZZ_BASE_URL;

  $scope.isLargeDevice = ResponsiveService.isLargeDevice;
  $scope.isSmallDevice = ResponsiveService.isSmallDevice;
  $scope.isExtraSmallDevice = ResponsiveService.isExtraSmallDevice;
  $scope.isSuperSmallDevice = ResponsiveService.isSuperSmallDevice;

  $scope.$route = $route;


}]);



