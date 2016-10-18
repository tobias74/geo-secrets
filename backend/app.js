var express = require('express');

var app = express();

var jwt = require('express-jwt');


var bodyParser = require('body-parser');
var config = require('./config');

var expressMediaServer = require('./express-media-server')(app, config);




var fs = require('fs');
var http = require('http');
var https = require('https');
var privateKey  = fs.readFileSync(config.sslPrivateKey, 'utf8');
var certificate = fs.readFileSync(config.sslCert, 'utf8');
var ca = fs.readFileSync(config.sslIntermediateCert, 'utf8');
var credentials = {key: privateKey, cert: certificate,ca: ca};











var chatIndex = require('./chat_index');
var geoTools = require('./geo_tools');




var AuthenticationClient = require('auth0').AuthenticationClient;

var auth0 = new AuthenticationClient({
  domain: config.auth0AccountUrl,
  clientId: config.auth0ClientId
});

var auth0Helper = require('./auth0-helper');





var jwtCheck = jwt({
  secret: new Buffer(config.auth0ClientSecret, 'base64'),
  audience: config.auth0ClientId
});

app.use('/api/v1/loveslips', jwtCheck);

app.get('/api/v1/loveslips', function (req, res) {
  res.send('Hello Loveslips here');
  console.log('this is my user:');
  console.log(req.user);

  var jwtToken = auth0Helper.getJWTToken(req);
  auth0.tokens.getInfo(jwtToken, function(err, userInfo){
    console.log(err);
    //console.log(userInfo);
  });

});




app.use(express.static(__dirname + '/../public'));








app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));


var loadRecentMessages = function(req, res, next){
	//console.log('-------------------------------------------------------------------');
	//console.log(req.query);
  var tagSplit;
  var secretSplit;

  if (req.query.hashTag){
    tagSplit = req.query.hashTag.split(" ");
  }
  else {
    tagSplit = undefined;
  }

  if (req.query.secretString){
  	secretSplit = req.query.secretString.split(" ");
    }
    else {
  	secretSplit = undefined;
    }


  var query = {
    lat: req.query.latitude,
    lon: req.query.longitude,
    hashTag: tagSplit,
    messageSecret: secretSplit,
    radius: req.query.radius
  };

  if (req.query.count){
    query.count = req.query.count;
  }

  if (req.query.maxId){
    query.maxId = req.query.maxId;
  }

  chatIndex.searchRecentMessagesWithinRadius(query,function(result){
    result.forEach(function(item){
      item.myDistance = geoTools.distance(req.query.latitude, req.query.longitude, item.location.lat, item.location.lon, 'K');
      //item.myDistance = item.calculatedDistance;
      item.location = undefined;
      item.visibility = undefined;
      item.facebookUserId = undefined;
      item.sessionId = undefined;
      item.messageSecret = undefined;
      item.id = item._id;
    });
    res.json(result);
    res.end();
  });
};

app.get('/loadRecentMessages', loadRecentMessages);




app.get('/environment.js',function(req, res, next){
  res.setHeader("content-type", "text/javascript");
  //fs.createReadStream('environments/' + config.jsenv).pipe(res);
  res.write('BOUNDED_BUZZ_FACEBOOK_APP_ID='+'"' + config.facebook.appID +  '";');
  res.write('BOUNDED_BUZZ_BASE_URL='+'"' + config.host +  '";');
  res.write('BOUNDED_BUZZ_GOOGLE_CLIENT_ID='+'"' + config.google.clientId +  '";');
  res.end();
});



app.post('/upload', function(req,res,next){
  	res.json(res.emsUploadData);
    next();
});



console.log("this is the redis-host " + config.redisUrl);


var boundedBuzzService = require('./bounded-buzz-service')({
  auth0: auth0,
  expressMediaServer: expressMediaServer,
});


var messagingService = require('./chat/messaging-service');


var chat = require('./chat')({
  boundedBuzzService: boundedBuzzService,
  auth0: auth0,
  expressMediaServer: expressMediaServer,
  messagingService: messagingService
});

var httpsServer = https.createServer(credentials, app);
httpsServer.listen(config.sslPort);

chat.startChat(httpsServer,credentials);




// Redirect from http to https
http.createServer(function (req, res) {
    console.log(req);
    res.writeHead(301, { "Location": "https://" + config.host + ":" + config.sslPort + req.url  });
    res.end();
}).listen(config.port);





console.log('startup webserver complete');


// rabbit sonsumer/////////////////////////////////////////////////////////////////////////////////////

expressMediaServer.startListeningForTranscodingJobs(function(messageData){
  messageData.isReady=true;
  messagingService.publishMessageTentatively(messageData);
});


setInterval(function(){
  chatIndex.searchExpiredMessages({}, function(expiredMessages){
    console.log('these are the expired messages:');
    console.log(expiredMessages);
    expiredMessages.forEach(function(message){
      chatIndex.deleteMessage(message._id, function(response){
        console.log('this is the delete message response');
        if (response.found && message.payloadId) {
          expressMediaServer.deleteMedia(message.payloadId);
        }
        
      });
      
    });
  });
},10*1000);