
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
    // Stream results back one row at a time
  /*
    query.on('end', () => {
      done();
			loginHistory = currenDate + ";" + results[0];
			console.log(loginHistory);
			client.query('UPDATE users SET activity=($1) WHERE username=($2)',
    [loginHistory, user]);
	});*/
		callback(true,'Logged in');
	}
	else{
		callback(false,"invalid user");
	}
});
}

/* record insertion, update & deletion methods */

exports.addNewAccount = function(newData, callback)
{
/*

	pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }*/
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



/*
    client.query('INSERT INTO users(name, username,) values($1, $2)',
    [data.text, data.complete]);
	accounts.findOne({user:newData.user}, function(e, o) {
		if (o){
			callback('username-taken');
		}	else{ec2-18-220-124-182.us-east-2.compute.amazonaws.com
			accounts.findOne({email:newData.email}, function(e, o) {
				if (o){
					callback('email-taken');
				}	else{
					saltAndHash(newData.pass, function(hash){
						newData.pass = hash;
					// append date stamp when record was created //
						newData.date = moment().format('MMMM Do YYYY, h:mm:ss a');
						accounts.insert(newData, {safe: true}, callback);
					});
				}
			});
		}
	});
}
*/
exports.updateAccount = function(newData, callback)
{
	accounts.findOne({_id:getObjectId(newData.id)}, function(e, o){
		o.name 		= newData.name;
		o.email 	= newData.email;
		o.country 	= newData.country;
		if (newData.pass == ''){
			accounts.save(o, {safe: true}, function(e) {
				if (e) callback(e);
				else callback(null, o);
			});
		}	else{
			saltAndHash(newData.pass, function(hash){
				o.pass = hash;
				accounts.save(o, {safe: true}, function(e) {
					if (e) callback(e);
					else callback(null, o);
				});
			});
		}
	});
}

exports.updatePassword = function(email, newPass, callback)
{
	accounts.findOne({email:email}, function(e, o){
		if (e){
			callback(e, null);
		}	else{
			saltAndHash(newPass, function(hash){
		        o.pass = hash;
		        accounts.save(o, {safe: true}, callback);
			});
		}
	});
}

/* account lookup methods */

exports.deleteAccount = function(id, callback)
{
	accounts.remove({_id: getObjectId(id)}, callback);
}

exports.getAccountByUsername = function(username, callback) {
	const query = client.query('SELECT * FROM users WHERE username = $1',[username], (err,res) => {
		if (err) {
	console.log(err.stack)
} else {
	callback(res.rows[0]);
}
	});

}

exports.validateResetLink = function(email, passHash, callback)
{
	accounts.find({ $and: [{email:email, pass:passHash}] }, function(e, o){
		callback(o ? 'ok' : null);
	});
}

exports.getAllRecords = function(callback)
{
	accounts.find().toArray(
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
}

exports.delAllRecords = function(callback)
{
	accounts.remove({}, callback); // reset accounts collection for testing //
}

/* private encryption & validation methods */

var generateSalt = function()
{
	var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
	var salt = '';
	for (var i = 0; i < 10; i++) {
		var p = Math.floor(Math.random() * set.length);
		salt += set[p];
	}
	return salt;
}

var md5 = function(str) {
	return crypto.createHash('md5').update(str).digest('hex');
}

var saltAndHash = function(pass, callback)
{
	var salt = generateSalt();
	callback(salt + md5(pass + salt));
}

var validatePassword = function(plainPass, hashedPass, callback)
{
	var salt = hashedPass.substr(0, 10);
	var validHash = salt + md5(plainPass + salt);
	callback(null, hashedPass === validHash);
}

var getObjectId = function(id)
{
	return new require('mongodb').ObjectID(id);
}

var findById = function(id, callback)
{
	accounts.findOne({_id: getObjectId(id)},
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
}

var findByMultipleFields = function(a, callback)
{
// this takes an array of name/val pairs to search against {fieldName : 'value'} //
	accounts.find( { $or : a } ).toArray(
		function(e, results) {
		if (e) callback(e)
		else callback(null, results)
	});
}
