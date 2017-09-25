var aon = require('aon');
var mysql = require('mysql');

console.log("DB_HOST:" + process.env.DB_HOST);
console.log("DB_USER:" + process.env.DB_USER);
console.log("DB_PASSWD:" + process.env.DB_PASSWD);

var pool  = mysql.createPool({
	host     : process.env.DB_HOST,
	user     : process.env.DB_USER,
	password : process.env.DB_PASSWD,
	database : process.env.DB_NAME
});

exports.login = (event, context, callback) => {
	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

  var username = event.body.username;
  var password = event.body.password;

	aon.auth.login(username, password, function(error, results, fields){
    if(error) callback(error);
    callback(null, {
      statusCode: '200',
      body: JSON.stringify(results),
      headers: {
        'Content-Type': 'application/json'
      },
    });
	})
};
