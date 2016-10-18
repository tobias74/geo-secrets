



var extractJWTToken = function (authenticationString)
{
  var parts = authenticationString.split(' ');
  if (parts.length == 2) {
    var scheme = parts[0];
    var credentials = parts[1];
    if (/^Bearer$/i.test(scheme)) {
      return credentials;
    }
  }
  return false;
}


var getJWTToken = function (req){
    var authenticationString = req.headers.authorization;
    return extractJWTToken(authenticationString);
}

exports.getJWTToken = getJWTToken;
exports.extractJWTToken = extractJWTToken;

