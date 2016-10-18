'use strict';


angular.module('chatApp').controller('AboutController', 
['$location','$scope','$window', 
function($location,$scope,$window) {

  $scope.chat="inside the chat controller.";
  
  $scope.clickLoginAuth0FromAbout = function(){
      $scope.clickLoginAuth0(function(){
          $location.url('/chat');
      });
  };
  
  $scope.tabs = [
                 { title:'Dynamic Title 1', content:'Dynamic content 1' },
                 { title:'Dynamic Title 2', content:'Dynamic content 2', disabled: true }
               ];

               $scope.alertMe = function() {
                 setTimeout(function() {
                   $window.alert('You\'ve selected the alert tab!');
                 });
               };
  
  
  
}]);



