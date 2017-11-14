(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ExchangeRate = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var config = (function (props) {
                        var self = {};
                        var _getByPropPath = function (o, s) {
                            // http://stackoverflow.com/a/6491621
                            s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
                            s = s.replace(/^\./, '');           // strip a leading dot
                            var a = s.split('.');
                            for (var i = 0, n = a.length; i < n; ++i) {
                                var k = a[i];
                                if (k in o) {
                                    o = o[k];
                                } else {
                                    return;
                                }
                            }
                            return o;
                        };

                        self.get = function (a) {
                            return _getByPropPath(props, a);
                        };

                        return self;
                    })({"Client":{"coin":{"pp":{"cp":{"rate":1000,"label":"1000"},"sp":{"rate":100,"label":"100"},"ep":{"rate":20,"label":"20"},"gp":{"rate":10,"label":"10"},"pp":{"rate":1,"label":"1"}},"gp":{"cp":{"rate":100,"label":"100"},"sp":{"rate":10,"label":"10"},"ep":{"rate":2,"label":"2"},"gp":{"rate":1,"label":"1"},"pp":{"rate":0.1,"label":"1/10"}},"ep":{"cp":{"rate":50,"label":"50"},"sp":{"rate":5,"label":"5"},"ep":{"rate":1,"label":"1"},"gp":{"rate":0.5,"label":"1/2"},"pp":{"rate":0.05,"label":"1/20"}},"sp":{"cp":{"rate":10,"label":"10"},"sp":{"rate":1,"label":"1"},"ep":{"rate":0.2,"label":"1/5"},"gp":{"rate":0.1,"label":"1/10"},"pp":{"rate":0.01,"label":"1/100"}},"cp":{"cp":{"rate":1,"label":"1"},"sp":{"rate":0.1,"label":"1/10"},"ep":{"rate":0.02,"label":"1/50"},"gp":{"rate":0.01,"label":"1/100"},"pp":{"rate":0.001,"label":"1/1000"}}}}});;

var ExchangeRate = (function () {
	var isInt = function(value) {
  		return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
	};

	var scrubCoins = function(coins) {
		var scrubbedCoins = {};
		for (var coin in config.get("Client.coin")) {
			if (isInt(coins[coin])) {
				scrubbedCoins[coin] = parseInt(coins[coin]);
			} else {
				scrubbedCoins[coin] = 0;
			}
		}
		return scrubbedCoins;
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

	var exchange = function (fromCoinAmount, fromCoinType, resultCoins, desiredCoins) {
		var remainingCoins = fromCoinAmount;
		for (var highestCoinType in config.get("Client.coin")) {
			if (desiredCoins.length > 0 && desiredCoins.indexOf(highestCoinType) == -1) {
				//This is not a desired coin
				continue;
			}

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

	var optimalExchange = function (coins, desiredCoins) {
		if (desiredCoins == null || desiredCoins == undefined) {
			desiredCoins = [];
		}

		//1. Init the base coin conversions to 0
		var results = {};
		for (var key in config.get("Client.coin")) {
			results[key] = 0;
		}

		var scrubbedCoins = scrubCoins(coins);

		//2. Convert the coins
		for (var coin in scrubbedCoins) {
			if (scrubbedCoins[coin] > 0) {
				exchange(scrubbedCoins[coin], coin, results, desiredCoins);
			}
		}
		
		return results;
	};

	var teamSplit = function(partyMemCount, coins, desiredCoins) {
		if (desiredCoins == null || desiredCoins == undefined) {
			desiredCoins = [];
		}

		if (isInt(partyMemCount) && partyMemCount <= 1) {
			return [optimalExchange(coins)];
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
		var scrubbedCoins = scrubCoins(coins);

		var remainingCoinAmount = 0;
		var remainingCoinType = null;
		for (var coin in config.get("Client.coin")) {
			//Take any remaining coins and either 
			//A. exchange it to a lower coin value or
			//B. add any remaining coppers for further processing
			if (remainingCoinAmount > 0) {
				if (remainingCoinType === "cp") {
					scrubbedCoins[coin] += remainingCoinAmount;
				} else if (coin !== remainingCoinType) {
					var convertedValue = calculateCoin(coin, remainingCoinAmount, remainingCoinType);
					scrubbedCoins[coin] += convertedValue;
				}
			}

			//Get the coins that evenly distribute and it to the results list
			var wholeCoins = Math.floor(scrubbedCoins[coin] / partyMemCount);
			for (var i=0; i<partyMemCount; i++) {
				coinsByMember[i][coin] += wholeCoins;
			}

			//Get the leftover coins that don't evenly distribute
			remainingCoinAmount = scrubbedCoins[coin] % partyMemCount;
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
			coinsByMember[i] = optimalExchange(coinsByMember[i], desiredCoins);
		}
		return coinsByMember;
	};
  
	return {
  		optimalExchange : optimalExchange,
  		teamSplit : teamSplit
	};

})();

module.exports = ExchangeRate;
},{}],2:[function(require,module,exports){
module.exports = require("./exchange-rate");
},{"./exchange-rate":1}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZXhjaGFuZ2UtcmF0ZS5qcyIsInNyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlLQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgY29uZmlnID0gKGZ1bmN0aW9uIChwcm9wcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBfZ2V0QnlQcm9wUGF0aCA9IGZ1bmN0aW9uIChvLCBzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvNjQ5MTYyMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMgPSBzLnJlcGxhY2UoL1xcWyhcXHcrKVxcXS9nLCAnLiQxJyk7IC8vIGNvbnZlcnQgaW5kZXhlcyB0byBwcm9wZXJ0aWVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcyA9IHMucmVwbGFjZSgvXlxcLi8sICcnKTsgICAgICAgICAgIC8vIHN0cmlwIGEgbGVhZGluZyBkb3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYSA9IHMuc3BsaXQoJy4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbiA9IGEubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBrID0gYVtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGsgaW4gbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbyA9IG9ba107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG87XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmdldCA9IGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF9nZXRCeVByb3BQYXRoKHByb3BzLCBhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgICAgICAgICAgICAgICB9KSh7XCJDbGllbnRcIjp7XCJjb2luXCI6e1wicHBcIjp7XCJjcFwiOntcInJhdGVcIjoxMDAwLFwibGFiZWxcIjpcIjEwMDBcIn0sXCJzcFwiOntcInJhdGVcIjoxMDAsXCJsYWJlbFwiOlwiMTAwXCJ9LFwiZXBcIjp7XCJyYXRlXCI6MjAsXCJsYWJlbFwiOlwiMjBcIn0sXCJncFwiOntcInJhdGVcIjoxMCxcImxhYmVsXCI6XCIxMFwifSxcInBwXCI6e1wicmF0ZVwiOjEsXCJsYWJlbFwiOlwiMVwifX0sXCJncFwiOntcImNwXCI6e1wicmF0ZVwiOjEwMCxcImxhYmVsXCI6XCIxMDBcIn0sXCJzcFwiOntcInJhdGVcIjoxMCxcImxhYmVsXCI6XCIxMFwifSxcImVwXCI6e1wicmF0ZVwiOjIsXCJsYWJlbFwiOlwiMlwifSxcImdwXCI6e1wicmF0ZVwiOjEsXCJsYWJlbFwiOlwiMVwifSxcInBwXCI6e1wicmF0ZVwiOjAuMSxcImxhYmVsXCI6XCIxLzEwXCJ9fSxcImVwXCI6e1wiY3BcIjp7XCJyYXRlXCI6NTAsXCJsYWJlbFwiOlwiNTBcIn0sXCJzcFwiOntcInJhdGVcIjo1LFwibGFiZWxcIjpcIjVcIn0sXCJlcFwiOntcInJhdGVcIjoxLFwibGFiZWxcIjpcIjFcIn0sXCJncFwiOntcInJhdGVcIjowLjUsXCJsYWJlbFwiOlwiMS8yXCJ9LFwicHBcIjp7XCJyYXRlXCI6MC4wNSxcImxhYmVsXCI6XCIxLzIwXCJ9fSxcInNwXCI6e1wiY3BcIjp7XCJyYXRlXCI6MTAsXCJsYWJlbFwiOlwiMTBcIn0sXCJzcFwiOntcInJhdGVcIjoxLFwibGFiZWxcIjpcIjFcIn0sXCJlcFwiOntcInJhdGVcIjowLjIsXCJsYWJlbFwiOlwiMS81XCJ9LFwiZ3BcIjp7XCJyYXRlXCI6MC4xLFwibGFiZWxcIjpcIjEvMTBcIn0sXCJwcFwiOntcInJhdGVcIjowLjAxLFwibGFiZWxcIjpcIjEvMTAwXCJ9fSxcImNwXCI6e1wiY3BcIjp7XCJyYXRlXCI6MSxcImxhYmVsXCI6XCIxXCJ9LFwic3BcIjp7XCJyYXRlXCI6MC4xLFwibGFiZWxcIjpcIjEvMTBcIn0sXCJlcFwiOntcInJhdGVcIjowLjAyLFwibGFiZWxcIjpcIjEvNTBcIn0sXCJncFwiOntcInJhdGVcIjowLjAxLFwibGFiZWxcIjpcIjEvMTAwXCJ9LFwicHBcIjp7XCJyYXRlXCI6MC4wMDEsXCJsYWJlbFwiOlwiMS8xMDAwXCJ9fX19fSk7O1xuXG52YXIgRXhjaGFuZ2VSYXRlID0gKGZ1bmN0aW9uICgpIHtcblx0dmFyIGlzSW50ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgXHRcdHJldHVybiAhaXNOYU4odmFsdWUpICYmIHBhcnNlSW50KE51bWJlcih2YWx1ZSkpID09IHZhbHVlICYmICFpc05hTihwYXJzZUludCh2YWx1ZSwgMTApKTtcblx0fTtcblxuXHR2YXIgc2NydWJDb2lucyA9IGZ1bmN0aW9uKGNvaW5zKSB7XG5cdFx0dmFyIHNjcnViYmVkQ29pbnMgPSB7fTtcblx0XHRmb3IgKHZhciBjb2luIGluIGNvbmZpZy5nZXQoXCJDbGllbnQuY29pblwiKSkge1xuXHRcdFx0aWYgKGlzSW50KGNvaW5zW2NvaW5dKSkge1xuXHRcdFx0XHRzY3J1YmJlZENvaW5zW2NvaW5dID0gcGFyc2VJbnQoY29pbnNbY29pbl0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0c2NydWJiZWRDb2luc1tjb2luXSA9IDA7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBzY3J1YmJlZENvaW5zO1xuXHR9XG5cblx0dmFyIGdldERlbm9taW5hdG9yRnJvbVJhdGUgPSBmdW5jdGlvbihsYWJlbCkge1xuXHRcdGlmIChsYWJlbC5pbmNsdWRlcyhcIi9cIikpIHtcblx0XHRcdHJldHVybiBwYXJzZUludChsYWJlbC5zcGxpdChcIi9cIilbMV0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gMTtcblx0XHR9XG5cdFx0XG5cdH07XG5cblx0dmFyIGNhbGN1bGF0ZUNvaW4gPSBmdW5jdGlvbih0b0NvaW5UeXBlLCBmcm9tQ29pbkFtb3VudCwgZnJvbUNvaW5UeXBlKSB7XG5cdFx0dmFyIGNvaW5SYXRlID0gY29uZmlnLmdldChcIkNsaWVudC5jb2luLlwiICsgZnJvbUNvaW5UeXBlICsgXCIuXCIgKyB0b0NvaW5UeXBlICsgXCIucmF0ZVwiKTtcblx0XHRyZXR1cm4gKGZyb21Db2luQW1vdW50ICogY29pblJhdGUpO1xuXHR9XG5cblx0dmFyIGNhbGN1bGF0ZU1vZENvaW4gPSBmdW5jdGlvbih0b0NvaW5UeXBlLCBmcm9tQ29pbkFtb3VudCwgZnJvbUNvaW5UeXBlKSB7XG5cdFx0dmFyIGRlbm9taW5hdG9yID0gZ2V0RGVub21pbmF0b3JGcm9tUmF0ZShjb25maWcuZ2V0KFwiQ2xpZW50LmNvaW4uXCIgKyBmcm9tQ29pblR5cGUgKyBcIi5cIiArIHRvQ29pblR5cGUgKyBcIi5sYWJlbFwiKSk7XG5cdFx0cmV0dXJuIChmcm9tQ29pbkFtb3VudCAlIGRlbm9taW5hdG9yKTtcblx0fVxuXG5cdHZhciBleGNoYW5nZSA9IGZ1bmN0aW9uIChmcm9tQ29pbkFtb3VudCwgZnJvbUNvaW5UeXBlLCByZXN1bHRDb2lucywgZGVzaXJlZENvaW5zKSB7XG5cdFx0dmFyIHJlbWFpbmluZ0NvaW5zID0gZnJvbUNvaW5BbW91bnQ7XG5cdFx0Zm9yICh2YXIgaGlnaGVzdENvaW5UeXBlIGluIGNvbmZpZy5nZXQoXCJDbGllbnQuY29pblwiKSkge1xuXHRcdFx0aWYgKGRlc2lyZWRDb2lucy5sZW5ndGggPiAwICYmIGRlc2lyZWRDb2lucy5pbmRleE9mKGhpZ2hlc3RDb2luVHlwZSkgPT0gLTEpIHtcblx0XHRcdFx0Ly9UaGlzIGlzIG5vdCBhIGRlc2lyZWQgY29pblxuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblxuXHRcdFx0Ly9JZiB3ZSdyZSBjb252ZXJ0aW5nIHRvIHRoZSBzYW1lIGNvaW4gdHlwZSAoaS5lLiBjcCB0byBjcCksIHRoZW4gaWdub3JlIGNhbGN1bGF0aW9ucyBhbmQganVzdCBzdG9yZSBpdFxuXHRcdFx0aWYgKChmcm9tQ29pblR5cGUgPT09IGhpZ2hlc3RDb2luVHlwZSkpIHtcblx0XHRcdFx0cmVzdWx0Q29pbnNbZnJvbUNvaW5UeXBlXSArPSByZW1haW5pbmdDb2lucztcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHQvL0NvbnZlcnQgdG8gYSBoaWdoZXIgY29pbiB0eXBlLCBpZiBwb3NzaWJsZVxuXHRcdFx0dmFyIHF1b3RpZW50ID0gTWF0aC5mbG9vcihjYWxjdWxhdGVDb2luKGhpZ2hlc3RDb2luVHlwZSwgcmVtYWluaW5nQ29pbnMsIGZyb21Db2luVHlwZSkpO1xuXHRcdFx0cmVtYWluaW5nQ29pbnMgPSBjYWxjdWxhdGVNb2RDb2luKGhpZ2hlc3RDb2luVHlwZSwgcmVtYWluaW5nQ29pbnMsIGZyb21Db2luVHlwZSk7XG5cdFx0XHRyZXN1bHRDb2luc1toaWdoZXN0Q29pblR5cGVdICs9IHF1b3RpZW50O1xuXHRcdH1cblx0fTtcblxuXHR2YXIgb3B0aW1hbEV4Y2hhbmdlID0gZnVuY3Rpb24gKGNvaW5zLCBkZXNpcmVkQ29pbnMpIHtcblx0XHRpZiAoZGVzaXJlZENvaW5zID09IG51bGwgfHwgZGVzaXJlZENvaW5zID09IHVuZGVmaW5lZCkge1xuXHRcdFx0ZGVzaXJlZENvaW5zID0gW107XG5cdFx0fVxuXG5cdFx0Ly8xLiBJbml0IHRoZSBiYXNlIGNvaW4gY29udmVyc2lvbnMgdG8gMFxuXHRcdHZhciByZXN1bHRzID0ge307XG5cdFx0Zm9yICh2YXIga2V5IGluIGNvbmZpZy5nZXQoXCJDbGllbnQuY29pblwiKSkge1xuXHRcdFx0cmVzdWx0c1trZXldID0gMDtcblx0XHR9XG5cblx0XHR2YXIgc2NydWJiZWRDb2lucyA9IHNjcnViQ29pbnMoY29pbnMpO1xuXG5cdFx0Ly8yLiBDb252ZXJ0IHRoZSBjb2luc1xuXHRcdGZvciAodmFyIGNvaW4gaW4gc2NydWJiZWRDb2lucykge1xuXHRcdFx0aWYgKHNjcnViYmVkQ29pbnNbY29pbl0gPiAwKSB7XG5cdFx0XHRcdGV4Y2hhbmdlKHNjcnViYmVkQ29pbnNbY29pbl0sIGNvaW4sIHJlc3VsdHMsIGRlc2lyZWRDb2lucyk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdFxuXHRcdHJldHVybiByZXN1bHRzO1xuXHR9O1xuXG5cdHZhciB0ZWFtU3BsaXQgPSBmdW5jdGlvbihwYXJ0eU1lbUNvdW50LCBjb2lucywgZGVzaXJlZENvaW5zKSB7XG5cdFx0aWYgKGRlc2lyZWRDb2lucyA9PSBudWxsIHx8IGRlc2lyZWRDb2lucyA9PSB1bmRlZmluZWQpIHtcblx0XHRcdGRlc2lyZWRDb2lucyA9IFtdO1xuXHRcdH1cblxuXHRcdGlmIChpc0ludChwYXJ0eU1lbUNvdW50KSAmJiBwYXJ0eU1lbUNvdW50IDw9IDEpIHtcblx0XHRcdHJldHVybiBbb3B0aW1hbEV4Y2hhbmdlKGNvaW5zKV07XG5cdFx0fSBcblxuXHRcdC8vMS4gQ3JlYXRlIGEgY29sbGVjdGlvbiBvZiBhbGwtemVybyByZXN1bHRzIGZvciBhbGwgcGFydHkgbWVtYmVyc1xuXHRcdHZhciBjb2luc0J5TWVtYmVyID0gW107XG5cdFx0Zm9yICh2YXIgaT0wOyBpPHBhcnR5TWVtQ291bnQ7IGkrKykge1xuXHRcdFx0dmFyIGFsbFplcm9Db2lucyA9IHt9O1xuXHRcdFx0Zm9yICh2YXIgY29pbiBpbiBjb25maWcuZ2V0KFwiQ2xpZW50LmNvaW5cIikpIHtcblx0XHRcdFx0YWxsWmVyb0NvaW5zW2NvaW5dID0gMDtcblx0XHRcdH1cblx0XHRcdGNvaW5zQnlNZW1iZXIucHVzaChhbGxaZXJvQ29pbnMpO1xuXHRcdH1cblxuXHRcdC8vMi4gU2NydWIgdGhlIGNvaW5zIHNvIHRoYXQgaXQncyBhbGwgbnVtYmVyc1xuXHRcdHZhciBzY3J1YmJlZENvaW5zID0gc2NydWJDb2lucyhjb2lucyk7XG5cblx0XHR2YXIgcmVtYWluaW5nQ29pbkFtb3VudCA9IDA7XG5cdFx0dmFyIHJlbWFpbmluZ0NvaW5UeXBlID0gbnVsbDtcblx0XHRmb3IgKHZhciBjb2luIGluIGNvbmZpZy5nZXQoXCJDbGllbnQuY29pblwiKSkge1xuXHRcdFx0Ly9UYWtlIGFueSByZW1haW5pbmcgY29pbnMgYW5kIGVpdGhlciBcblx0XHRcdC8vQS4gZXhjaGFuZ2UgaXQgdG8gYSBsb3dlciBjb2luIHZhbHVlIG9yXG5cdFx0XHQvL0IuIGFkZCBhbnkgcmVtYWluaW5nIGNvcHBlcnMgZm9yIGZ1cnRoZXIgcHJvY2Vzc2luZ1xuXHRcdFx0aWYgKHJlbWFpbmluZ0NvaW5BbW91bnQgPiAwKSB7XG5cdFx0XHRcdGlmIChyZW1haW5pbmdDb2luVHlwZSA9PT0gXCJjcFwiKSB7XG5cdFx0XHRcdFx0c2NydWJiZWRDb2luc1tjb2luXSArPSByZW1haW5pbmdDb2luQW1vdW50O1xuXHRcdFx0XHR9IGVsc2UgaWYgKGNvaW4gIT09IHJlbWFpbmluZ0NvaW5UeXBlKSB7XG5cdFx0XHRcdFx0dmFyIGNvbnZlcnRlZFZhbHVlID0gY2FsY3VsYXRlQ29pbihjb2luLCByZW1haW5pbmdDb2luQW1vdW50LCByZW1haW5pbmdDb2luVHlwZSk7XG5cdFx0XHRcdFx0c2NydWJiZWRDb2luc1tjb2luXSArPSBjb252ZXJ0ZWRWYWx1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvL0dldCB0aGUgY29pbnMgdGhhdCBldmVubHkgZGlzdHJpYnV0ZSBhbmQgaXQgdG8gdGhlIHJlc3VsdHMgbGlzdFxuXHRcdFx0dmFyIHdob2xlQ29pbnMgPSBNYXRoLmZsb29yKHNjcnViYmVkQ29pbnNbY29pbl0gLyBwYXJ0eU1lbUNvdW50KTtcblx0XHRcdGZvciAodmFyIGk9MDsgaTxwYXJ0eU1lbUNvdW50OyBpKyspIHtcblx0XHRcdFx0Y29pbnNCeU1lbWJlcltpXVtjb2luXSArPSB3aG9sZUNvaW5zO1xuXHRcdFx0fVxuXG5cdFx0XHQvL0dldCB0aGUgbGVmdG92ZXIgY29pbnMgdGhhdCBkb24ndCBldmVubHkgZGlzdHJpYnV0ZVxuXHRcdFx0cmVtYWluaW5nQ29pbkFtb3VudCA9IHNjcnViYmVkQ29pbnNbY29pbl0gJSBwYXJ0eU1lbUNvdW50O1xuXHRcdFx0cmVtYWluaW5nQ29pblR5cGUgPSBjb2luO1xuXG5cdFx0XHQvL0FkZCBhbnkgcmVtYWluaW5nIGNvcHBlcnMgdGhhdCBkb24ndCBldmVubHkgZGlzdHJpYnV0ZVxuXHRcdFx0aWYgKHJlbWFpbmluZ0NvaW5UeXBlID09PSBcImNwXCIgJiYgcmVtYWluaW5nQ29pbkFtb3VudCA+IDApIHtcblx0XHRcdFx0Zm9yICh2YXIgaT0wOyBpPHJlbWFpbmluZ0NvaW5BbW91bnQ7IGkrKykge1xuXHRcdFx0XHRcdGNvaW5zQnlNZW1iZXJbaV1bcmVtYWluaW5nQ29pblR5cGVdICs9IDE7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHQvL09wdGltaXplIHRoZSByZW1haW5pbmcgdmFsdWVzXG5cdFx0Zm9yICh2YXIgaT0wOyBpPGNvaW5zQnlNZW1iZXIubGVuZ3RoOyBpKyspIHtcblx0XHRcdGNvaW5zQnlNZW1iZXJbaV0gPSBvcHRpbWFsRXhjaGFuZ2UoY29pbnNCeU1lbWJlcltpXSwgZGVzaXJlZENvaW5zKTtcblx0XHR9XG5cdFx0cmV0dXJuIGNvaW5zQnlNZW1iZXI7XG5cdH07XG4gIFxuXHRyZXR1cm4ge1xuICBcdFx0b3B0aW1hbEV4Y2hhbmdlIDogb3B0aW1hbEV4Y2hhbmdlLFxuICBcdFx0dGVhbVNwbGl0IDogdGVhbVNwbGl0XG5cdH07XG5cbn0pKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gRXhjaGFuZ2VSYXRlOyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vZXhjaGFuZ2UtcmF0ZVwiKTsiXX0=
