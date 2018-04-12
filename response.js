'use strict';

module.exports.responseMessage = responseMessage;

function responseMessage(code, description){
	return {
	 statusCode: code,
	 body: description,
	 headers: {
		 'Content-Type': 'application/json',
		 'Access-Control-Allow-Headers':'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,session_id',
		 'Access-Control-Allow-Methods':'OPTIONS,POST,GET,DELETE',
		 'Access-Control-Allow-Origin':'*'
	 }
	}
}
