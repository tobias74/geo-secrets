module.exports = function(options){
  var methods = {};

  var client = options.client;
  var indexName = options.indexName;
  var extend = require('extend');


  var _ = require('underscore');
  var util = require('util');


  var searchServersSubscriptionsForMessage = function(data,callback){

    if (data.lat === undefined || data.lon === undefined){
    	console.log('given wrong location');
    	//throw new Error('wrong location');
    	callback([]);
    }

    var request = {
      searchType: "count",
      index: indexName,
      type: 'subscriptions',
      body: {
        from:0,
        size:99999,
        query: {
          filtered: {
            query:{
              match_all: {}
            },
            filter: {
              bool: {
                must: [

                  {
                    geo_shape: {
                      location: {
                        shape: {
                          type: 'point',
                          coordinates: [
                            data.lon,
                            data.lat
                          ]
                        }
                      }
                    }
                  },

                  {
                    geo_distance: {
                      distance: data.visibilityRadius,
                      pin: {
                        lat: parseFloat(data.lat),
                        lon: parseFloat(data.lon)
                      }
                    }
                  },
                  {
                    or: [
                     {
                       terms: {
                         subscribedToTags: data.message.split(" ")
                       }
                     },
                     {
                       missing: {
                         field: "subscribedToTags"
                       }
                     }

                    ]
                  }
                ]
              }
            }
          }
        },
        aggregations: {
          subscribedServers:{
            terms:{
              field: "serverId"
            }
          }
        }
      }
    };


    if (data.messageSecret){
      //console.log('we message secret');
      //console.log(data.messageSecret);
      request.body.query.filtered.filter.bool.must.push({
          terms: {
            messageSecret: data.messageSecret
          }
      });
    }



    client.search(request, function(error, response){
      callback(response.aggregations.subscribedServers.buckets.map(function(item){
          return {
          	serverId: item.key,
          	countSubscriptions: item.doc_count
          };
        }));
    });
  };
  methods.searchServersSubscriptionsForMessage = searchServersSubscriptionsForMessage;




  var searchSubscriptionsForMessageAndServer = function(data,callback){

    if (data.lat === undefined || data.lon === undefined){
    	console.log('given wrong location, but we cannot throw an exception here inside all these callbacks.');
    	//throw new Error('wrong location');
    	callback([]);
    }


    var request = {
      index: indexName,
      type: 'subscriptions',
      body: {
        from:0,
        size:9999,
        fields : [ "_source" ],
        query: {
          filtered: {
            query:{
              match_all: {}
            },
            filter: {
              bool: {
                must: [
                  {
                    term: {
                      serverId: data.serverId
                    }
                  },

                  {
                    geo_shape: {
                      location: {
                        shape: {
                          type: 'point',
                          coordinates: [
                            data.lon,
                            data.lat
                          ]
                        }
                      }
                    }
                  },
  

                  {
                    geo_distance: {
                      distance: data.visibilityRadius,
                      pin: {
                        lat: parseFloat(data.lat),
                        lon: parseFloat(data.lon)
                      }
                    }
                  },
                  {
                    or: [
                     {
                       terms: {
                         subscribedToTags: data.message.split(" ")
                       }
                     },
                     {
                       missing: {
                         field: "subscribedToTags"
                       }
                     }

                    ]
                  }
                ]
              }
            }
          }
        }
      }
    };

    if (data.messageSecret){
      //console.log('we message secret2222');
      //console.log(data.messageSecret);
      request.body.query.filtered.filter.bool.must.push({
          terms: {
            messageSecret: data.messageSecret
          }
      });
    }


    client.search(request , function(error, response){
      if (error) {
        console.log(error);
      }
      var subscriptions = response.hits.hits.map(function(item){
          return item._source
      });
      subscriptions = _.uniq(subscriptions, function(subscription){
        return subscription.sessionId;
      });





      callback(subscriptions);

    });
  };
  methods.searchSubscriptionsForMessageAndServer = searchSubscriptionsForMessageAndServer;







  var searchSubscriptionsForMessage = function(data,callback){

    if (data.lat === undefined || data.lon === undefined){
    	console.log('given wrong location');
    	//throw new Error('wrong location');
    	callback([]);
    }

    var request = {
      index: indexName,
      type: 'subscriptions',
      body: {
        from:0,
        size:9999,
        query: {
          filtered: {
            query:{
              match_all: {}
            },
            filter: {
              bool: {
                must: [

                  {
                    geo_shape: {
                      location: {
                        shape: {
                          type: 'point',
                          coordinates: [
                            data.lon,
                            data.lat
                          ]
                        }
                      }
                    }
                  },

                  {
                    geo_distance: {
                      distance: data.visibilityRadius,
                      pin: {
                        lat: parseFloat(data.lat),
                        lon: parseFloat(data.lon)
                      }
                    }
                  },
                  {
                    or: [
                     {
                       terms: {
                         subscribedToTags: data.message.split(" ")
                       }
                     },
                     {
                       missing: {
                         field: "subscribedToTags"
                       }
                     }

                    ]
                  }
                ]
              }
            }
          }
        }
      }
    };


    if (data.messageSecret){
      //console.log('we message secret');
      //console.log(data.messageSecret);
      request.body.query.filtered.filter.bool.must.push({
          terms: {
            messageSecret: data.messageSecret
          }
      });
    }



    client.search(request, function(error, response){
      if (error){
        console.log(error);
      }

      callback(response.hits.hits.map(function(item){
        return extend({}, item._source, item.fields, {_id:item._id});
      }));

      
    });
  };
  methods.searchSubscriptionsForMessage = searchSubscriptionsForMessage;


  return methods;
};
