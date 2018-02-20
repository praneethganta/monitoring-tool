// DB server configuration //
const { Pool, Client } = require('pg');
var moment = require('moment');
const connectionString = ''; // Your Postgres Server API endpopint here
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
		client.query('UPDATE users SET activity=($1) WHERE username=($2)',
	[loginHistory, user], (err,res) => {
		if (err) {console.log(err)}
    else {
      callback(true,'Logged in');
}
  });
  }
		});
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

exports.fetchData = function(username,userselect,callback)
{
  var queryString = "";
  if (userselect == 'Me') {
    queryString = "SELECT * FROM user_activity WHERE username = '" + username + "' and activity like 'clicked :  question :%'";
  }
  else {
    queryString = "SELECT * FROM user_activity WHERE activity like 'clicked :  question :%'";
  }
  const query = client.query(queryString, (err,res) => {
    if (err) {
  console.log(err.stack)
} else {
  var corpus = ""
  var values = res.rows
  for (var i = 0; i < values.length; i++){
    corpus = corpus + values[i]["activity"];
  }
  var PythonShell = require('python-shell');
  var options = {
    mode: 'text',
    args: [corpus]
};

PythonShell.run('./app/server/modules/wordFrequencies.py', options, function (err, results) {
    if (err) throw err;
    words = JSON.parse(results[0]);
    wordList = [];
    for (var key in words){
      wordList.push({"text":key,"weight":words[key]})
    }
    callback(wordList);
});
}
  });

}
Array.prototype.unique = function() {
  return this.filter(function (value, index, self) {
    return self.indexOf(value) === index;
  });
}
function zeros(dimensions) {
    var array = [];

    for (var i = 0; i < dimensions[0]; ++i) {
        array.push(dimensions.length == 1 ? 0 : zeros(dimensions.slice(1)));
    }

    return array;
}

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

exports.fetchSeriesData = function(username,callback)
{
  const query = client.query('select username, date_trunc(\'day\', user_activity.timestamp) "day", count(*) from user_activity group by username,2 order by 2', (err,res) => {
    if (err) {
  console.log(err.stack)
} else {
var values = res.rows;
dates = []
usernames = []
for(var i = 0; i <values.length;i++) {
  dates.push(String(values[i]["day"]));
}
for(var i = 0; i <values.length;i++) {
  usernames.push(values[i]["username"]);
}

uniqueDates = dates.unique();
uniqueUsers = usernames.unique();
dataMatrix = zeros([uniqueUsers.length,uniqueDates.length])
for (var i = 0;i <values.length;i++){
  dataMatrix[uniqueUsers.indexOf(values[i]["username"])][uniqueDates.indexOf(String(values[i]["day"]))] = values[i]["count"];
}
var finalDates= ['x'];
var finalData = [];
for(var i = 0;i<uniqueDates.length;i++){
  uniqueDates[i] = formatDate(uniqueDates[i]);
}
finalDates.push.apply(finalDates,uniqueDates);
finalData.push(finalDates);
for (var i =0;i <dataMatrix.length;i++){
  var row = [uniqueUsers[i]];
  row.push.apply(row,dataMatrix[i]);
  finalData.push(row);
}
callback(finalData);
}
  });

}

exports.fetchPerfomanceData = function(username, callback) {
	const query = client.query("select username, count(*) from user_activity where activity like '%Posted an%' group by username", (err,res) => {
		if (err) {
	console.log(err.stack)
} else {
	answers = res.rows;
  const query = client.query("select username, count(*) from user_activity where activity like '%Posted question%' group by username;", (err,res) => {
		if (err) {
	console.log(err.stack)
} else {
	questions = res.rows
  console.log(questions);
  console.log(answers);
  users= []
  for(var i = 0;i <questions.length;i++)
  {
    users.push(questions[i]["username"]);
  }
  finalUsers = ['x']
  for(var i = 0;i <answers.length;i++)
  {
    users.push(answers[i]["username"]);
  }
  uniqueUsers = users.unique();
  dataMatrix = zeros([2,uniqueUsers]);
  for(var i = 0;i <questions.length;i++)
  {
    dataMatrix[0][uniqueUsers.indexOf(questions[i]["username"])] = questions[i]["count"];
  }
  finalUsers = ['x']
  for(var i = 0;i <answers.length;i++)
  {
    dataMatrix[1][uniqueUsers.indexOf(answers[i]["username"])] = answers[i]["count"];
  }
  finalUsers.push.apply(finalUsers,uniqueUsers);
  finalData = []
  finalQuestions = ["Questions Posted"];
  finalQuestions.push.apply(finalQuestions,dataMatrix[0]);
  console.log(finalQuestions);
  finalAnswers  = ["Questions Answered"];
  finalAnswers.push.apply(finalAnswers,dataMatrix[1]);
  finalData.push(finalUsers);
  finalData.push(finalQuestions);
  finalData.push(finalAnswers);
  callback(finalData);
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
