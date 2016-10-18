'use strict';


angular.module('chatApp').controller('IndexController', 
['$location','$scope', 
function($location,$scope) {

  $scope.chat="inside the chat controller.";
  
}]);



