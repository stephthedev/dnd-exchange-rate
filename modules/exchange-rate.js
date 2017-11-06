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

	var calculateCoin = function(desiredCoinType, currentCoin, currentCoinType) {
		var coinRate = config.get("coin." + currentCoinType + "." + desiredCoinType + ".rate");
		return (currentCoin * coinRate);
	}

	var calculateModCoin = function(desiredCoinType, currentCoin, currentCoinType) {
		var denominator = getDenominatorFromRate(config.get("coin." + currentCoinType + "." + desiredCoinType + ".label"));
		return (currentCoin % denominator);
	}

	var exchange = function (currentCoinCount, currentCoinType, conversion) {
		var remainingCoins = currentCoinCount;
		for (var highestCoinType in config.get("coin")) {
			//If we're converting to the same coin type (i.e. cp to cp), then ignore calculations and just store it
			if ((currentCoinType === highestCoinType)) {
				conversion[currentCoinType] += remainingCoins;
				return;
			}

			//Convert to a higher coin type, if possible
			var quotient = Math.floor(calculateCoin(highestCoinType, remainingCoins, currentCoinType));
			remainingCoins = calculateModCoin(highestCoinType, remainingCoins, currentCoinType);
			conversion[highestCoinType] += quotient;
		}
	};

	var optimalExchange = function (cpCount, spCount, epCount, gpCount, ppCount) {
		//1. Init the base coin conversions to 0
		var conversion = {};
		for (var key in config.get("coin")) {
			conversion[key] = 0;
		}

		if (isInt(cpCount) && cpCount > 0) {
			exchange(parseInt(cpCount), "cp", conversion);
		}
		if (isInt(spCount) && spCount > 0) {
			exchange(parseInt(spCount), "sp", conversion);
		}
		if (isInt(epCount) && epCount > 0) {
			exchange(parseInt(epCount), "ep", conversion);
		}
		if (isInt(gpCount) && gpCount > 0) {
			exchange(parseInt(gpCount), "gp", conversion);
		}
		if (isInt(ppCount) && ppCount > 0) {
			exchange(parseInt(ppCount), "pp", conversion);
		}
		
		return conversion;
	};
  
	return {
    	optimalExchange : optimalExchange
  	};

})();

module.exports = ExchangeRate;