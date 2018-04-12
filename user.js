var aon = require('aon');
var ERROR = require('./errors');
var response = require('./response');
var SES = require('aws-sdk/clients/ses');

exports.getUser = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

	var token = event.headers.session_id;
	aon.auth.checkAuthentication(token, function(error, result){
		var	user = JSON.parse(result);
		if(error) callback(null, response.responseMessage('401', ERROR.ERROR_401));
		if(esta("admin", user.groups)){
			if(event.pathParameters && event.pathParameters.email){
				aon.user.getUser(event.pathParameters.email, function(error, results, fields){
					callback(null, response.responseMessage('200', JSON.stringify(results)));
				});
			} else {
				var data = event.queryStringParameters ? {
					email: event.queryStringParameters.email,
					company: event.queryStringParameters.company,
					group: event.queryStringParameters.group
				} : {};
				aon.user.getUserList(data, function(error, results, fields){
					callback(null, response.responseMessage('200', JSON.stringify(results)));
				});
			}
		} else callback(null, response.responseMessage('403', ERROR.ERROR_403));
	});
};

exports.createUser = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;
	var token = event.headers.session_id;
	aon.auth.checkAuthentication(token, function(error, result){
		var	user = JSON.parse(result);
		if(error) callback(null, response.responseMessage('401', ERROR.ERROR_401));
		if(esta("admin", user.groups)){
			var newUser = JSON.parse(event.body);
			aon.user.createUser(newUser,  function(error, results, fields){
				if(error) callback(error);
				else {
					sesVerifyEmailIdentity(newUser.email, function(error, result){
						sesAddRecipients(newUser.companies, function(error, result){
								callback(null, response.responseMessage('200', JSON.stringify(results)));
						})
					});
				}
			});
		} else callback(null, response.responseMessage('403', ERROR.ERROR_403));
	});
};

exports.deleteUser = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

	var token = event.headers.session_id;
	aon.auth.checkAuthentication(token, function(error, result){
		var	user = JSON.parse(result);
		if(error) callback(null, response.responseMessage('401', ERROR.ERROR_401));
		if(esta("admin", user.groups)){
  		aon.user.deleteUser(event.pathParameters.email,  function(error, results, fields){
				if(error) callback(error);
				else callback(null, response.responseMessage('200', JSON.stringify(results)));
			});
		} else callback(null, response.responseMessage('403', ERROR.ERROR_403));
	});
};

exports.updateUser = (event, context, callback) => {
	//TODO
};

function esta(o, oa){
	if(oa && oa.length){
		for(var i = 0; i < oa.length; i++){
			if(o == oa[i]) return true;
		}
	}
	return false;
}

function sesVerifyEmailIdentity(email, cb){
	var ses = new SES();
	var params = {
		EmailAddress: email
	};
	ses.verifyEmailIdentity(params, cb);
}

function sesAddRecipients(companies, cb){
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
			ses.updateReceiptRule(update, cb);
		}
	});
}
