'use strict';

var aon = require('aon');
var mysql = require('mysql');
var AWS = require('aws-sdk');
var SES = require('aws-sdk/clients/ses');

console.log("DB_HOST:" + process.env.DB_HOST);
console.log("DB_USER:" + process.env.DB_USER);
console.log("DB_PASSWD:" + process.env.DB_PASSWD);

var pool  = mysql.createPool({
	host     : process.env.DB_HOST,
	user     : process.env.DB_USER,
	password : process.env.DB_PASSWD,
	database : process.env.DB_NAME
});

exports.getWithAuth = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

	if(!event.headers.token) {
		var error = new Error("Tu petición no tiene cabecera de autorización");
		callback(error);
  }

	aon.auth.checkAuthentication(token, function(error, auth){
		if(error) callback(error);
		var data = JSON.parse(event.body);
		data.domain = auth.domain;
		data.user = auth.user;
		data.invoice = event.pathParameters.invoice;
		aon.invoice.select(pool, data, function(error, results, fields){
      callback(null, {
        statusCode: '200',
			  body: JSON.stringify(results),
			  headers: {
				      'Content-Type': 'application/json',
			  },
		 });
  	});
	})
};

exports.get = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

	var invoice = event.pathParameters.invoice;
  var domain = event.pathParameters.domain;

	aon.invoice.select(pool,
    function(params){
      if(invoice) return params.domain.equals(domain).and(params.id.equals(invoice));
      else return params.domain.equals(domain);
    },
    function(error, results, fields){
      callback(null, {
        statusCode: '200',
			  body: JSON.stringify(results),
			  headers: {
				      'Content-Type': 'application/json',
			  },
		 });
  });
};

exports.insert = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

	var invoice = event.pathParameters.invoice;
	var domain = event.pathParameters.domain;
	var data = JSON.parse(event.body);
	data.domain = domain;

	if(invoice){
		data.id = invoice;
		aon.invoice.update(pool, data, function(error, results, fields){
			callback(null, {
				statusCode: '200',
			  body: JSON.stringify(results),
			  headers: {
				      'Content-Type': 'application/json',
				},
			});
  	});
	} else {
		aon.invoice.insert(pool, data, function(error, results, fields){
			callback(null, {
				statusCode: '200',
			  body: JSON.stringify(results),
			  headers: {
				      'Content-Type': 'application/json',
				},
			});
  	});
	}
};

exports.sabbatic = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

	var domain = event.pathParameters.domain;
	var data = JSON.parse(event.body);
	data.domain = domain;

	aon.sabbatic.sabbatic(pool, data,
    function(error, results, fields){
      callback(null, {
        statusCode: '200',
			  body: JSON.stringify(results),
			  headers: {
				      'Content-Type': 'application/json',
			  },
		 });
  });
};

exports.sesImport = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

	var ses = new SES();

	var mail = event.Records[0].ses.mail;
	console.log(mail.commonHeaders.subject);
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
	    	for(var h = 6; h < b2.length; h++){
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
			r.domain = mail.commonHeaders.subject;
			r.files = array;
			r.sbUser = process.env.SB_USER;
			r.sbPassword = process.env.SB_PASSWD;
			console.log(r);
			aon.invoiceImport.importFromFile(pool, r, function(error, result){

			});
		}
	});
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
};
