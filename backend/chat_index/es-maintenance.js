





var createMessagesIndex = function(client,indexName){
  client.indices.create({
    index: indexName,
    body: {
      settings: {
        number_of_shards: 3,
        number_of_replicas: 0
      },
      mappings: {
        messages: {
          properties: {
            timestamp: {
              type: "date"
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
              type: "string"
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
            },
            radius: {
              type: "float"
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





exports.createMessagesIndex = createMessagesIndex;
