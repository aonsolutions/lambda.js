var aon = require('aon');
var mysql = require('mysql');

console.log("DB_HOST:" + process.env.DB_HOST);
console.log("DB_USER:" + process.env.DB_USER);
console.log("DB_PASSWD:" + process.env.DB_PASSWD);

var pool  = mysql.createPool({
	host     : process.env.DB_HOST,
	user     : process.env.DB_USER,
	password : process.env.DB_PASSWD,
	database : process.env.DB_NAME
});

exports.get = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

	var id = event.pathParameters.id;
  var domain = event.pathParameters.domain;

	aon.invoice.select(pool,
    function(params){
      if(id) return params.domain.equals(domain).and(params.id.equals(id));
      else return params.domain.equals(domain);
    },
    function(error, results, fields){
      callback(null, {
        statusCode: '200',
			  body: JSON.stringify(results),
			  headers: {
				      'Content-Type': 'application/json',
			  },
		 });
  });
};

exports.insert = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

	var id = event.pathParameters.id;
  event.domain = event.pathParameters.domain;

	if(id){
		event.id = id;
		aon.invoice.update(pool, event, function(error, results, fields){
			callback(null, {
				statusCode: '200',
			  body: JSON.stringify(results),
			  headers: {
				      'Content-Type': 'application/json',
				},
			});
  	});
	} else {
		aon.invoice.insert(pool, event, function(error, results, fields){
			callback(null, {
				statusCode: '200',
			  body: JSON.stringify(results),
			  headers: {
				      'Content-Type': 'application/json',
				},
			});
  	});
	}
};

exports.sabbatic = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

  var domain = event.pathParameters.domain;
	event.domain = event.pathParameters.domain;

	aon.sabbatic.sabbatic(pool, event,
    function(error, results, fields){
      callback(null, {
        statusCode: '200',
			  body: JSON.stringify(results),
			  headers: {
				      'Content-Type': 'application/json',
			  },
		 });
  });
};
