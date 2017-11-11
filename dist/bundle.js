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
},{}],2:[function(require,module,exports){
module.exports = require("./exchange-rate");
},{"./exchange-rate":1}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZXhjaGFuZ2UtcmF0ZS5qcyIsInNyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9KQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgY29uZmlnID0gKGZ1bmN0aW9uIChwcm9wcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBfZ2V0QnlQcm9wUGF0aCA9IGZ1bmN0aW9uIChvLCBzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvNjQ5MTYyMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMgPSBzLnJlcGxhY2UoL1xcWyhcXHcrKVxcXS9nLCAnLiQxJyk7IC8vIGNvbnZlcnQgaW5kZXhlcyB0byBwcm9wZXJ0aWVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcyA9IHMucmVwbGFjZSgvXlxcLi8sICcnKTsgICAgICAgICAgIC8vIHN0cmlwIGEgbGVhZGluZyBkb3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYSA9IHMuc3BsaXQoJy4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbiA9IGEubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBrID0gYVtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGsgaW4gbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbyA9IG9ba107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG87XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmdldCA9IGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF9nZXRCeVByb3BQYXRoKHByb3BzLCBhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgICAgICAgICAgICAgICB9KSh7XCJDbGllbnRcIjp7XCJjb2luXCI6e1wicHBcIjp7XCJjcFwiOntcInJhdGVcIjoxMDAwLFwibGFiZWxcIjpcIjEwMDBcIn0sXCJzcFwiOntcInJhdGVcIjoxMDAsXCJsYWJlbFwiOlwiMTAwXCJ9LFwiZXBcIjp7XCJyYXRlXCI6MjAsXCJsYWJlbFwiOlwiMjBcIn0sXCJncFwiOntcInJhdGVcIjoxMCxcImxhYmVsXCI6XCIxMFwifSxcInBwXCI6e1wicmF0ZVwiOjEsXCJsYWJlbFwiOlwiMVwifX0sXCJncFwiOntcImNwXCI6e1wicmF0ZVwiOjEwMCxcImxhYmVsXCI6XCIxMDBcIn0sXCJzcFwiOntcInJhdGVcIjoxMCxcImxhYmVsXCI6XCIxMFwifSxcImVwXCI6e1wicmF0ZVwiOjIsXCJsYWJlbFwiOlwiMlwifSxcImdwXCI6e1wicmF0ZVwiOjEsXCJsYWJlbFwiOlwiMVwifSxcInBwXCI6e1wicmF0ZVwiOjAuMSxcImxhYmVsXCI6XCIxLzEwXCJ9fSxcImVwXCI6e1wiY3BcIjp7XCJyYXRlXCI6NTAsXCJsYWJlbFwiOlwiNTBcIn0sXCJzcFwiOntcInJhdGVcIjo1LFwibGFiZWxcIjpcIjVcIn0sXCJlcFwiOntcInJhdGVcIjoxLFwibGFiZWxcIjpcIjFcIn0sXCJncFwiOntcInJhdGVcIjowLjUsXCJsYWJlbFwiOlwiMS8yXCJ9LFwicHBcIjp7XCJyYXRlXCI6MC4wNSxcImxhYmVsXCI6XCIxLzIwXCJ9fSxcInNwXCI6e1wiY3BcIjp7XCJyYXRlXCI6MTAsXCJsYWJlbFwiOlwiMTBcIn0sXCJzcFwiOntcInJhdGVcIjoxLFwibGFiZWxcIjpcIjFcIn0sXCJlcFwiOntcInJhdGVcIjowLjIsXCJsYWJlbFwiOlwiMS81XCJ9LFwiZ3BcIjp7XCJyYXRlXCI6MC4xLFwibGFiZWxcIjpcIjEvMTBcIn0sXCJwcFwiOntcInJhdGVcIjowLjAxLFwibGFiZWxcIjpcIjEvMTAwXCJ9fSxcImNwXCI6e1wiY3BcIjp7XCJyYXRlXCI6MSxcImxhYmVsXCI6XCIxXCJ9LFwic3BcIjp7XCJyYXRlXCI6MC4xLFwibGFiZWxcIjpcIjEvMTBcIn0sXCJlcFwiOntcInJhdGVcIjowLjAyLFwibGFiZWxcIjpcIjEvNTBcIn0sXCJncFwiOntcInJhdGVcIjowLjAxLFwibGFiZWxcIjpcIjEvMTAwXCJ9LFwicHBcIjp7XCJyYXRlXCI6MC4wMDEsXCJsYWJlbFwiOlwiMS8xMDAwXCJ9fX19fSk7O1xuXG52YXIgRXhjaGFuZ2VSYXRlID0gKGZ1bmN0aW9uICgpIHtcblx0dmFyIGlzSW50ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgXHRcdHJldHVybiAhaXNOYU4odmFsdWUpICYmIHBhcnNlSW50KE51bWJlcih2YWx1ZSkpID09IHZhbHVlICYmICFpc05hTihwYXJzZUludCh2YWx1ZSwgMTApKTtcblx0fTtcblxuXHR2YXIgc2NydWJDb2luT3B0cyA9IGZ1bmN0aW9uKGNvaW5PcHRzKSB7XG5cdFx0dmFyIHNjcnViYmVkQ29pbk9wdHMgPSB7fTtcblx0XHRmb3IgKHZhciBjb2luIGluIGNvaW5PcHRzKSB7XG5cdFx0XHRpZiAoaXNJbnQoY29pbk9wdHNbY29pbl0pKSB7XG5cdFx0XHRcdHNjcnViYmVkQ29pbk9wdHNbY29pbl0gPSBwYXJzZUludChjb2luT3B0c1tjb2luXSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRzY3J1YmJlZENvaW5PcHRzW2NvaW5dID0gMDtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHNjcnViYmVkQ29pbk9wdHM7XG5cdH1cblxuXHR2YXIgZ2V0RGVub21pbmF0b3JGcm9tUmF0ZSA9IGZ1bmN0aW9uKGxhYmVsKSB7XG5cdFx0aWYgKGxhYmVsLmluY2x1ZGVzKFwiL1wiKSkge1xuXHRcdFx0cmV0dXJuIHBhcnNlSW50KGxhYmVsLnNwbGl0KFwiL1wiKVsxXSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiAxO1xuXHRcdH1cblx0XHRcblx0fTtcblxuXHR2YXIgY2FsY3VsYXRlQ29pbiA9IGZ1bmN0aW9uKHRvQ29pblR5cGUsIGZyb21Db2luQW1vdW50LCBmcm9tQ29pblR5cGUpIHtcblx0XHR2YXIgY29pblJhdGUgPSBjb25maWcuZ2V0KFwiQ2xpZW50LmNvaW4uXCIgKyBmcm9tQ29pblR5cGUgKyBcIi5cIiArIHRvQ29pblR5cGUgKyBcIi5yYXRlXCIpO1xuXHRcdHJldHVybiAoZnJvbUNvaW5BbW91bnQgKiBjb2luUmF0ZSk7XG5cdH1cblxuXHR2YXIgY2FsY3VsYXRlTW9kQ29pbiA9IGZ1bmN0aW9uKHRvQ29pblR5cGUsIGZyb21Db2luQW1vdW50LCBmcm9tQ29pblR5cGUpIHtcblx0XHR2YXIgZGVub21pbmF0b3IgPSBnZXREZW5vbWluYXRvckZyb21SYXRlKGNvbmZpZy5nZXQoXCJDbGllbnQuY29pbi5cIiArIGZyb21Db2luVHlwZSArIFwiLlwiICsgdG9Db2luVHlwZSArIFwiLmxhYmVsXCIpKTtcblx0XHRyZXR1cm4gKGZyb21Db2luQW1vdW50ICUgZGVub21pbmF0b3IpO1xuXHR9XG5cblx0dmFyIGV4Y2hhbmdlID0gZnVuY3Rpb24gKGZyb21Db2luQW1vdW50LCBmcm9tQ29pblR5cGUsIHJlc3VsdENvaW5zKSB7XG5cdFx0dmFyIHJlbWFpbmluZ0NvaW5zID0gZnJvbUNvaW5BbW91bnQ7XG5cdFx0Zm9yICh2YXIgaGlnaGVzdENvaW5UeXBlIGluIGNvbmZpZy5nZXQoXCJDbGllbnQuY29pblwiKSkge1xuXHRcdFx0Ly9JZiB3ZSdyZSBjb252ZXJ0aW5nIHRvIHRoZSBzYW1lIGNvaW4gdHlwZSAoaS5lLiBjcCB0byBjcCksIHRoZW4gaWdub3JlIGNhbGN1bGF0aW9ucyBhbmQganVzdCBzdG9yZSBpdFxuXHRcdFx0aWYgKChmcm9tQ29pblR5cGUgPT09IGhpZ2hlc3RDb2luVHlwZSkpIHtcblx0XHRcdFx0cmVzdWx0Q29pbnNbZnJvbUNvaW5UeXBlXSArPSByZW1haW5pbmdDb2lucztcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHQvL0NvbnZlcnQgdG8gYSBoaWdoZXIgY29pbiB0eXBlLCBpZiBwb3NzaWJsZVxuXHRcdFx0dmFyIHF1b3RpZW50ID0gTWF0aC5mbG9vcihjYWxjdWxhdGVDb2luKGhpZ2hlc3RDb2luVHlwZSwgcmVtYWluaW5nQ29pbnMsIGZyb21Db2luVHlwZSkpO1xuXHRcdFx0cmVtYWluaW5nQ29pbnMgPSBjYWxjdWxhdGVNb2RDb2luKGhpZ2hlc3RDb2luVHlwZSwgcmVtYWluaW5nQ29pbnMsIGZyb21Db2luVHlwZSk7XG5cdFx0XHRyZXN1bHRDb2luc1toaWdoZXN0Q29pblR5cGVdICs9IHF1b3RpZW50O1xuXHRcdH1cblx0fTtcblxuXHR2YXIgb3B0aW1hbEV4Y2hhbmdlID0gZnVuY3Rpb24gKGNvaW5PcHRzKSB7XG5cdFx0Ly8xLiBJbml0IHRoZSBiYXNlIGNvaW4gY29udmVyc2lvbnMgdG8gMFxuXHRcdHZhciByZXN1bHRzID0ge307XG5cdFx0Zm9yICh2YXIga2V5IGluIGNvbmZpZy5nZXQoXCJDbGllbnQuY29pblwiKSkge1xuXHRcdFx0cmVzdWx0c1trZXldID0gMDtcblx0XHR9XG5cblx0XHQvLzIuIENvbnZlcnQgdGhlIGNvaW5zXG5cdFx0Zm9yICh2YXIgY29pbiBpbiBjb2luT3B0cykge1xuXHRcdFx0aWYgKGlzSW50KGNvaW5PcHRzW2NvaW5dKSAmJiBjb2luT3B0c1tjb2luXSA+IDApIHtcblx0XHRcdFx0ZXhjaGFuZ2UocGFyc2VJbnQoY29pbk9wdHNbY29pbl0pLCBjb2luLCByZXN1bHRzKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0XG5cdFx0cmV0dXJuIHJlc3VsdHM7XG5cdH07XG5cblx0dmFyIHRlYW1TcGxpdCA9IGZ1bmN0aW9uKHBhcnR5TWVtQ291bnQsIGNvaW5PcHRzKSB7XG5cdFx0aWYgKGlzSW50KHBhcnR5TWVtQ291bnQpICYmIHBhcnR5TWVtQ291bnQgPD0gMSkge1xuXHRcdFx0cmV0dXJuIFtvcHRpbWFsRXhjaGFuZ2UoY29pbk9wdHMpXTtcblx0XHR9IFxuXG5cdFx0Ly8xLiBDcmVhdGUgYSBjb2xsZWN0aW9uIG9mIGFsbC16ZXJvIHJlc3VsdHMgZm9yIGFsbCBwYXJ0eSBtZW1iZXJzXG5cdFx0dmFyIGNvaW5zQnlNZW1iZXIgPSBbXTtcblx0XHRmb3IgKHZhciBpPTA7IGk8cGFydHlNZW1Db3VudDsgaSsrKSB7XG5cdFx0XHR2YXIgYWxsWmVyb0NvaW5zID0ge307XG5cdFx0XHRmb3IgKHZhciBjb2luIGluIGNvbmZpZy5nZXQoXCJDbGllbnQuY29pblwiKSkge1xuXHRcdFx0XHRhbGxaZXJvQ29pbnNbY29pbl0gPSAwO1xuXHRcdFx0fVxuXHRcdFx0Y29pbnNCeU1lbWJlci5wdXNoKGFsbFplcm9Db2lucyk7XG5cdFx0fVxuXG5cdFx0Ly8yLiBTY3J1YiB0aGUgY29pbnMgc28gdGhhdCBpdCdzIGFsbCBudW1iZXJzXG5cdFx0dmFyIHNjcnViYmVkQ29pbk9wdHMgPSBzY3J1YkNvaW5PcHRzKGNvaW5PcHRzKTtcblxuXHRcdHZhciByZW1haW5pbmdDb2luQW1vdW50ID0gMDtcblx0XHR2YXIgcmVtYWluaW5nQ29pblR5cGUgPSBudWxsO1xuXHRcdGZvciAodmFyIGNvaW4gaW4gY29uZmlnLmdldChcIkNsaWVudC5jb2luXCIpKSB7XG5cdFx0XHQvL1Rha2UgYW55IHJlbWFpbmluZyBjb2lucyBhbmQgZWl0aGVyIFxuXHRcdFx0Ly9BLiBleGNoYW5nZSBpdCB0byBhIGxvd2VyIGNvaW4gdmFsdWUgb3Jcblx0XHRcdC8vQi4gYWRkIGFueSByZW1haW5pbmcgY29wcGVycyBmb3IgZnVydGhlciBwcm9jZXNzaW5nXG5cdFx0XHRpZiAocmVtYWluaW5nQ29pbkFtb3VudCA+IDApIHtcblx0XHRcdFx0aWYgKHJlbWFpbmluZ0NvaW5UeXBlID09PSBcImNwXCIpIHtcblx0XHRcdFx0XHRzY3J1YmJlZENvaW5PcHRzW2NvaW5dICs9IHJlbWFpbmluZ0NvaW5BbW91bnQ7XG5cdFx0XHRcdH0gZWxzZSBpZiAoY29pbiAhPT0gcmVtYWluaW5nQ29pblR5cGUpIHtcblx0XHRcdFx0XHR2YXIgY29udmVydGVkVmFsdWUgPSBjYWxjdWxhdGVDb2luKGNvaW4sIHJlbWFpbmluZ0NvaW5BbW91bnQsIHJlbWFpbmluZ0NvaW5UeXBlKTtcblx0XHRcdFx0XHRzY3J1YmJlZENvaW5PcHRzW2NvaW5dICs9IGNvbnZlcnRlZFZhbHVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vR2V0IHRoZSBjb2lucyB0aGF0IGV2ZW5seSBkaXN0cmlidXRlIGFuZCBpdCB0byB0aGUgcmVzdWx0cyBsaXN0XG5cdFx0XHR2YXIgd2hvbGVDb2lucyA9IE1hdGguZmxvb3Ioc2NydWJiZWRDb2luT3B0c1tjb2luXSAvIHBhcnR5TWVtQ291bnQpO1xuXHRcdFx0Zm9yICh2YXIgaT0wOyBpPHBhcnR5TWVtQ291bnQ7IGkrKykge1xuXHRcdFx0XHRjb2luc0J5TWVtYmVyW2ldW2NvaW5dICs9IHdob2xlQ29pbnM7XG5cdFx0XHR9XG5cblx0XHRcdC8vR2V0IHRoZSBsZWZ0b3ZlciBjb2lucyB0aGF0IGRvbid0IGV2ZW5seSBkaXN0cmlidXRlXG5cdFx0XHRyZW1haW5pbmdDb2luQW1vdW50ID0gc2NydWJiZWRDb2luT3B0c1tjb2luXSAlIHBhcnR5TWVtQ291bnQ7XG5cdFx0XHRyZW1haW5pbmdDb2luVHlwZSA9IGNvaW47XG5cblx0XHRcdC8vQWRkIGFueSByZW1haW5pbmcgY29wcGVycyB0aGF0IGRvbid0IGV2ZW5seSBkaXN0cmlidXRlXG5cdFx0XHRpZiAocmVtYWluaW5nQ29pblR5cGUgPT09IFwiY3BcIiAmJiByZW1haW5pbmdDb2luQW1vdW50ID4gMCkge1xuXHRcdFx0XHRmb3IgKHZhciBpPTA7IGk8cmVtYWluaW5nQ29pbkFtb3VudDsgaSsrKSB7XG5cdFx0XHRcdFx0Y29pbnNCeU1lbWJlcltpXVtyZW1haW5pbmdDb2luVHlwZV0gKz0gMTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vT3B0aW1pemUgdGhlIHJlbWFpbmluZyB2YWx1ZXNcblx0XHRmb3IgKHZhciBpPTA7IGk8Y29pbnNCeU1lbWJlci5sZW5ndGg7IGkrKykge1xuXHRcdFx0Y29pbnNCeU1lbWJlcltpXSA9IG9wdGltYWxFeGNoYW5nZShjb2luc0J5TWVtYmVyW2ldKTtcblx0XHR9XG5cdFx0cmV0dXJuIGNvaW5zQnlNZW1iZXI7XG5cdH07XG4gIFxuXHRyZXR1cm4ge1xuICBcdFx0b3B0aW1hbEV4Y2hhbmdlIDogb3B0aW1hbEV4Y2hhbmdlLFxuICBcdFx0dGVhbVNwbGl0IDogdGVhbVNwbGl0XG5cdH07XG5cbn0pKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gRXhjaGFuZ2VSYXRlOyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vZXhjaGFuZ2UtcmF0ZVwiKTsiXX0=
