'use strict';

var aon = require('aon');
var mysql = require('mysql');

var AWS = require('aws-sdk');
var SES = require('aws-sdk/clients/ses');

var ERROR = require('./errors');

var pool  = mysql.createPool({
	host     : process.env.DB_HOST,
	user     : process.env.DB_USER,
	password : process.env.DB_PASSWD,
	database : process.env.DB_NAME
});

// INVOICE GET & POST (import)

exports.get = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

	var token = event.headers.session_id;
	aon.auth.checkAuthentication(token, function(error, user){
		if(error) callback(null, responseMessage('401', ERROR.ERROR_401));
		else {
			var data = {
				company: event.pathParameters.company,
				number: parseInt(event.pathParameters.number)
			}
			if(esta(data.company, user.companies)){
				aon.invoiceDynamo.getInvoice(data, function(error, results, fields){
					callback(null, responseMessage('200', JSON.stringify(results)));
				});
			} else callback(null, responseMessage('403', ERROR.ERROR_403));
		}
	});
};

exports.delete = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

	var token = event.headers.session_id;
	aon.auth.checkAuthentication(token, function(error, user){
		if(error) callback(null, responseMessage('401', ERROR.ERROR_401));
		else {
			var data = {
				company: event.pathParameters.company,
				number: parseInt(event.pathParameters.number)
			}
			if(esta(data.company, user.companies)){
				aon.invoiceDynamo.deleteInvoice(data, function(error, results, fields){
					callback(null, responseMessage('200',  JSON.stringify(results)));
				});
			} else callback(null, responseMessage('403', ERROR.ERROR_403));
		}
	});
};

exports.import = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

	var token = event.headers.session_id;
	aon.auth.checkAuthentication(token, function(error, user){
		if(error) callback(null, responseMessage('401', ERROR.ERROR_401));
		else {
			if(esta(event.company, user.companies)){
				aon.invoiceDynamo.importInvoice(event, function(error, results, fields){
      		callback(null, responseMessage('200', JSON.stringify(results)));
					aon.invoiceSql.tEDi2Aon(pool, JSON.stringify(results), function(err, res){
						// TODO
					});
  			});
			} else callback(null, responseMessage('403', ERROR.ERROR_403));
		}
	});
};

// GET SABBATIC INVOICE WITH STATUS 'SEND' OR 'PENDING' AND UPDATE INVOICE.

exports.refresh = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;
	var r = {};
	r.sbUser = process.env.SB_USER;
	r.sbPassword = process.env.SB_PASSWD;

	aon.invoiceDynamo.refreshSabbatic(r, function(error, results, fields){
      callback(null, responseMessage('200', JSON.stringify(results)));
  });
};

// SEND INVOICE FILE TO OCR/SABBATIC

exports.sesImport = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

	var ses = new SES();

	var mail = event.Records[0].ses.mail;
	var to = mail.commonHeaders.to[0]
	var filter = {
		email: mail.commonHeaders.returnPath,
		company: to.split('@')[0]
	}

	aon.user.getUserList(filter, function(error, results){
		if(error) callback(error);
		if(results.Count > 0){
			var s3 = new AWS.S3();
  		var options = {
				Bucket:'/receive-email-ses',
				Key:mail.messageId,
			};
			var arrayIndex = 0;
			s3.getObject(options, function(err, res) {
				if (err !== null) {
					console.log(err);
				} else {
					var body = res.Body.toString('utf8');
	  			var array = [];
	  			var b = body.split("\n--");
	  			for(var j = 0; j < b.length - 1; j++){
						if(b[j].toString('utf8').includes('X-Attachment-Id')){
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
	  					array[arrayIndex] = o;
							arrayIndex++;
						}
					}
					var r = {};
					r.email = mail.commonHeaders.returnPath;
					r.company = to.split('@')[0];
					r.files = array;
					r.sbUser = process.env.SB_USER;
					r.sbPassword = process.env.SB_PASSWD;
					console.log(r.email + " - " + r.company);
					aon.invoiceDynamo.importSabbatic(r, function(error, result){
					console.log(result);
					var params = {
						Destination: { /* required */
				  			CcAddresses: [],
				    		ToAddresses: [mail.commonHeaders.returnPath],
				    		BccAddresses: []
							},
				  		Message: { /* required */
				  		Body: { /* required */
								Html: {
										Charset: "UTF-8",
										Data: html_data
									},
									Text: {
										Charset: "UTF-8",
										Data: "Este es el cuerpo del mensaje en formato de texto"
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

var html_data = "<p>Estimado Cliente,</p>"
		+	"<p>Su solicitud se ha recibido correctamente. En breves recibirá un mensaje con el resultado de la misma.</p>"
		+	"<p>Atentamente,</p>"
		+	"<p>Departamento técnico | aonSolutions";

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
