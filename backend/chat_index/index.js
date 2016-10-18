
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
var indexSubscriptionsName = config.elasticsearchPrefix + "_geosubscriptions";



var subscriptions = require('./subscriptions.js')({
  client: elasticsearchClient,
  indexName: indexSubscriptionsName,
});




var deleteSubscription = function(sessionId){
  if (!sessionId){
    console.log('why are you trying to delete sessionId without anything???');
    return;
  }
  var client = elasticsearchClient;
  var indexName = indexSubscriptionsName;

  client.search({
    index: indexName,
    type: 'subscriptions',
    body: {
      query: {
        filtered: {
          filter: {
            term: {
              sessionId: sessionId
            }
          }
        }
      }
    }
  }, function(error, response){
    if (error){
      console.log(error);
    }
    var items = response.hits.hits;


    items.forEach(function(item){
      client.delete({
        index: indexName,
        type: 'subscriptions',
        id: item._id
      }, function (error, response) {
        if (error){
          console.log("could not delete subscrition " + error);
        }
      });
      
    });

  });

};



var indexSubscription = function(data){
  if (!data.sessionId){
    console.log('we did not get a session id?????????????????????????????????????????????????????');
    return;
  }
  console.log('Indexing subscription------------------------------------------------------------------------------------------');
  console.log(data.gcmSubscriptionId);
  
  var client = elasticsearchClient;
  var indexName = indexSubscriptionsName;
	var mySubscriptionRadius;

  if (data.subscriptionRadius)
  {
  	if (endsWith(data.subscriptionRadius,'km')){
  	  mySubscriptionRadius = parseFloat(data.subscriptionRadius.substr(0,data.subscriptionRadius.length-2));
  	}
  	else if (endsWith(data.subscriptionRadius,'m')){
      mySubscriptionRadius = parseFloat(data.subscriptionRadius.substr(0,data.subscriptionRadius.length-1)) / 1000;
  	}
  }


  client.search({
    index: indexName,
    type: 'subscriptions',
    body: {
      query: {
        filtered: {
          filter: {
            term: {
              sessionId: data.sessionId
            }
          }
        }
      }
    }
  }, function(error, response){
    if (error){
      console.log(error);
    }
    var items = response.hits.hits;
    if (items.length === 1){
  	  client.update({
	      index: indexName,
	      type: 'subscriptions',
	      id: items[0]._id,
	      body: {
	      	doc:{
	      	    sessionId: data.sessionId,
	      	    serverId: data.serverId,
	      	    gcmSubscriptionId: data.gcmSubscriptionId,
		          myUserId: data.myUserId,
		          subscribedToTags: data.subscribedToTags,
		          messageSecret: data.messageSecret,
		          pin: {
		          	lat: data.lat,
		          	lon: data.lon
		          },
  		        location: {
  		          type: "circle",
  		          coordinates: [data.lon, data.lat],
  		          radius: data.subscriptionRadius
  		        },
  		        radius: mySubscriptionRadius
	      	},
	      	doc_as_upsert: false
	      }
	    }, function (error,reponse){
        if (error){
          console.log("we had an error indexing a subscription " + error);
        }
	    });
    }
    else
    {
	    if (items.length > 1){
   	 	  console.log('deleting too many subscriptions subscription');
		    deleteSubscription(data.sessionId);
	    }

	    //console.log('indexing new subscription');
  	    client.index({
	      index: indexName,
	      type: 'subscriptions',
	      body: {
	        sessionId: data.sessionId,
     	    serverId: data.serverId,
    	    gcmSubscriptionId: data.gcmSubscriptionId,
	        myUserId: data.myUserId,
          subscribedToTags: data.subscribedToTags,
          messageSecret: data.messageSecret,
	        pin: {
	        	lat: data.lat,
	        	lon: data.lon
	        },
	        location: {
	          type: "circle",
	          coordinates: [data.lon, data.lat],
	          radius: data.subscriptionRadius
	        },
          radius: mySubscriptionRadius
	      }
	    }, function (error,reponse){
        if (error){
          console.log("we had an error indexing a subscription position two " + error);
        }

	    });

    }
  });


};





































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
      publishAtTimestamp: data.publishAtTimestamp,
      expiresAt: data.expiresAt,
      isReady: data.isReady,
      displayName: data.displayName,
      myUserId: data.myUserId,
      message: data.message,
      messageType: data.messageType,
      messageSecret: data.messageSecret,
      payloadId: data.payloadId,
      profileImageUrl: data.profileImageUrl,
      timestampedSortableId: data.timestampedSortableId,
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
                  range: {
                    publishAtTimestamp: {
                      lt: (new Date().getTime())
                    }
                  }
                },
                
                {
                  range: {
                    expiresAt: {
                      gt: (new Date().getTime())
                    }
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


  if (data.maxId){
    console.log('this is the maxId we use:' + data.maxId);
    request.body.query.filtered.filter.bool.must.push({
        range: {
          'timestampedSortableId': {
            'lte': data.maxId
          }
        }
    });
  }

  if (data.hashTag){
    //console.log(data.hashTag);
    request.body.query.filtered.filter.bool.must.push({
        terms: {
          message: data.hashTag
        }
    });
  }

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
















var searchExpiredMessages = function(data,callback){
  var client = elasticsearchClient;
  var indexName = indexMessagesName;


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
          order: "asc"
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
                  range: {
                    expiresAt: {
                      lt: (new Date().getTime())
                    }
                  }
                },
                
                {
                  term: {
                    isReady: true
                  }
                }

              ]
            }
          }
        }
      }
    }
  };


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
esMaintenance.createSubscriptionsIndex(elasticsearchClient, indexSubscriptionsName);


exports.indexMessage = indexMessage;
exports.getMessage = getMessage;
exports.deleteSubscription = deleteSubscription;
exports.deleteMessage = deleteMessage;
exports.indexSubscription = indexSubscription;
exports.searchRecentMessagesWithinRadius = searchRecentMessagesWithinRadius;
exports.searchServersSubscriptionsForMessage = subscriptions.searchServersSubscriptionsForMessage;
exports.searchSubscriptionsForMessageAndServer = subscriptions.searchSubscriptionsForMessageAndServer;
exports.searchSubscriptionsForMessage = subscriptions.searchSubscriptionsForMessage;
exports.searchExpiredMessages = searchExpiredMessages;



