





var createMessagesIndex = function(client,indexName){
  client.indices.create({
    index: indexName,
    body: {
      settings: {
        number_of_shards: 3,
        number_of_replicas: 0,

        analysis : {
            filter : {
                tweet_filter : {
                    type : "word_delimiter",
                    type_table: ["# => ALPHA", "@ => ALPHA"]
                }
            },
            analyzer : {
                tweet_analyzer : {
                    type : "custom",
                    tokenizer : "whitespace",
                    filter : ["tweet_filter"]
                }
            }
        }

      },
      mappings: {
        messages: {
          properties: {
            timestamp: {
              type: "date"
            },
            timestampedSortableId : {
              type: "long",
              index : "not_analyzed"
            },
            myUserId: {
              type: "string",
              index: "not_analyzed"
            },
            profileImageUrl: {
              type: "string",
              index: "not_analyzed"
            },
            displayName: {
              type: "string"
            },
            message: {
              type: "string",
              analyzer : "tweet_analyzer"
            },
            messageType: {
              type: "string",
              index: "not_analyzed"
            },
            messageSecret: {
              type: "string",
              index: "not_analyzed"
            },
            payloadId: {
              type: "string",
              index: "not_analyzed"
            },
            payloadType: {
              type: "string",
              index: "not_analyzed"
            },
            location: {
              type: "geo_point",
              lat_lon: true,
              geohash: true,
              geohash_precision: "1m",
              geohash_prefix: true
            },
            radius: {
              type: "float"
            },
            publishAtTimestamp: {
              type: "date"
            },
            expiresAt: {
              type: "date"
            },
            isReady:{
              type: "boolean"
            },
            visibility: {
              precision: "1m",
              tree: "quadtree",
              type: "geo_shape"
            }
          }
        }
      }
    }
  }, function(error, response){
    console.log('response in creating indecies ' + error);
  });
};



var createSubscriptionsIndex = function(client,indexName){
  client.indices.create({
    index: indexName,
    body: {
      settings: {
        number_of_shards: 3,
        number_of_replicas: 0,
        analysis : {
            filter : {
                tweet_filter : {
                    type : "word_delimiter",
                    type_table: ["# => ALPHA", "@ => ALPHA"]
                }
            },
            analyzer : {
                tweet_analyzer : {
                    type : "custom",
                    tokenizer : "whitespace",
                    filter : ["tweet_filter"]
                }
            }
        }
      },
      mappings: {
        subscriptions: {
          properties: {
            sessionId: {
              type: "string",
              index: "not_analyzed"
            },
            timestamp: {
              type: "date"
            },
            serverId: {
              type: "string",
              index: "not_analyzed"
            },
            gcmSubscriptionId: {
              type: "string",
              index: "not_analyzed"
            },
            myUserId: {
              type: "string",
              index: "not_analyzed"
            },
            subscribedToTags: {
              type: "string",
              analyzer : "tweet_analyzer"
            },
            messageSecret: {
              type: "string",
              index: "not_analyzed"
            },
            pin: {
              type: "geo_point",
              lat_lon: true,
              geohash: true,
              geohash_precision: "1m",
              geohash_prefix: true
            },
            location: {
              precision: "1m",
              tree: "quadtree",
              type: "geo_shape"
            },
            radius: {
              type: "float"
            }
          }
        }
      }
    }
  }, function(error, response){

  });
};


exports.createMessagesIndex = createMessagesIndex;
exports.createSubscriptionsIndex = createSubscriptionsIndex;
