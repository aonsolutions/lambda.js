var aon = require('aon');

exports.createUser = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

  aon.user.createUser(event,  function(error, results, fields){
		if(error) callback(error);
		callback(null,responseMessage('200', JSON.stringify(results)));
	});
}

exports.deleteUser = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

  aon.user.deleteUser(event,  function(error, results, fields){
		if(error) callback(error);
		callback(null,responseMessage('200', JSON.stringify(results)));
	});
}

function responseMessage(code, description){
	return {
	 statusCode: code,
	 body: description,
	 headers: {
				 'Content-Type': 'application/json',
	 	 }
	}
}

function esta(o, oa){
	for(var i = 0 ; i < oa.length; i++){
		if(o == oa[i]) return true;
	}
	return false;
}
