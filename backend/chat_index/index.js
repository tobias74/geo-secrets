
var config = require('../config.js');

var elasticsearch = require('elasticsearch');
var elasticsearchClient = new elasticsearch.Client({
  host: config.elasticsearchUrl + ':9200',
  log: 'error'
});

var endsWith = function(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
};

var extend = require('extend');

var esMaintenance = require('./es-maintenance.js');

var indexMessagesName = config.elasticsearchPrefix + "_geomessages";








var indexMessage = function(data){
  var client = elasticsearchClient;
  var indexName = indexMessagesName;

  var myVisibilityRadius;

  if (endsWith(data.visibilityRadius,'km')){
    myVisibilityRadius = parseFloat(data.visibilityRadius.substr(0,data.visibilityRadius.length-2));
  }
  else if (endsWith(data.visibilityRadius,'m')){
    myVisibilityRadius = parseFloat(data.visibilityRadius.substr(0,data.visibilityRadius.length-1)) / 1000;
  }


  client.index({
    index: indexName,
    type: 'messages',
    id: data.id,
    body: {
      isReady: data.isReady,
      displayName: data.displayName,
      myUserId: data.myUserId,
      message: data.message,
      messageType: data.messageType,
      messageSecret: data.messageSecret,
      payloadId: data.payloadId,
      profileImageUrl: data.profileImageUrl,
      timestamp: data.timestamp,
      location: {
        lat: data.lat,
        lon: data.lon
      },
      visibility: {
        type: "circle",
        coordinates: [data.lon, data.lat],
        radius: data.visibilityRadius
      },
      radius: myVisibilityRadius
    }
  }, function (error,reponse){
    if (error) {
      console.log(error);
    }
  });

};


var deleteMessage = function(messageId, callback){
  if (!messageId){
    console.log('why are you trying to delete messageId without anything???');
    return;
  }
  var client = elasticsearchClient;
  var indexName = indexMessagesName;

  client.delete({
    index: indexName,
    type: 'messages',
    id: messageId
  }, function(error, response){
    if (error){
      console.log(error);
    }
    else {
      callback && callback(response);
    }

  });

};


var getMessage = function(messageId, callback){
  if (!messageId){
    console.log('why are you trying to get messageId without anything???');
    return;
  }
  var client = elasticsearchClient;
  var indexName = indexMessagesName;

  client.get({
    index: indexName,
    type: 'messages',
    id: messageId
  }, function(error, response){
    if (error){
      console.log(error);
    }
    callback(response);

  });

};






var searchRecentMessagesWithinRadius = function(data,callback){
  var client = elasticsearchClient;
  var indexName = indexMessagesName;

  console.log(data.radius);

  var size;
  if (data.count){
    size = data.count;
  }
  else {
    size = 100;
  }

  var request = {
    index: indexName,
    type: 'messages',
    body: {
      sort: {
        timestamp: {
          order: "desc"
        }
      },
      from: 0,
      size: size,
      fields: ["_source"],
      query: {
        filtered: {
          query:{
            match_all: {}
          },
          filter: {
            bool: {
              must: [
                {
                        geo_distance: {
                          distance: data.radius,
                          location: {
                            lat: parseFloat(data.lat),
                            lon: parseFloat(data.lon)
                          }
                        }
                },

                {
                  term: {
                    isReady: true
                  }
                },


                {
                  geo_shape: {
                    visibility: {
                      shape: {
                        type: 'point',
                        coordinates: [
                          data.lon,
                          data.lat
                        ]
                      }
                    }
                  }
                }


              ]
            }
          }
        }
      }
    }
  };




  if (data.messageSecret){
    //console.log('we have a message secret!!!!!!!!!°');
    //console.log(data.messageSecret);
    request.body.query.filtered.filter.bool.must.push({
        terms: {
          messageSecret: data.messageSecret
        }
    });
  }
  else{
    //console.log('we have nooooo?????????????????????????????????????????????????? message secret');
    request.body.query.filtered.filter.bool.must.push(                   {
      missing: {
        field: "messageSecret"
      }
    });
  }


  client.search(request, function(error, response){
    if (error){
      console.log(error);
    }

    if (!response.hits){
      console.log('error searching messages? just restarted?');
      callback([]);
    }
    else{
      callback(response.hits.hits.map(function(item){
        return extend({}, item._source, item.fields, {_id:item._id});
      }));
    }
  });
};



























console.log('creating indices in elasticsearch');
esMaintenance.createMessagesIndex(elasticsearchClient, indexMessagesName);

exports.indexMessage = indexMessage;
exports.getMessage = getMessage;
exports.deleteMessage = deleteMessage;
exports.searchRecentMessagesWithinRadius = searchRecentMessagesWithinRadius;



