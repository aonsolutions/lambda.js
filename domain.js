
var aon = require('aon');
var mysql = require('mysql');
var response = require('./response');

console.log("DB_HOST:" + process.env.DB_HOST);
console.log("DB_USER:" + process.env.DB_USER);
console.log("DB_PASSWD:" + process.env.DB_PASSWD);

var pool  = mysql.createPool({
	host     : process.env.DB_HOST,
	user     : process.env.DB_USER,
	password : process.env.DB_PASSWD,
	database : process.env.DB_NAME
});

exports.all = (event, context, callback) => {

	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

	aon.domain.all(pool, function(error, results, fields){
   	callback(null, response.responseMessage('200', JSON.stringify(results)));
  });
};

exports.get = (event, context, callback) => {

	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

	var id = event.pathParameters.domain;

	aon.domain.get(pool,
		function(params){
			return params.id.equals(id);
		},
		function(error, results, fields){
   	callback(null, response.responseMessage('200', JSON.stringify(results)));
  });
};
