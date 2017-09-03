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
  res.write('BOUNDED_BUZZ_BASE_URL='+'"' + config.host +  '";');
  res.end();
});



app.use('/upload', jwtCheck);
app.post('/upload', function(req,res,next){
  	res.json(res.emsUploadData);
    next();
});


app.use('/send-geo-secret', jwtCheck);
app.post('/send-geo-secret', function(req,res,next){
  var data = req.body;

  var jwtToken = auth0Helper.getJWTToken(req);
  auth0.tokens.getInfo(jwtToken, function(err, userInfo){

    var messageData = {
      messageType: data.messageType,
      messageSecret: data.messageSecret,
      payloadId: data.payloadId,
      message: data.message,
      myUserId: userInfo.user_id,
      displayName: userInfo.given_name,
      profileImageUrl: userInfo.picture,
      lat: data.position.latitude,
      lon: data.position.longitude,
      visibilityRadius: data.visibilityRadius,
      timestamp: Date.now()
    };

    if (data.messageType === 'video'){
      messageData.isReady = false;
      chatIndex.indexMessage(messageData);
      expressMediaServer.announceMediaForTranscoding(messageData.payloadId, messageData);
      res.end();
      
    }
    else if (data.messageType === 'image'){
      expressMediaServer.executeTranscodingJob(messageData.payloadId, function(){
        messageData.isReady = true;
        chatIndex.indexMessage(messageData, function(){
          res.json({'image':'finished'});
          res.end();
        });
      });
    }
    else
    {
      messageData.isReady = true;
      chatIndex.indexMessage(messageData, function(){
        res.end();
      });
    }


  });

});



app.use('/delete-geo-secret', jwtCheck);
app.post('/delete-geo-secret', function(req,res,next){
  var data = req.body;

  var jwtToken = auth0Helper.getJWTToken(req);
  auth0.tokens.getInfo(jwtToken, function(err, userInfo){

    chatIndex.getMessage(data.geoSecretId, function(messageData){
      console.log('this is what we got back');
      console.log(messageData);
      if (messageData._source && (messageData._source.myUserId === userInfo.user_id)){
        chatIndex.deleteMessage(messageData._id);
        expressMediaServer.deleteMedia(messageData._source.payloadId);
      }
      else {
        console.log('preventing unauthroized delte, or message was not there...');
      }
      
      res.json({'ok':true});
      res.end();
    });


  });

});





var httpsServer = https.createServer(credentials, app);
httpsServer.listen(config.sslPort);


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
  chatIndex.indexMessage( messageData );
});



