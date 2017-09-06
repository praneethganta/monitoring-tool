
var CT = require('./modules/country-list');
var AM = require('./modules/account-manager');
var EM = require('./modules/email-dispatcher');

module.exports = function(app) {

// main login page //
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
// logged-in user homepage //

	app.get('/home', function(req, res) {
		if (req.cookies.user == undefined || req.cookies.pass == undefined){
	// if user is not logged-in redirect back to login page //
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

	app.post('/home', function(req, res){
		if (req.session.user == null){
			res.redirect('/');
		}	else{
			AM.updateAccount({
				id		: req.session.user._id,
				name	: req.body['name'],
				email	: req.body['email'],
				pass	: req.body['pass'],
				country	: req.body['country']
			}, function(e, o){
				if (e){
					res.status(400).send('error-updating-account');
				}	else{
					req.session.user = o;
			// update the user's login cookies if they exists //
					if (req.cookies.user != undefined && req.cookies.pass != undefined){
						res.cookie('user', o.user, { maxAge: 900000 });
						res.cookie('pass', o.pass, { maxAge: 900000 });
					}
					res.status(200).send('ok');
				}
			});
		}
	});

	app.get('/logout', function(req, res){
		res.clearCookie('user');
		res.clearCookie('pass');
		res.redirect("/")
	})

// creating new accounts //

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

// password reset //

	app.post('/lost-password', function(req, res){
	// look up the user's account via their email //
		AM.getAccountByEmail(req.body['email'], function(o){
			if (o){
				EM.dispatchResetPasswordLink(o, function(e, m){
				// this callback takes a moment to return //
				// TODO add an ajax loader to give user feedback //
					if (!e){
						res.status(200).send('ok');
					}	else{
						for (k in e) console.log('ERROR : ', k, e[k]);
						res.status(400).send('unable to dispatch password reset');
					}
				});
			}	else{
				res.status(400).send('email-not-found');
			}
		});
	});

	app.get('/reset-password', function(req, res) {
		var email = req.query["e"];
		var passH = req.query["p"];
		AM.validateResetLink(email, passH, function(e){
			if (e != 'ok'){
				res.redirect('/');
			} else{
	// save the user's email in a session instead of sending to the client //
				req.session.reset = { email:email, passHash:passH };
				res.render('reset', { title : 'Reset Password' });
			}
		})
	});

	app.post('/reset-password', function(req, res) {
		var nPass = req.body['pass'];
	// retrieve the user's email from the session to lookup their account and reset password //
		var email = req.session.reset.email;
	// destory the session immediately after retrieving the stored email //
		req.session.destroy();
		AM.updatePassword(email, nPass, function(e, o){
			if (o){
				res.status(200).send('ok');
			}	else{
				res.status(400).send('unable to update password');
			}
		})
	});

// view & delete accounts //

	app.get('/print', function(req, res) {
		AM.getAllRecords( function(e, accounts){
			res.render('print', { title : 'Account List', accts : accounts });
		})
	});

	app.post('/delete', function(req, res){
		AM.deleteAccount(req.body.id, function(e, obj){
			if (!e){
				res.clearCookie('user');
				res.clearCookie('pass');
				req.session.destroy(function(e){ res.status(200).send('ok'); });
			}	else{
				res.status(400).send('record not found');
			}
	    });
	});

	app.get('/reset', function(req, res) {
		AM.delAllRecords(function(){
			res.redirect('/print');
		});
	});
};
