'use strict';

angular.module('chatApp').factory('ResponsiveService', function(){
  return {
    
    getAttachmentFormat: function(){
      if (window.innerWidth <= 767)
      {
        return 'square';
      }
      else
      {
        return '4by3';
      }
    },
    
    
    isLargeDevice: function(){
      if (window.innerWidth >= 1200)
      {
        return true;
      }
      else
      {
        return false;
      }
    },
    
    isSmallDevice: function() {
      if ((window.innerWidth > 767) && (window.innerWidth < 1200))
      {
        return true;
      }
      else
      {
        return false;
      }
    },
    
    isExtraSmallDevice: function(){
      if (window.innerWidth <= 767)
      {
        return true;
      }
      else
      {
        return false;
      }
    },

    isSuperSmallDevice: function(){
      if (window.innerWidth <= 320)
      {
        return true;
      }
      else
      {
        return false;
      }
    }
    
    
  };
  
});




