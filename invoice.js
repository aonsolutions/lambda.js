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

	var invoice = event.pathParameters.invoice;
  var domain = event.pathParameters.domain;

	aon.invoice.select(pool,
    function(params){
      if(invoice) return params.domain.equals(domain).and(params.id.equals(invoice));
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

	var invoice = event.pathParameters.invoice;
	var domain = event.pathParameters.domain;
	var data = JSON.parse(event.body);
	data.domain = domain;

	if(invoice){
		data.id = invoice;
		aon.invoice.update(pool, data, function(error, results, fields){
			callback(null, {
				statusCode: '200',
			  body: JSON.stringify(results),
			  headers: {
				      'Content-Type': 'application/json',
				},
			});
  	});
	} else {
		aon.invoice.insert(pool, data, function(error, results, fields){
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
	var data = JSON.parse(event.body);
	data.domain = domain;

	aon.sabbatic.sabbatic(pool, data,
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
