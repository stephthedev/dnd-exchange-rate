var express = require('express');
var app = express();
var config = require('config');
var ER = require("./modules/exchange-rate");

app.set('port', (process.env.PORT || 3000));

//app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('view engine', 'pug');

app.get('/', function(req, res) {
	var cp = req.query.cp;
	var sp = req.query.sp;
	var ep = req.query.ep;
	var gp = req.query.gp;
	var pp = req.query.pp;

	var results = ER.optimalExchange(cp, sp, ep, gp, pp);
	var result = "";
	for (var key in results) {
		if (results[key] > 0) {
			result = result.concat(results[key] + key + " ");
		}
	}

	res.render("calculator", {
		coins:  config.get("coin"),
		cp: cp,
		sp: sp,
		ep: ep,
		gp: gp,
		pp: pp,
		result: result
	});
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});