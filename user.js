var aon = require('aon');
var ERROR = require('./errors');
var SES = require('aws-sdk/clients/ses');

exports.getUser = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

	var token = event.headers.session_id;
	aon.auth.checkAuthentication(token, function(error, result){
		var	user = JSON.parse(result);
		if(error) callback(null, responseMessage('401', ERROR.ERROR_401));
		if(esta("admin", user.groups)){
			if(event.pathParameters && event.pathParameters.email){
				aon.user.getUser(event.pathParameters.email, function(error, results, fields){
					callback(null, responseMessage('200', JSON.stringify(results)));
				});
			} else {
				var data = event.queryStringParameters ? {
					email: event.queryStringParameters.email,
					company: event.queryStringParameters.company,
					group: event.queryStringParameters.group
				} : {};
				aon.user.getUserList(data, function(error, results, fields){
					callback(null, responseMessage('200', JSON.stringify(results)));
				});
			}
		} else callback(null, responseMessage('403', ERROR.ERROR_403));
	});
}

exports.createUser = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

	var token = event.headers.session_id;
	aon.auth.checkAuthentication(token, function(error, result){
		var	user = JSON.parse(result);
		if(error) callback(null, responseMessage('401', ERROR.ERROR_401));
		if(esta("admin", user.groups)){
			aon.user.createUser(event,  function(error, results, fields){
				if(error) callback(error);
				else {
					sesVerifyEmailIdentity(event.email);
					sesAddRecipients(event.companies)
					callback(null,responseMessage('200', JSON.stringify(results)));
				}
			});
		} else callback(null, responseMessage('403', ERROR.ERROR_403));
	});
}

exports.deleteUser = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

	var token = event.headers.session_id;
	aon.auth.checkAuthentication(token, function(error, result){
		var	user = JSON.parse(result);
		if(error) callback(null, responseMessage('401', ERROR.ERROR_401));
		if(esta("admin", user.groups)){
  		aon.user.deleteUser(event,  function(error, results, fields){
				if(error) callback(error);
				callback(null,responseMessage('200', JSON.stringify(results)));
			});
		} else callback(null, responseMessage('403', ERROR.ERROR_403));
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
	if(oa && oa.length){
		for(var i = 0 ; i < oa.length; i++){
			if(o == oa[i]) return true;
		}
	}
	return false;
}

function sesVerifyEmailIdentity(email){
	var ses = new SES();
	var params = {
		EmailAddress: email
	};
	ses.verifyEmailIdentity(params, function(err, data) {
		if (err) console.log(err, err.stack); // an error occurred
		else console.log(data);           // successful response
	});
}

function sesAddRecipients(companies){
	var ses = new SES();
	var params = {
		RuleSetName: "default-rule-set"
	};
	ses.describeReceiptRuleSet(params, function(err, data) {
		if (err) console.log(err, err.stack); // an error occurred
		else {
			var recipients = data.Rules[0].Recipients;
			for(var i = 0; i < companies.length; i++){
				recipients[recipients.length] = companies[i]+"@tedi.center";
			}
			data.Rules[0].Recipients = recipients;
			var update = {
				Rule: data.Rules[0],
				RuleSetName: "default-rule-set"
			};
			ses.updateReceiptRule(update, function(err, data) {
				if (err) console.log(err, err.stack); // an error occurred
				else console.log(data);           // successful response
			});
		}
	});	
}
