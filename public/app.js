'use strict';

var app = angular.module('chatApp', ['ngRoute','ngResource','angularFileUpload','ui.bootstrap','ngAnimate','scroll-watch','auth0', 'angular-storage', 'angular-jwt']).config(function($routeProvider) {
  $routeProvider.when('/chat', {
  	activeTab: 'chat',
    controller:'ChatController',
    templateUrl:'views/chat.html'
  }).when('/login', {
  	activeTab: 'login',
    controller:'LoginController',
    templateUrl:'views/login.html'
  }).when('/about', {
  	activeTab: 'about',
    controller:'AboutController',
    templateUrl:'views/about.html'
  }).when('/settings', {
  	activeTab: 'settings',
    controller:'SettingsController',
    templateUrl:'views/settings.html'
  }).otherwise({
    redirectTo:'/chat'
  });
}).factory('socketIO', function(){
  return io;
  //return socket;
}).directive('ngEnter', function() {
  return function(scope, element, attrs) {
    element.bind("keydown keypress", function(event) {
      if(event.which === 13) {
        scope.$apply(function(){
          scope.$eval(attrs.ngEnter, {'event': event});
        });

        event.preventDefault();
      }
    });
  };
});




app.filter('distance', function () {
  return function (input) {
      if (input >= 1) {
          return input.toFixed(3) + ' km';
      } else {
          return (input*1000).toFixed(1) + ' m';
      }
  };
});



app.config( function(authProvider) {
  authProvider.init({
      domain: 'tobiga.eu.auth0.com',
      clientID: 'wI51s2nV0OLcjzDiys3K5Uw9cYxvJcZw'
  }); 

  authProvider.on('logout', ['$rootScope', '$location', 'store', function($rootScope, $location, store) {
    store.remove('profile');
    store.remove('token');    
    $rootScope.myProfile = undefined;
    //$location.url('/');
  }]);  

  authProvider.on('loginSuccess', ['$rootScope', '$location', 'profilePromise', 'idToken', 'store', function($rootScope, $location, profilePromise, idToken, store) {
    profilePromise.then(function(profile){
      store.set('profile', profile);
      store.set('token', idToken);
      $rootScope.myProfile = profile;
      
      console.log(profile);

    });
    //$location.url('/');
  }]);  

  authProvider.on('authenticated', ['$rootScope', '$location', 'profilePromise', 'idToken', 'store', function($rootScope, $location, profilePromise, idToken, store ) {
    profilePromise.then(function(profile){
      store.set('profile', profile);
      store.set('token', idToken);
      $rootScope.myProfile = profile;
      
      console.log(profile);
      
    });
    //$location.url('/');
  }]);  
});

app.config(['$httpProvider', 'jwtInterceptorProvider', function($httpProvider, jwtInterceptorProvider) {

  jwtInterceptorProvider.tokenGetter = ['store', function(store) {
    return store.get('token');
  }]

  $httpProvider.interceptors.push('jwtInterceptor');
}]);



app.run(['$rootScope', 'auth', 'store', 'jwtHelper', '$location', function($rootScope, auth, store, jwtHelper, $location) {
  // Listen to a location change event
  $rootScope.$on('$locationChangeStart', function() {
    // Grab the user's token
    var token = store.get('token');
    // Check if token was actually stored
    if (token) {
      // Check if token is yet to expire
      if (!jwtHelper.isTokenExpired(token)) {
        // Check if the user is not authenticated
        if (!auth.isAuthenticated) {
          // Re-authenticate with the user's profile
          // Calls authProvider.on('authenticated')
          auth.authenticate(store.get('profile'), token);
        }
        else {
          console.log('we are authenticated!');
        }
      } else {
        // Either show the login page
        // $location.path('/');
        // .. or
        // or use the refresh token to get a new idToken
        auth.refreshIdToken(token);
      }
    }

  });
}]);




