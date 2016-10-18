
var mod;

mod = angular.module('scroll-watch', []);

mod.value('THROTTLE_MILLISECONDS', 250);

mod.directive('scrollWatch', [
  '$rootScope', '$window', '$timeout', 'THROTTLE_MILLISECONDS', function($rootScope, $window, $timeout, THROTTLE_MILLISECONDS) {
    console.debug('insoide scrollwatch');
    return {
      scope: {
        scrollWatch: '=',
        reachedBottom: '&reachedBottom'
      },
      link: function(scope, elem, attrs) {
        $window = angular.element($window);

        var handler = function() {
            scope.scrollWatch.scrollTop = $(elem).scrollTop();
          
            if ( ($(elem).outerHeight() + $(elem).scrollTop()) >= $(elem)[0].scrollHeight)
            {
              scope.reachedBottom();
            }
        };

        var container = $(elem);
        
        scope.scrollWatch.doScrollTop = function(){
        	container.scrollTop(0);
        };
        
        var throttle = function(func, wait) {
          var later, previous, timeout;
          timeout = null;
          previous = 0;
          later = function() {
            var context;
            previous = new Date().getTime();
            $timeout.cancel(timeout);
            timeout = null;
            func.call();
            return context = null;
          };
          return function() {
            var now, remaining;
            now = new Date().getTime();
            remaining = wait - (now - previous);
            if (remaining <= 0) {
              clearTimeout(timeout);
              $timeout.cancel(timeout);
              timeout = null;
              previous = now;
              return func.call();
            } else {
              if (!timeout) {
                return timeout = $timeout(later, remaining);
              }
            }
          };
        };

        if (THROTTLE_MILLISECONDS != null) {
          handler = throttle(handler, THROTTLE_MILLISECONDS);
        }

        container.scroll(handler);

        scope.$on('$destroy', function() {
          return container.off('scroll', handler);
        });
        
      }
    };
  }
]);
