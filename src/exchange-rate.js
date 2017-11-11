var config = require("config");

var ExchangeRate = (function () {
	var isInt = function(value) {
  		return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
	};

	var scrubCoinOpts = function(coinOpts) {
		var scrubbedCoinOpts = {};
		for (var coin in coinOpts) {
			if (isInt(coinOpts[coin])) {
				scrubbedCoinOpts[coin] = parseInt(coinOpts[coin]);
			} else {
				scrubbedCoinOpts[coin] = 0;
			}
		}
		return scrubbedCoinOpts;
	}

	var getDenominatorFromRate = function(label) {
		if (label.includes("/")) {
			return parseInt(label.split("/")[1]);
		} else {
			return 1;
		}
		
	};

	var calculateCoin = function(toCoinType, fromCoinAmount, fromCoinType) {
		var coinRate = config.get("Client.coin." + fromCoinType + "." + toCoinType + ".rate");
		return (fromCoinAmount * coinRate);
	}

	var calculateModCoin = function(toCoinType, fromCoinAmount, fromCoinType) {
		var denominator = getDenominatorFromRate(config.get("Client.coin." + fromCoinType + "." + toCoinType + ".label"));
		return (fromCoinAmount % denominator);
	}

	var exchange = function (fromCoinAmount, fromCoinType, resultCoins) {
		var remainingCoins = fromCoinAmount;
		for (var highestCoinType in config.get("Client.coin")) {
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
		for (var key in config.get("Client.coin")) {
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

		//1. Create a collection of all-zero results for all party members
		var coinsByMember = [];
		for (var i=0; i<partyMemCount; i++) {
			var allZeroCoins = {};
			for (var coin in config.get("Client.coin")) {
				allZeroCoins[coin] = 0;
			}
			coinsByMember.push(allZeroCoins);
		}

		//2. Scrub the coins so that it's all numbers
		var scrubbedCoinOpts = scrubCoinOpts(coinOpts);

		var remainingCoinAmount = 0;
		var remainingCoinType = null;
		for (var coin in config.get("Client.coin")) {
			//Take any remaining coins and either 
			//A. exchange it to a lower coin value or
			//B. add any remaining coppers for further processing
			if (remainingCoinAmount > 0) {
				if (remainingCoinType === "cp") {
					scrubbedCoinOpts[coin] += remainingCoinAmount;
				} else if (coin !== remainingCoinType) {
					var convertedValue = calculateCoin(coin, remainingCoinAmount, remainingCoinType);
					scrubbedCoinOpts[coin] += convertedValue;
				}
			}

			//Get the coins that evenly distribute and it to the results list
			var wholeCoins = Math.floor(scrubbedCoinOpts[coin] / partyMemCount);
			for (var i=0; i<partyMemCount; i++) {
				coinsByMember[i][coin] += wholeCoins;
			}

			//Get the leftover coins that don't evenly distribute
			remainingCoinAmount = scrubbedCoinOpts[coin] % partyMemCount;
			remainingCoinType = coin;

			//Add any remaining coppers that don't evenly distribute
			if (remainingCoinType === "cp" && remainingCoinAmount > 0) {
				for (var i=0; i<remainingCoinAmount; i++) {
					coinsByMember[i][remainingCoinType] += 1;
				}
			}
		}

		//Optimize the remaining values
		for (var i=0; i<coinsByMember.length; i++) {
			coinsByMember[i] = optimalExchange(coinsByMember[i]);
		}
		return coinsByMember;
	};
  
	return {
  		optimalExchange : optimalExchange,
  		teamSplit : teamSplit
	};

})();

module.exports = ExchangeRate;