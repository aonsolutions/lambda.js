var aon = require('aon');

exports.createUser = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

  aon.user.createUser(event,  function(error, results, fields){
		if(error) callback(error);
		callback(null, {
			statusCode: '200',
			body: JSON.stringify(results),
			headers: {
					'Content-Type': 'application/json',
			},
 		});
	});
}

exports.deleteUser = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

  aon.user.deleteUser(event,  function(error, results, fields){
		if(error) callback(error);
		callback(null, {
			statusCode: '200',
			body: JSON.stringify(results),
			headers: {
					'Content-Type': 'application/json',
			},
 		});
	});
}
