var aon = require('aon');

exports.getUser = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

	var token = event.headers.session_id;
	auth.checkAuthentication(token, function(error, user)){
		if(error) callback(null, responseMessage('401', ERROR.ERROR_401));
		if(esta("admin", user.groups)){
			if(event.pathParameters && event.pathParameters.email){
				user.getUser(event.pathParameters.email, function(error, results, fields){
					callback(null, responseMessage('200', JSON.stringify(results)));
				});
			} else {
				var data = event.queryStringParameters ? {
					email: event.queryStringParameters.email,
					company: event.queryStringParameters.company,
					group: event.queryStringParameters.group
				} : {};
				user.getUserList(data, function(error, results, fields){
					callback(null, responseMessage('200', JSON.stringify(results)));
				});
			}
		} else callback(null, responseMessage('403', ERROR.ERROR_403));
	}
}

exports.createUser = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

	var token = event.headers.session_id;
	auth.checkAuthentication(token, function(error, user)){
		if(error) callback(null, responseMessage('401', ERROR.ERROR_401));
		if(esta("admin", user.groups)){
			aon.user.createUser(event,  function(error, results, fields){
				if(error) callback(error);
				callback(null,responseMessage('200', JSON.stringify(results)));
			});
		} else callback(null, responseMessage('403', ERROR.ERROR_403));
	}
}

exports.deleteUser = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

	var token = event.headers.session_id;
	auth.checkAuthentication(token, function(error, user)){
		if(error) callback(null, responseMessage('401', ERROR.ERROR_401));
		if(esta("admin", user.groups)){
  		aon.user.deleteUser(event,  function(error, results, fields){
				if(error) callback(error);
				callback(null,responseMessage('200', JSON.stringify(results)));
			});
		} else callback(null, responseMessage('403', ERROR.ERROR_403));
	}
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
