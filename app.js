var express = require('express');
var app = express();
var config = require('config');
var ER = require("./modules/exchange-rate");

app.set('port', (process.env.PORT || 3000));

//app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('view engine', 'pug');

app.get('/', function(req, res) {
	//1. Get the coin values from the form
	var coinOpts = {};
	for (var coin in config.get("coin")) {
		if (req.query.hasOwnProperty(coin)) {
			coinOpts[coin] = req.query[coin];
		}
	}

	//2. Get the optimal results
	var results = {};
	if (parseInt(req.query.teamSize) > 0) {
		results = ER.teamSplit(req.query.teamSize, coinOpts);
	} else {
		results = ER.optimalExchange(coinOpts);	
	}

	//3. Create a human-readable string showcasing the results
	var result = "";
	for (var key in results) {
		if (results[key] > 0) {
			result = result.concat(results[key] + key + " ");
		}
	}

	res.render("calculator", {
		coins:  config.get("coin"),
		coinOpts: coinOpts,
		result: result
	});
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});