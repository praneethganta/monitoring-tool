// DB server configuration //
const { Pool, Client } = require('pg');
var moment = require('moment');
const connectionString = 'postgres://ec2-18-220-124-182.us-east-2.compute.amazonaws.com:5432/postgres';
const client = new Client({
  user: 'postgres',
  host: 'ec2-18-220-124-182.us-east-2.compute.amazonaws.com',
  database: 'postgres',
  password: 'postgres',
  port: 5432,
});
client.connect();

// DB service which records the received behavior data into DB //

exports.updateActivity = function(user, activity, callback)
{
	client.query('INSERT INTO user_activity(username, activity) values($1,$2)',[user,activity],(err, result) => {
	if (err) {
		callback(false,"Insert error");
	}
	else {
		callback(true, "Insert successful");
	}
});
}

// Login validator which checks with the DB and authenticates the user into the web page //

exports.manualLogin = function(user, pass, callback)
{
	client.query("SELECT * FROM users where username = $1 AND password = $2",[user,pass],(err, result) => {
	if (result.rows.length == 1) {
		const results = [];
		var dt = new Date();
		var currenDate = dt.toUTCString();
		var loginHistory = "";
		const query = client.query('SELECT activity FROM users WHERE username = $1',[user], (err,res) => {
			if (err) {
    console.log(err.stack)
  } else {
    loginHistory = currenDate + ";" + res.rows[0]["activity"];
		console.log(loginHistory);
		client.query('UPDATE users SET activity=($1) WHERE username=($2)',
	[loginHistory, user], (err,res) => {
		if (err) {console.log(err)}});
  }
		});
		callback(true,'Logged in');
	}
	else{
		callback(false,"invalid user");
	}
});
}

// New account creation DB service which helps the user to have account stored in the DB //

exports.addNewAccount = function(newData, callback)
{
		client.query("SELECT * FROM users where username = $1",[newData.username],(err, result) => {
    if (result.rows.length > 0) {
			callback(false,'username-taken');
		}
		else {
				var dt = new Date();
				newData.date = dt.toUTCString();
				client.query('INSERT INTO users(name, username,password,created,activity) values($1,$2,$3,$4,$5)',
				[newData.name,newData.username,newData.pass,newData.date,newData.date],(err,result) => {
					if (err){
						callback(true,err);
					}
					else{
						callback(false,"user-created");
					}
				});
		}
});
}

exports.getuserActivity = function(username, callback) {
  const query = client.query('SELECT * FROM user_activity WHERE username = $1',[username], (err,res) => {
		if (err) {
	console.log(err.stack)
} else {
	callback(res.rows);
}
	});
}

// This DB service looks for the user details in the DB based on username //

exports.getAccountByUsername = function(username, callback) {
	const query = client.query('SELECT * FROM users WHERE username = $1',[username], (err,res) => {
		if (err) {
	console.log(err.stack)
} else {
	callback(res.rows[0]);
}
	});

}
