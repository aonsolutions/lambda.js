var aon = require('aon');
var response = require('./response');

exports.login = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;
	console.log(event);
	aon.auth.login(event,  function(error, results, fields){
		if(error) callback(error);
		else callback(null, response.responseMessage('200', JSON.stringify(results)));
	});
};
