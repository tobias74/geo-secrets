
module.exports = function(app, options){
  var pathPrefix = options.pathPrefix || '/';
  
  var formidable = require('formidable');
  var async = require('async');

  var mediaTranscoder=require('./media-transcoder')(options);

  var originalMediaStorage = require('./original-media-storage')(options);
  
  
  

  app.get(pathPrefix + 'getImageViaCache/:size/:imageId', function(req, res, next){
    
    var imageId = req.params.imageId;
    var imageSize = req.params.size;
  
  
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=345600"); // 4 days
    res.setHeader("Expires", new Date(Date.now() + 345600000).toUTCString());
  
    mediaTranscoder.getImageStreamFromCache(imageId, imageSize, function(readstream){
      if (!readstream.pipe) {
        console.log(readstream);
        res.end();
      }
      else {
        readstream.pipe(res);
      }
    });

  });
  
  
  app.post('/upload', function (req, res, next){
    var form = new formidable.IncomingForm();
  
    form.parse(req, function(err, fields, files) {
      //res.json({fields: fields, files: files});
      //res.end();
    });
  
    form.on('end', function() {
      
      console.log('in upload opendFIles');
      console.log(this.openedFiles);
      
      var transcodingCommands = this.openedFiles.map(function(file){
        return function(callback){
          var temp_path = file.path;
          var file_name = file.name;
          var file_type = file.type;

          originalMediaStorage.storeOriginalMedia(temp_path, file_type, function(data){
            callback(null,{
          	  fileId: data.fileId,
          	  fileType: file_type,
          	  payloadType: (file_type.substring(0,5) == 'video') ? 'video' : 'image'
            });

          });
          
        };
      });
      
      async.series(transcodingCommands, function(error, results){
        res.emsUploadData = results;
      	next();
      });

    });
  });
  
  
  

  app.get('/transcodedVideo/:format/:payloadId',function(req, res, next){
  
    mediaTranscoder.findTranscodedVideo(req.params.payloadId, function(transcodedVideoData){
      console.log('in app find transcoded...');
      if (!transcodedVideoData){
        console.log('did not find transcoded-vide-data');
        res.end();
        return;
      }
      console.log(transcodedVideoData);
      var fileId = String(transcodedVideoData[req.params.format]);
      console.log(fileId);
      mediaTranscoder.getVideo(fileId, function(error, media){
        console.log(media);
        if ((error) || media.length == 0)
        {
          console.log('could not get video.');
          console.log(error);
          res.end();
          return;
        }
        console.log('goiing on,,  there was no error.');
        var range = req.headers.range;
        if (range)
        {
          console.log('we have range....');
          var positions = range.replace(/bytes=/, "").split("-");
          var start = parseInt(positions[0], 10);
          var total = media.length;
          var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
          var chunksize = (end - start) + 1;
  
          console.log('RANGE: ' + start + ' - ' + end + ' = ' + chunksize);
  
          res.writeHead(206, {
            "Content-Range": "bytes " + start + "-" + end + "/" + total,
            "Accept-Ranges": "bytes",
            "Content-Length": chunksize,
            "Content-Type": media.contentType
          });
  
          var rangeStream = mediaTranscoder.getRangedVideoStream(fileId, {start:start, end: end});
          rangeStream.on('error', function(){
            console.log('error occureed');
          });
          console.log(rangeStream);
          rangeStream.pipe(res);
  
        }
        else
        {
          console.log('we dont have ranges.');
          res.writeHead(200, { 'Content-Length': media.length, 'Content-Type': media.contentType });
          var mediaStream = media.stream(true);
          mediaStream.pipe(res);
        }
      });
    });
  
  });
  
  
  app.get(pathPrefix + 'test1234', function (req, res) {
    res.send('Hello 12345678');

  });

  return {
    
    announceMediaForTranscoding: mediaTranscoder.announceMediaForTranscoding,

    startListeningForTranscodingJobs: function(callback){
      var amqp = require('amqplib/callback_api');
      
      
      amqp.connect('amqp://' + options.rabbitMqUser + ':' + options.rabbitMqPassword + '@' + options.rabbitMqUrl, function(err, conn) {
        if (err){
          console.log(err);
        }
        
        [options.converterQueueNameImages, options.converterQueueNameVideos].forEach(function(queueName){
          conn.createChannel(function(err, ch) {
            if (err){
              console.log(err);
            }
            ch.assertQueue(queueName, {durable: true});
            ch.prefetch(1);
            
            console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queueName);
  
            ch.consume(queueName, function(msg) {
              console.log(" [x] Received %s", msg.content.toString());
              var rabbitData = JSON.parse(msg.content.toString());
              mediaTranscoder.executeTranscodingJob(rabbitData.mediaId, function(){
                callback(rabbitData.bundleData);
                ch.ack(msg);
              });
            }, {noAck: false});    
          });
        });

      });
    },
    
    deleteMedia: function(mediaId){
      originalMediaStorage.getMedia(mediaId, function(err, mediaFile){
        console.log('this should be deleted');
        console.log(mediaFile);
        if (!mediaFile){
          console.log('datbase icositency,....');
          return;
        }
        
        originalMediaStorage.deleteMedia(mediaId);
        
        var simpleType = mediaFile.contentType.substring(0,5).toLowerCase();
        
        
        if (simpleType === 'image'){
          mediaTranscoder.deleteCachedImage(mediaId);
        }
        else if (simpleType === 'video') {
          mediaTranscoder.deleteTranscodedVideos(mediaId);
        }
        else {
          console.log('wrong file type?');
        }
        
        
      });
    }
  };


  
};