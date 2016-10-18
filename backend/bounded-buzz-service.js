module.exports = function(dependencies){
    
  var redis = require('redis');
  var config = require('./config');
    
  var redisClient = redis.createClient(config.redisPort, config.redisUrl);
    
    
  var getTimestampedSortableId = function(callback){

    var pad = function (n, width, z) {
      z = z || '0';
      n = n + '';
      return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    };

    redisClient.incr('message:id', function(err,value){

      var newId = [ Date.now(), pad(value % 100,3, 0)].join('');
      console.log('this is what we get from redis as unique id: ' + newId);
      callback(newId);
    });
  };
    
    
  return {
    getTimestampedSortableId: getTimestampedSortableId
  };
};