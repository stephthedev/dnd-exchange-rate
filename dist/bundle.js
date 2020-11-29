(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ExchangeRate = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZXhjaGFuZ2UtcmF0ZS5qcyIsInNyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlLQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsInZhciBjb25maWcgPSAoZnVuY3Rpb24gKHByb3BzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIF9nZXRCeVByb3BQYXRoID0gZnVuY3Rpb24gKG8sIHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS82NDkxNjIxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcyA9IHMucmVwbGFjZSgvXFxbKFxcdyspXFxdL2csICcuJDEnKTsgLy8gY29udmVydCBpbmRleGVzIHRvIHByb3BlcnRpZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzID0gcy5yZXBsYWNlKC9eXFwuLywgJycpOyAgICAgICAgICAgLy8gc3RyaXAgYSBsZWFkaW5nIGRvdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhID0gcy5zcGxpdCgnLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBuID0gYS5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGsgPSBhW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoayBpbiBvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvID0gb1trXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbztcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZ2V0ID0gZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gX2dldEJ5UHJvcFBhdGgocHJvcHMsIGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICAgICAgICAgICAgICAgIH0pKHtcIkNsaWVudFwiOntcImNvaW5cIjp7XCJwcFwiOntcImNwXCI6e1wicmF0ZVwiOjEwMDAsXCJsYWJlbFwiOlwiMTAwMFwifSxcInNwXCI6e1wicmF0ZVwiOjEwMCxcImxhYmVsXCI6XCIxMDBcIn0sXCJlcFwiOntcInJhdGVcIjoyMCxcImxhYmVsXCI6XCIyMFwifSxcImdwXCI6e1wicmF0ZVwiOjEwLFwibGFiZWxcIjpcIjEwXCJ9LFwicHBcIjp7XCJyYXRlXCI6MSxcImxhYmVsXCI6XCIxXCJ9fSxcImdwXCI6e1wiY3BcIjp7XCJyYXRlXCI6MTAwLFwibGFiZWxcIjpcIjEwMFwifSxcInNwXCI6e1wicmF0ZVwiOjEwLFwibGFiZWxcIjpcIjEwXCJ9LFwiZXBcIjp7XCJyYXRlXCI6MixcImxhYmVsXCI6XCIyXCJ9LFwiZ3BcIjp7XCJyYXRlXCI6MSxcImxhYmVsXCI6XCIxXCJ9LFwicHBcIjp7XCJyYXRlXCI6MC4xLFwibGFiZWxcIjpcIjEvMTBcIn19LFwiZXBcIjp7XCJjcFwiOntcInJhdGVcIjo1MCxcImxhYmVsXCI6XCI1MFwifSxcInNwXCI6e1wicmF0ZVwiOjUsXCJsYWJlbFwiOlwiNVwifSxcImVwXCI6e1wicmF0ZVwiOjEsXCJsYWJlbFwiOlwiMVwifSxcImdwXCI6e1wicmF0ZVwiOjAuNSxcImxhYmVsXCI6XCIxLzJcIn0sXCJwcFwiOntcInJhdGVcIjowLjA1LFwibGFiZWxcIjpcIjEvMjBcIn19LFwic3BcIjp7XCJjcFwiOntcInJhdGVcIjoxMCxcImxhYmVsXCI6XCIxMFwifSxcInNwXCI6e1wicmF0ZVwiOjEsXCJsYWJlbFwiOlwiMVwifSxcImVwXCI6e1wicmF0ZVwiOjAuMixcImxhYmVsXCI6XCIxLzVcIn0sXCJncFwiOntcInJhdGVcIjowLjEsXCJsYWJlbFwiOlwiMS8xMFwifSxcInBwXCI6e1wicmF0ZVwiOjAuMDEsXCJsYWJlbFwiOlwiMS8xMDBcIn19LFwiY3BcIjp7XCJjcFwiOntcInJhdGVcIjoxLFwibGFiZWxcIjpcIjFcIn0sXCJzcFwiOntcInJhdGVcIjowLjEsXCJsYWJlbFwiOlwiMS8xMFwifSxcImVwXCI6e1wicmF0ZVwiOjAuMDIsXCJsYWJlbFwiOlwiMS81MFwifSxcImdwXCI6e1wicmF0ZVwiOjAuMDEsXCJsYWJlbFwiOlwiMS8xMDBcIn0sXCJwcFwiOntcInJhdGVcIjowLjAwMSxcImxhYmVsXCI6XCIxLzEwMDBcIn19fX19KTs7XG5cbnZhciBFeGNoYW5nZVJhdGUgPSAoZnVuY3Rpb24gKCkge1xuXHR2YXIgaXNJbnQgPSBmdW5jdGlvbih2YWx1ZSkge1xuICBcdFx0cmV0dXJuICFpc05hTih2YWx1ZSkgJiYgcGFyc2VJbnQoTnVtYmVyKHZhbHVlKSkgPT0gdmFsdWUgJiYgIWlzTmFOKHBhcnNlSW50KHZhbHVlLCAxMCkpO1xuXHR9O1xuXG5cdHZhciBzY3J1YkNvaW5zID0gZnVuY3Rpb24oY29pbnMpIHtcblx0XHR2YXIgc2NydWJiZWRDb2lucyA9IHt9O1xuXHRcdGZvciAodmFyIGNvaW4gaW4gY29uZmlnLmdldChcIkNsaWVudC5jb2luXCIpKSB7XG5cdFx0XHRpZiAoaXNJbnQoY29pbnNbY29pbl0pKSB7XG5cdFx0XHRcdHNjcnViYmVkQ29pbnNbY29pbl0gPSBwYXJzZUludChjb2luc1tjb2luXSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRzY3J1YmJlZENvaW5zW2NvaW5dID0gMDtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHNjcnViYmVkQ29pbnM7XG5cdH1cblxuXHR2YXIgZ2V0RGVub21pbmF0b3JGcm9tUmF0ZSA9IGZ1bmN0aW9uKGxhYmVsKSB7XG5cdFx0aWYgKGxhYmVsLmluY2x1ZGVzKFwiL1wiKSkge1xuXHRcdFx0cmV0dXJuIHBhcnNlSW50KGxhYmVsLnNwbGl0KFwiL1wiKVsxXSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiAxO1xuXHRcdH1cblx0XHRcblx0fTtcblxuXHR2YXIgY2FsY3VsYXRlQ29pbiA9IGZ1bmN0aW9uKHRvQ29pblR5cGUsIGZyb21Db2luQW1vdW50LCBmcm9tQ29pblR5cGUpIHtcblx0XHR2YXIgY29pblJhdGUgPSBjb25maWcuZ2V0KFwiQ2xpZW50LmNvaW4uXCIgKyBmcm9tQ29pblR5cGUgKyBcIi5cIiArIHRvQ29pblR5cGUgKyBcIi5yYXRlXCIpO1xuXHRcdHJldHVybiAoZnJvbUNvaW5BbW91bnQgKiBjb2luUmF0ZSk7XG5cdH1cblxuXHR2YXIgY2FsY3VsYXRlTW9kQ29pbiA9IGZ1bmN0aW9uKHRvQ29pblR5cGUsIGZyb21Db2luQW1vdW50LCBmcm9tQ29pblR5cGUpIHtcblx0XHR2YXIgZGVub21pbmF0b3IgPSBnZXREZW5vbWluYXRvckZyb21SYXRlKGNvbmZpZy5nZXQoXCJDbGllbnQuY29pbi5cIiArIGZyb21Db2luVHlwZSArIFwiLlwiICsgdG9Db2luVHlwZSArIFwiLmxhYmVsXCIpKTtcblx0XHRyZXR1cm4gKGZyb21Db2luQW1vdW50ICUgZGVub21pbmF0b3IpO1xuXHR9XG5cblx0dmFyIGV4Y2hhbmdlID0gZnVuY3Rpb24gKGZyb21Db2luQW1vdW50LCBmcm9tQ29pblR5cGUsIHJlc3VsdENvaW5zLCBkZXNpcmVkQ29pbnMpIHtcblx0XHR2YXIgcmVtYWluaW5nQ29pbnMgPSBmcm9tQ29pbkFtb3VudDtcblx0XHRmb3IgKHZhciBoaWdoZXN0Q29pblR5cGUgaW4gY29uZmlnLmdldChcIkNsaWVudC5jb2luXCIpKSB7XG5cdFx0XHRpZiAoZGVzaXJlZENvaW5zLmxlbmd0aCA+IDAgJiYgZGVzaXJlZENvaW5zLmluZGV4T2YoaGlnaGVzdENvaW5UeXBlKSA9PSAtMSkge1xuXHRcdFx0XHQvL1RoaXMgaXMgbm90IGEgZGVzaXJlZCBjb2luXG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHQvL0lmIHdlJ3JlIGNvbnZlcnRpbmcgdG8gdGhlIHNhbWUgY29pbiB0eXBlIChpLmUuIGNwIHRvIGNwKSwgdGhlbiBpZ25vcmUgY2FsY3VsYXRpb25zIGFuZCBqdXN0IHN0b3JlIGl0XG5cdFx0XHRpZiAoKGZyb21Db2luVHlwZSA9PT0gaGlnaGVzdENvaW5UeXBlKSkge1xuXHRcdFx0XHRyZXN1bHRDb2luc1tmcm9tQ29pblR5cGVdICs9IHJlbWFpbmluZ0NvaW5zO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdC8vQ29udmVydCB0byBhIGhpZ2hlciBjb2luIHR5cGUsIGlmIHBvc3NpYmxlXG5cdFx0XHR2YXIgcXVvdGllbnQgPSBNYXRoLmZsb29yKGNhbGN1bGF0ZUNvaW4oaGlnaGVzdENvaW5UeXBlLCByZW1haW5pbmdDb2lucywgZnJvbUNvaW5UeXBlKSk7XG5cdFx0XHRyZW1haW5pbmdDb2lucyA9IGNhbGN1bGF0ZU1vZENvaW4oaGlnaGVzdENvaW5UeXBlLCByZW1haW5pbmdDb2lucywgZnJvbUNvaW5UeXBlKTtcblx0XHRcdHJlc3VsdENvaW5zW2hpZ2hlc3RDb2luVHlwZV0gKz0gcXVvdGllbnQ7XG5cdFx0fVxuXHR9O1xuXG5cdHZhciBvcHRpbWFsRXhjaGFuZ2UgPSBmdW5jdGlvbiAoY29pbnMsIGRlc2lyZWRDb2lucykge1xuXHRcdGlmIChkZXNpcmVkQ29pbnMgPT0gbnVsbCB8fCBkZXNpcmVkQ29pbnMgPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRkZXNpcmVkQ29pbnMgPSBbXTtcblx0XHR9XG5cblx0XHQvLzEuIEluaXQgdGhlIGJhc2UgY29pbiBjb252ZXJzaW9ucyB0byAwXG5cdFx0dmFyIHJlc3VsdHMgPSB7fTtcblx0XHRmb3IgKHZhciBrZXkgaW4gY29uZmlnLmdldChcIkNsaWVudC5jb2luXCIpKSB7XG5cdFx0XHRyZXN1bHRzW2tleV0gPSAwO1xuXHRcdH1cblxuXHRcdHZhciBzY3J1YmJlZENvaW5zID0gc2NydWJDb2lucyhjb2lucyk7XG5cblx0XHQvLzIuIENvbnZlcnQgdGhlIGNvaW5zXG5cdFx0Zm9yICh2YXIgY29pbiBpbiBzY3J1YmJlZENvaW5zKSB7XG5cdFx0XHRpZiAoc2NydWJiZWRDb2luc1tjb2luXSA+IDApIHtcblx0XHRcdFx0ZXhjaGFuZ2Uoc2NydWJiZWRDb2luc1tjb2luXSwgY29pbiwgcmVzdWx0cywgZGVzaXJlZENvaW5zKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0XG5cdFx0cmV0dXJuIHJlc3VsdHM7XG5cdH07XG5cblx0dmFyIHRlYW1TcGxpdCA9IGZ1bmN0aW9uKHBhcnR5TWVtQ291bnQsIGNvaW5zLCBkZXNpcmVkQ29pbnMpIHtcblx0XHRpZiAoZGVzaXJlZENvaW5zID09IG51bGwgfHwgZGVzaXJlZENvaW5zID09IHVuZGVmaW5lZCkge1xuXHRcdFx0ZGVzaXJlZENvaW5zID0gW107XG5cdFx0fVxuXG5cdFx0aWYgKGlzSW50KHBhcnR5TWVtQ291bnQpICYmIHBhcnR5TWVtQ291bnQgPD0gMSkge1xuXHRcdFx0cmV0dXJuIFtvcHRpbWFsRXhjaGFuZ2UoY29pbnMpXTtcblx0XHR9IFxuXG5cdFx0Ly8xLiBDcmVhdGUgYSBjb2xsZWN0aW9uIG9mIGFsbC16ZXJvIHJlc3VsdHMgZm9yIGFsbCBwYXJ0eSBtZW1iZXJzXG5cdFx0dmFyIGNvaW5zQnlNZW1iZXIgPSBbXTtcblx0XHRmb3IgKHZhciBpPTA7IGk8cGFydHlNZW1Db3VudDsgaSsrKSB7XG5cdFx0XHR2YXIgYWxsWmVyb0NvaW5zID0ge307XG5cdFx0XHRmb3IgKHZhciBjb2luIGluIGNvbmZpZy5nZXQoXCJDbGllbnQuY29pblwiKSkge1xuXHRcdFx0XHRhbGxaZXJvQ29pbnNbY29pbl0gPSAwO1xuXHRcdFx0fVxuXHRcdFx0Y29pbnNCeU1lbWJlci5wdXNoKGFsbFplcm9Db2lucyk7XG5cdFx0fVxuXG5cdFx0Ly8yLiBTY3J1YiB0aGUgY29pbnMgc28gdGhhdCBpdCdzIGFsbCBudW1iZXJzXG5cdFx0dmFyIHNjcnViYmVkQ29pbnMgPSBzY3J1YkNvaW5zKGNvaW5zKTtcblxuXHRcdHZhciByZW1haW5pbmdDb2luQW1vdW50ID0gMDtcblx0XHR2YXIgcmVtYWluaW5nQ29pblR5cGUgPSBudWxsO1xuXHRcdGZvciAodmFyIGNvaW4gaW4gY29uZmlnLmdldChcIkNsaWVudC5jb2luXCIpKSB7XG5cdFx0XHQvL1Rha2UgYW55IHJlbWFpbmluZyBjb2lucyBhbmQgZWl0aGVyIFxuXHRcdFx0Ly9BLiBleGNoYW5nZSBpdCB0byBhIGxvd2VyIGNvaW4gdmFsdWUgb3Jcblx0XHRcdC8vQi4gYWRkIGFueSByZW1haW5pbmcgY29wcGVycyBmb3IgZnVydGhlciBwcm9jZXNzaW5nXG5cdFx0XHRpZiAocmVtYWluaW5nQ29pbkFtb3VudCA+IDApIHtcblx0XHRcdFx0aWYgKHJlbWFpbmluZ0NvaW5UeXBlID09PSBcImNwXCIpIHtcblx0XHRcdFx0XHRzY3J1YmJlZENvaW5zW2NvaW5dICs9IHJlbWFpbmluZ0NvaW5BbW91bnQ7XG5cdFx0XHRcdH0gZWxzZSBpZiAoY29pbiAhPT0gcmVtYWluaW5nQ29pblR5cGUpIHtcblx0XHRcdFx0XHR2YXIgY29udmVydGVkVmFsdWUgPSBjYWxjdWxhdGVDb2luKGNvaW4sIHJlbWFpbmluZ0NvaW5BbW91bnQsIHJlbWFpbmluZ0NvaW5UeXBlKTtcblx0XHRcdFx0XHRzY3J1YmJlZENvaW5zW2NvaW5dICs9IGNvbnZlcnRlZFZhbHVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vR2V0IHRoZSBjb2lucyB0aGF0IGV2ZW5seSBkaXN0cmlidXRlIGFuZCBpdCB0byB0aGUgcmVzdWx0cyBsaXN0XG5cdFx0XHR2YXIgd2hvbGVDb2lucyA9IE1hdGguZmxvb3Ioc2NydWJiZWRDb2luc1tjb2luXSAvIHBhcnR5TWVtQ291bnQpO1xuXHRcdFx0Zm9yICh2YXIgaT0wOyBpPHBhcnR5TWVtQ291bnQ7IGkrKykge1xuXHRcdFx0XHRjb2luc0J5TWVtYmVyW2ldW2NvaW5dICs9IHdob2xlQ29pbnM7XG5cdFx0XHR9XG5cblx0XHRcdC8vR2V0IHRoZSBsZWZ0b3ZlciBjb2lucyB0aGF0IGRvbid0IGV2ZW5seSBkaXN0cmlidXRlXG5cdFx0XHRyZW1haW5pbmdDb2luQW1vdW50ID0gc2NydWJiZWRDb2luc1tjb2luXSAlIHBhcnR5TWVtQ291bnQ7XG5cdFx0XHRyZW1haW5pbmdDb2luVHlwZSA9IGNvaW47XG5cblx0XHRcdC8vQWRkIGFueSByZW1haW5pbmcgY29wcGVycyB0aGF0IGRvbid0IGV2ZW5seSBkaXN0cmlidXRlXG5cdFx0XHRpZiAocmVtYWluaW5nQ29pblR5cGUgPT09IFwiY3BcIiAmJiByZW1haW5pbmdDb2luQW1vdW50ID4gMCkge1xuXHRcdFx0XHRmb3IgKHZhciBpPTA7IGk8cmVtYWluaW5nQ29pbkFtb3VudDsgaSsrKSB7XG5cdFx0XHRcdFx0Y29pbnNCeU1lbWJlcltpXVtyZW1haW5pbmdDb2luVHlwZV0gKz0gMTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vT3B0aW1pemUgdGhlIHJlbWFpbmluZyB2YWx1ZXNcblx0XHRmb3IgKHZhciBpPTA7IGk8Y29pbnNCeU1lbWJlci5sZW5ndGg7IGkrKykge1xuXHRcdFx0Y29pbnNCeU1lbWJlcltpXSA9IG9wdGltYWxFeGNoYW5nZShjb2luc0J5TWVtYmVyW2ldLCBkZXNpcmVkQ29pbnMpO1xuXHRcdH1cblx0XHRyZXR1cm4gY29pbnNCeU1lbWJlcjtcblx0fTtcbiAgXG5cdHJldHVybiB7XG4gIFx0XHRvcHRpbWFsRXhjaGFuZ2UgOiBvcHRpbWFsRXhjaGFuZ2UsXG4gIFx0XHR0ZWFtU3BsaXQgOiB0ZWFtU3BsaXRcblx0fTtcblxufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBFeGNoYW5nZVJhdGU7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9leGNoYW5nZS1yYXRlXCIpOyJdfQ==
