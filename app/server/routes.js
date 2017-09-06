
var AM = require('./modules/account-manager');

module.exports = function(app) {

// Root login page redirects to home page if user already logged in else to the login page //
	app.get('/', function(req, res){
		if (req.cookies.user == undefined || req.cookies.pass == undefined){
			res.render('form-login', {error : ""});
		}	else{
			AM.manualLogin(req.cookies.user, req.cookies.pass, function(status, o){
				if(status)
				res.redirect("/home");
				else
				res.render('form-login', {error : o});
			});
		}
	});

// Logs in the user on based on the username and password entered or already logged in users are redirected to home page //

	app.post('/login', function(req, res){
		AM.manualLogin(req.body['username'], req.body['password'], function(e, o){
      if (e) {
				res.cookie('user',req.body['username'], {httpOnly: false });
				res.cookie('pass',req.body['password'], {httpOnly: false });
				res.redirect("/home");
			}
			else{
				res.render('form-login', {error : o});
			}
		});
	});

// Activities received from the chrome extension are recorded into DB using this service //

	app.post('/userActivity', function(req, res){
		AM.updateActivity(req.body['username'], req.body['activity'], function(e, o){
			if (e) {
				res.status(200).send(o);
			}
			else{
				res.status(400).send(o);
			}
		});
	});


// logged-in user's homepage service which helps in viewing user's profile and login history  //

	app.get('/home', function(req, res) {
		if (req.cookies.user == undefined || req.cookies.pass == undefined){
			res.redirect('/');
		}	else{
			AM.getAccountByUsername(req.cookies.user, function(result){
				activity = result["activity"].split(";")
				tableCode= "<table>"
				for (i = 0; i< activity.length; i++)
				{
					tableCode = tableCode + "<tr><td>" + activity[i] + "</td></tr>";
				}
				tableCode = tableCode + "</table>"
				res.render('home', {name : result["name"],username : result["username"],logHistory : tableCode});

			});
		}
	});

// Logout service to clear all session cookies in order to stop logging by the extension and not allowing users to enter into the web page without login //

	app.get('/logout', function(req, res){
		res.clearCookie('user');
		res.clearCookie('pass');
		res.redirect("/")
	})

// Register services - to create new user accounts //

	app.get('/register', function(req, res) {
		res.render('form-register', {error : ""});
	});

	app.post('/register', function(req, res){
		AM.addNewAccount({
			name 	: req.body['name'],
			username 	: req.body['username'],
			pass	: req.body['password'],
		}, function(e,o){
			console.log(o);
			if (e){
				res.status(400).send(e);
			}	else if(o === 'user-created'){
				res.redirect('/');
			}
			else{
				res.render('form-register', {error : o})
			}
		});
	});
};
