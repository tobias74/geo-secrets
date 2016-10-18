
//var config = require('./environments/' + process.env.ENV_NAME);

var config = require('./environments/' + process.argv[2]);





module.exports = config;
