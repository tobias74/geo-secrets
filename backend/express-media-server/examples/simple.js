var express = require('express');
var app = express();
var expressMediaServer = require('../index')(app, {
  mongoDbUrl: "****",
  rabbitMqUrl: "*****",
  rabbitMqUser: "*****",
  rabbitMqPassword: "*****",
  converterQueueNameVideos: 'example_converter_queue_test_videos3',
  converterQueueNameImages: 'example_converter_queue_test_images3'

});

expressMediaServer.startListeningForTranscodingJobs(function(data){
    console.log('finished transcoding job with data');
    console.log(data);
});

app.get('/', function (req, res){
  var form = '<form action="/upload" enctype="multipart/form-data" method="post">' + 
             '<input multiple="multiple" name="uploadedFile" type="file" />' + 
             '<br><br><input type="submit" value="Upload" />' + 
             '</form>';
  res.end(form);
});

app.post('/upload', function(req,res,next){
  console.log(res.emsUploadData);
  
  res.emsUploadData.forEach(function(emsUploadData){
    expressMediaServer.announceMediaForTranscoding(emsUploadData.fileId, {'some':'my random data'});
  	console.log(emsUploadData.fileId);
  });
  
  var outputText = res.emsUploadData.map(function(emsUploadData){
  	if (emsUploadData.payloadType === 'image'){
    	return '<a href="/getImageViaCache/medium/' + emsUploadData.fileId + '">click for image</a>';
  	}
  	else if (emsUploadData.payloadType === 'video'){
    	return '<a href="/transcodedVideo/mp4/' + emsUploadData.fileId + '">click for video</a>';
  	}
  	else {
  	  return 'wrong filetype?';
  	}
  });
  
  res.send(outputText.join('<br>'));
});

app.listen(8080, function () {
  console.log('Example app listening on port 8080!');
});

