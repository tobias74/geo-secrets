var facebookProfileImage = function(req, res, next){
	console.log('in facebookprofileimage');	


	  var mimeTypes = [
	    'image/gif',
	    'image/jpeg',
	    'image/png',
	    // Common typos
	    'image/jpg',
	  ];


      var retrieve = function (remote) {
        if (!remote)
        {
          console.log('url was false......');
          return res.status(404).send('url was undfiend or false');
        }
        var parts = url.parse(remote);
        if (parts.protocol !== 'http:' && parts.protocol !== 'https:') {
          return res.status(404).send('Expected URI scheme to be HTTP or HTTPS');
        }
        if (!parts.hostname) {
          return res.status(404).send('Expected URI host to be non-empty');
        }

        var agent = parts.protocol === 'http:' ? http : https;
        
        var request = agent.get(parts, function (response) {
            if ((response.statusCode === 301 || response.statusCode === 302) && response.headers['location']) {
              var redirect = url.parse(response.headers['location']);
              if (!redirect.protocol) {
                redirect.protocol = parts.protocol;
              }
              if (!redirect.hostname) {
                redirect.hostname = parts.hostname;
              }
              if (!redirect.port) {
                redirect.port = parts.port;
              }
              if (!redirect.hash) {
                redirect.hash = parts.hash;
              }
              return retrieve(url.format(redirect));
            }

            if (response.statusCode !== 200) {
              return res.status(404).send('Expected response code 200, got ' + response.statusCode);
            }

            var mimeType = (response.headers['content-type'] || '').replace(/;.*/, '');
            if (mimeTypes.indexOf(mimeType) === -1) {
              return res.status(404).send('Expected content type ' + mimeTypes.join(', ') + ', got ' + mimeType);
            }


			console.log('this is really it....');

            res.writeHead(200, {
              'Content-Type': mimeType,
              'Cache-Control': 'max-age=31536000, public', // 1 year
            });
			response.pipe(res);
            
          }).on('error', next);

        // Timeout after five seconds. Better luck next time.
        request.setTimeout(5000, function () {
          return res.status(504).send();
        });
      };

      chatIndex.searchUserByInternalId(req.params.userId, function(users){
        var user = users[0];
        if (user === undefined){
          retrieve('http://placehold.it/50x50');
        }
        else{
          if (user.provider === 'facebook'){
            retrieve('http://graph.facebook.com/' + users[0].facebookUserId + '/picture');
          }
          else if (user.provider === 'google'){
            retrieve(user.userImageUrl);
          }
          else {
            console.log('we did not get a provider???');
            console.log(user);
            retrieve('http://placehold.it/50x50');
          }
        }
      });
      
    //retrieve(req.params.userId);


	
};
