var config = require("config");

var ExchangeRate = (function () {
	var isInt = function(value) {
  		return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
	};

	var getDenominatorFromRate = function(label) {
		if (label.includes("/")) {
			return parseInt(label.split("/")[1]);
		} else {
			return 1;
		}
		
	}

	var calculateCoin = function(toCoinType, fromCoinAmount, fromCoinType) {
		var coinRate = config.get("coin." + fromCoinType + "." + toCoinType + ".rate");
		return (fromCoinAmount * coinRate);
	}

	var calculateModCoin = function(toCoinType, fromCoinAmount, fromCoinType) {
		var denominator = getDenominatorFromRate(config.get("coin." + fromCoinType + "." + toCoinType + ".label"));
		return (fromCoinAmount % denominator);
	}

	var exchange = function (fromCoinAmount, fromCoinType, resultCoins) {
		var remainingCoins = fromCoinAmount;
		for (var highestCoinType in config.get("coin")) {
			//If we're converting to the same coin type (i.e. cp to cp), then ignore calculations and just store it
			if ((fromCoinType === highestCoinType)) {
				resultCoins[fromCoinType] += remainingCoins;
				return;
			}

			//Convert to a higher coin type, if possible
			var quotient = Math.floor(calculateCoin(highestCoinType, remainingCoins, fromCoinType));
			remainingCoins = calculateModCoin(highestCoinType, remainingCoins, fromCoinType);
			resultCoins[highestCoinType] += quotient;
		}
	};

	var optimalExchange = function (coinOpts) {
		//1. Init the base coin conversions to 0
		var results = {};
		for (var key in config.get("coin")) {
			results[key] = 0;
		}

		//2. Convert the coins
		for (var coin in coinOpts) {
			if (isInt(coinOpts[coin]) && coinOpts[coin] > 0) {
				exchange(parseInt(coinOpts[coin]), coin, results);
			}
		}
		
		return results;
	};

	var teamSplit = function(partyMemCount, coinOpts) {
		if (isInt(partyMemCount) && partyMemCount <= 1) {
			return [optimalExchange(coinOpts)];
		} 

		//Init the coins by member
		var coinsByMember = [];
		for (var i=0; i<partyMemCount; i++) {
			coinsByMember.push({});
		}

		var results = coinOpts;

		//The config file is in order from greatest to least
		var remainingCoinAmount = 0;
		var remainingCoinType = null;
		for (var coin in config.get("coin")) {
			if (!results.hasOwnProperty(coin)) {
				results[coin] = 0;
			}

			//Take any remaining coins and either 
			//A. exchange it to a lower coin value or
			//B. add any remaining coppers for further processing
			if (remainingCoinAmount > 0) {
				if (coin !== remainingCoinType) {
					var convertedValue = calculateCoin(coin, remainingCoinAmount, remainingCoinType);
					results[coin] += convertedValue;
				} else if (coin === "cp") {
					results[coin] += remainingCoinAmount; 
				}
			}

			//Get the coins that evenly distribute
			var evenCoins = Math.floor(results[coin] / partyMemCount);

			//Get the coins that don't
			remainingCoinAmount = results[coin] % partyMemCount;
			remainingCoinType = coin;

			//Set those coins that evenly distribute
			for (var i=0; i<partyMemCount; i++) {
				coinsByMember[i][coin] = evenCoins;
			}

			//Set any remaining coins that don't
			if (remainingCoinType === "cp" && remainingCoinAmount > 0) {
				for (var i=0; i<remainingCoinAmount; i++) {
					coinsByMember[i][remainingCoinType] += 1;
				}
			}
		}
		return coinsByMember;
	};
  
	return {
  	optimalExchange : optimalExchange,
  	teamSplit : teamSplit
	};

})();

module.exports = ExchangeRate;