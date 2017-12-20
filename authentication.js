var aon = require('aon');

exports.login = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

	aon.auth.login(event,  function(error, results, fields){
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
