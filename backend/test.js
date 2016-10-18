var redis = require('redis');

var client = redis.createClient();

client.subscribe("firstserver");
client.on("message", function(channel,message){
	console.log(message);
});




