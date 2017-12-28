'use strict';

var AWS = require('aws-sdk');
var SES = require('aws-sdk/clients/ses');
var aon = require('aon');
var ERROR = require('./errors');
// INVOICE GET & POST (import)

exports.get = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

	var token = event.headers.session_id;
	aon.auth.checkAuthentication(token, function(error, user)){
		if(error) callback(null, responseMessage('401', ERROR.ERROR_401));

		var data = {
			company: event.pathParameters.company,
			number: parseInt(event.pathParameters.number)
		}
		if(esta(data.company, user.companies)){
			aon.invoice.getInvoice(data, function(error, results, fields){
				callback(null, responseMessage('200', JSON.stringify(results)));
			});
		} else callback(null, responseMessage('403', ERROR.ERROR_403));
	}
};

exports.delete = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

	var token = event.headers.session_id;
	aon.auth.checkAuthentication(token, function(error, user)){
		if(error) callback(null, responseMessage('401', ERROR.ERROR_401));
		var data = {
			company: event.pathParameters.company,
			number: parseInt(event.pathParameters.number)
		}
		if(esta(data.company, user.companies)){
			aon.invoice.deleteInvoice(data, function(error, results, fields){
				callback(null, responseMessage('200',  JSON.stringify(results)));
			});
		} else callback(null, responseMessage('403', ERROR.ERROR_403));
	}
};

exports.import = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

	var token = event.headers.session_id;
	aon.auth.checkAuthentication(token, function(error, user)){
		if(error) callback(null, responseMessage('401', ERROR.ERROR_401));
		if(esta(event.company, user.companies)){
			aon.invoice.importInvoice(event, function(error, results, fields){
      	callback(null, responseMessage('200', JSON.stringify(results)));
  		});
		} else callback(null, responseMessage('403', ERROR.ERROR_403));
	}
};

// GET SABBATIC INVOICE WITH STATUS 'SEND' OR 'PENDING' AND UPDATE INVOICE.

exports.refresh = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;
	var r = {};
	r.sbUser = process.env.SB_USER;
	r.sbPassword = process.env.SB_PASSWD;

	aon.invoice.refreshSabbatic(r, function(error, results, fields){
      callback(null, responseMessage('200', JSON.stringify(results)));
  });
};

// SEND INVOICE FILE TO OCR/SABBATIC

exports.sesImport = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

	var ses = new SES();

	var mail = event.Records[0].ses.mail;
	var filter = {
		email: mail.commonHeaders.returnPath,
		company: mail.commonHeaders.subject
	}

	aon.user.getUserList(filter, function(error, results)){
		if(error) callback(error);
		if(results.Count > 0){
			var s3 = new AWS.S3();
  		var options = {
				Bucket:'/receive-email-ses',
				Key:mail.messageId,
			};

			s3.getObject(options, function(err, res) {
				if (err !== null) {
					console.log(err);
				} else {
					var body = res.Body.toString('utf8');
	  			var array = [];
	  			var b = body.split("\n--");

	  			for(var j = 5; j < b.length - 1; j++){
	  				var b2 = b[j].split("\n");
	    			var base = "";

						var indez = 4;
						while(!b2[indez].toString('utf8').includes('X-Attachment-Id')){
							indez++;
						}

	    			for(var h = indez+2; h < b2.length; h++){
	    				base = base + b2[h];
	   				}
	    			var o = {};
	    			o.base64 = base.substring(0, base.length-1);
	    			var index = b2[1].indexOf(';');
	    			o.contentType = b2[1].substring(14,index);
	    			o.name = b2[1].substring(index+7);
	    			o.name = o.name.substring(0,o.name.length-1);
	    			if(o.name.charAt(0) == "\""){
	    				o.name = o.name.substring(1, o.name.length-1);
						}
	  				array[j-5] = o;
					}
					var r = {};
					r.email = mail.commonHeaders.returnPath;
					r.company = mail.commonHeaders.subject;
					r.files = array;
					r.sbUser = process.env.SB_USER;
					r.sbPassword = process.env.SB_PASSWD;
					console.log(r.email + " - " + r.company);
					aon.invoice.importSabbatic(r, function(error, result){
					console.log(result);
					var params = {
						Destination: { /* required */
				  			CcAddresses: [
				 				],
				    		ToAddresses: [
					  			mail.commonHeaders.returnPath
				    		],
				    		BccAddresses: [
				    		]
							},
				  		Message: { /* required */
				  		Body: { /* required */
								Html: {
										Charset: "UTF-8",
										Data: "This message body contains HTML formatting. It can, for example, contain links like this one: <a class=\"ulink\" href=\"http://docs.aws.amazon.com/ses/latest/DeveloperGuide\" target=\"_blank\">Amazon SES Developer Guide</a>."
									},
									Text: {
										Charset: "UTF-8",
										Data: "This is the message body in text format."
									}
				  			},
				    		Subject: { /* required */
				    			Charset: "UTF-8",
				    			Data: "Hemos recibido tu solicitud"
				    		}
							},
				 			ReplyToAddresses: [
				  		],
				  		Source: "factura@tedi.center"
						};

						console.log(params);

						ses.sendEmail(params, function(err, data) {
							if (err) console.log(err, err.stack); // an error occurred
							else console.log(data);           // successful response
							callback();
						});
					});
				}
			});
		}
	});
};

exports.fileImport = (event, context, callback) => {

};

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
