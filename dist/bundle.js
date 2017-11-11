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

	var getDenominatorFromRate = function(label) {
		if (label.includes("/")) {
			return parseInt(label.split("/")[1]);
		} else {
			return 1;
		}
		
	}

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

		//Init the coins by member
		var coinsByMember = [];
		for (var i=0; i<partyMemCount; i++) {
			coinsByMember.push({});
		}

		var results = coinOpts;

		//The config file is in order from greatest to least
		var remainingCoinAmount = 0;
		var remainingCoinType = null;
		for (var coin in config.get("Client.coin")) {
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
},{}],2:[function(require,module,exports){
module.exports = require("./exchange-rate");
},{"./exchange-rate":1}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZXhjaGFuZ2UtcmF0ZS5qcyIsInNyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hKQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgY29uZmlnID0gKGZ1bmN0aW9uIChwcm9wcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBfZ2V0QnlQcm9wUGF0aCA9IGZ1bmN0aW9uIChvLCBzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvNjQ5MTYyMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMgPSBzLnJlcGxhY2UoL1xcWyhcXHcrKVxcXS9nLCAnLiQxJyk7IC8vIGNvbnZlcnQgaW5kZXhlcyB0byBwcm9wZXJ0aWVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcyA9IHMucmVwbGFjZSgvXlxcLi8sICcnKTsgICAgICAgICAgIC8vIHN0cmlwIGEgbGVhZGluZyBkb3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYSA9IHMuc3BsaXQoJy4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbiA9IGEubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBrID0gYVtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGsgaW4gbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbyA9IG9ba107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG87XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmdldCA9IGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF9nZXRCeVByb3BQYXRoKHByb3BzLCBhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgICAgICAgICAgICAgICB9KSh7XCJDbGllbnRcIjp7XCJjb2luXCI6e1wicHBcIjp7XCJjcFwiOntcInJhdGVcIjoxMDAwLFwibGFiZWxcIjpcIjEwMDBcIn0sXCJzcFwiOntcInJhdGVcIjoxMDAsXCJsYWJlbFwiOlwiMTAwXCJ9LFwiZXBcIjp7XCJyYXRlXCI6MjAsXCJsYWJlbFwiOlwiMjBcIn0sXCJncFwiOntcInJhdGVcIjoxMCxcImxhYmVsXCI6XCIxMFwifSxcInBwXCI6e1wicmF0ZVwiOjEsXCJsYWJlbFwiOlwiMVwifX0sXCJncFwiOntcImNwXCI6e1wicmF0ZVwiOjEwMCxcImxhYmVsXCI6XCIxMDBcIn0sXCJzcFwiOntcInJhdGVcIjoxMCxcImxhYmVsXCI6XCIxMFwifSxcImVwXCI6e1wicmF0ZVwiOjIsXCJsYWJlbFwiOlwiMlwifSxcImdwXCI6e1wicmF0ZVwiOjEsXCJsYWJlbFwiOlwiMVwifSxcInBwXCI6e1wicmF0ZVwiOjAuMSxcImxhYmVsXCI6XCIxLzEwXCJ9fSxcImVwXCI6e1wiY3BcIjp7XCJyYXRlXCI6NTAsXCJsYWJlbFwiOlwiNTBcIn0sXCJzcFwiOntcInJhdGVcIjo1LFwibGFiZWxcIjpcIjVcIn0sXCJlcFwiOntcInJhdGVcIjoxLFwibGFiZWxcIjpcIjFcIn0sXCJncFwiOntcInJhdGVcIjowLjUsXCJsYWJlbFwiOlwiMS8yXCJ9LFwicHBcIjp7XCJyYXRlXCI6MC4wNSxcImxhYmVsXCI6XCIxLzIwXCJ9fSxcInNwXCI6e1wiY3BcIjp7XCJyYXRlXCI6MTAsXCJsYWJlbFwiOlwiMTBcIn0sXCJzcFwiOntcInJhdGVcIjoxLFwibGFiZWxcIjpcIjFcIn0sXCJlcFwiOntcInJhdGVcIjowLjIsXCJsYWJlbFwiOlwiMS81XCJ9LFwiZ3BcIjp7XCJyYXRlXCI6MC4xLFwibGFiZWxcIjpcIjEvMTBcIn0sXCJwcFwiOntcInJhdGVcIjowLjAxLFwibGFiZWxcIjpcIjEvMTAwXCJ9fSxcImNwXCI6e1wiY3BcIjp7XCJyYXRlXCI6MSxcImxhYmVsXCI6XCIxXCJ9LFwic3BcIjp7XCJyYXRlXCI6MC4xLFwibGFiZWxcIjpcIjEvMTBcIn0sXCJlcFwiOntcInJhdGVcIjowLjAyLFwibGFiZWxcIjpcIjEvNTBcIn0sXCJncFwiOntcInJhdGVcIjowLjAxLFwibGFiZWxcIjpcIjEvMTAwXCJ9LFwicHBcIjp7XCJyYXRlXCI6MC4wMDEsXCJsYWJlbFwiOlwiMS8xMDAwXCJ9fX19fSk7O1xuXG52YXIgRXhjaGFuZ2VSYXRlID0gKGZ1bmN0aW9uICgpIHtcblx0dmFyIGlzSW50ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgXHRcdHJldHVybiAhaXNOYU4odmFsdWUpICYmIHBhcnNlSW50KE51bWJlcih2YWx1ZSkpID09IHZhbHVlICYmICFpc05hTihwYXJzZUludCh2YWx1ZSwgMTApKTtcblx0fTtcblxuXHR2YXIgZ2V0RGVub21pbmF0b3JGcm9tUmF0ZSA9IGZ1bmN0aW9uKGxhYmVsKSB7XG5cdFx0aWYgKGxhYmVsLmluY2x1ZGVzKFwiL1wiKSkge1xuXHRcdFx0cmV0dXJuIHBhcnNlSW50KGxhYmVsLnNwbGl0KFwiL1wiKVsxXSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiAxO1xuXHRcdH1cblx0XHRcblx0fVxuXG5cdHZhciBjYWxjdWxhdGVDb2luID0gZnVuY3Rpb24odG9Db2luVHlwZSwgZnJvbUNvaW5BbW91bnQsIGZyb21Db2luVHlwZSkge1xuXHRcdHZhciBjb2luUmF0ZSA9IGNvbmZpZy5nZXQoXCJDbGllbnQuY29pbi5cIiArIGZyb21Db2luVHlwZSArIFwiLlwiICsgdG9Db2luVHlwZSArIFwiLnJhdGVcIik7XG5cdFx0cmV0dXJuIChmcm9tQ29pbkFtb3VudCAqIGNvaW5SYXRlKTtcblx0fVxuXG5cdHZhciBjYWxjdWxhdGVNb2RDb2luID0gZnVuY3Rpb24odG9Db2luVHlwZSwgZnJvbUNvaW5BbW91bnQsIGZyb21Db2luVHlwZSkge1xuXHRcdHZhciBkZW5vbWluYXRvciA9IGdldERlbm9taW5hdG9yRnJvbVJhdGUoY29uZmlnLmdldChcIkNsaWVudC5jb2luLlwiICsgZnJvbUNvaW5UeXBlICsgXCIuXCIgKyB0b0NvaW5UeXBlICsgXCIubGFiZWxcIikpO1xuXHRcdHJldHVybiAoZnJvbUNvaW5BbW91bnQgJSBkZW5vbWluYXRvcik7XG5cdH1cblxuXHR2YXIgZXhjaGFuZ2UgPSBmdW5jdGlvbiAoZnJvbUNvaW5BbW91bnQsIGZyb21Db2luVHlwZSwgcmVzdWx0Q29pbnMpIHtcblx0XHR2YXIgcmVtYWluaW5nQ29pbnMgPSBmcm9tQ29pbkFtb3VudDtcblx0XHRmb3IgKHZhciBoaWdoZXN0Q29pblR5cGUgaW4gY29uZmlnLmdldChcIkNsaWVudC5jb2luXCIpKSB7XG5cdFx0XHQvL0lmIHdlJ3JlIGNvbnZlcnRpbmcgdG8gdGhlIHNhbWUgY29pbiB0eXBlIChpLmUuIGNwIHRvIGNwKSwgdGhlbiBpZ25vcmUgY2FsY3VsYXRpb25zIGFuZCBqdXN0IHN0b3JlIGl0XG5cdFx0XHRpZiAoKGZyb21Db2luVHlwZSA9PT0gaGlnaGVzdENvaW5UeXBlKSkge1xuXHRcdFx0XHRyZXN1bHRDb2luc1tmcm9tQ29pblR5cGVdICs9IHJlbWFpbmluZ0NvaW5zO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdC8vQ29udmVydCB0byBhIGhpZ2hlciBjb2luIHR5cGUsIGlmIHBvc3NpYmxlXG5cdFx0XHR2YXIgcXVvdGllbnQgPSBNYXRoLmZsb29yKGNhbGN1bGF0ZUNvaW4oaGlnaGVzdENvaW5UeXBlLCByZW1haW5pbmdDb2lucywgZnJvbUNvaW5UeXBlKSk7XG5cdFx0XHRyZW1haW5pbmdDb2lucyA9IGNhbGN1bGF0ZU1vZENvaW4oaGlnaGVzdENvaW5UeXBlLCByZW1haW5pbmdDb2lucywgZnJvbUNvaW5UeXBlKTtcblx0XHRcdHJlc3VsdENvaW5zW2hpZ2hlc3RDb2luVHlwZV0gKz0gcXVvdGllbnQ7XG5cdFx0fVxuXHR9O1xuXG5cdHZhciBvcHRpbWFsRXhjaGFuZ2UgPSBmdW5jdGlvbiAoY29pbk9wdHMpIHtcblx0XHQvLzEuIEluaXQgdGhlIGJhc2UgY29pbiBjb252ZXJzaW9ucyB0byAwXG5cdFx0dmFyIHJlc3VsdHMgPSB7fTtcblx0XHRmb3IgKHZhciBrZXkgaW4gY29uZmlnLmdldChcIkNsaWVudC5jb2luXCIpKSB7XG5cdFx0XHRyZXN1bHRzW2tleV0gPSAwO1xuXHRcdH1cblxuXHRcdC8vMi4gQ29udmVydCB0aGUgY29pbnNcblx0XHRmb3IgKHZhciBjb2luIGluIGNvaW5PcHRzKSB7XG5cdFx0XHRpZiAoaXNJbnQoY29pbk9wdHNbY29pbl0pICYmIGNvaW5PcHRzW2NvaW5dID4gMCkge1xuXHRcdFx0XHRleGNoYW5nZShwYXJzZUludChjb2luT3B0c1tjb2luXSksIGNvaW4sIHJlc3VsdHMpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRcblx0XHRyZXR1cm4gcmVzdWx0cztcblx0fTtcblxuXHR2YXIgdGVhbVNwbGl0ID0gZnVuY3Rpb24ocGFydHlNZW1Db3VudCwgY29pbk9wdHMpIHtcblx0XHRpZiAoaXNJbnQocGFydHlNZW1Db3VudCkgJiYgcGFydHlNZW1Db3VudCA8PSAxKSB7XG5cdFx0XHRyZXR1cm4gW29wdGltYWxFeGNoYW5nZShjb2luT3B0cyldO1xuXHRcdH0gXG5cblx0XHQvL0luaXQgdGhlIGNvaW5zIGJ5IG1lbWJlclxuXHRcdHZhciBjb2luc0J5TWVtYmVyID0gW107XG5cdFx0Zm9yICh2YXIgaT0wOyBpPHBhcnR5TWVtQ291bnQ7IGkrKykge1xuXHRcdFx0Y29pbnNCeU1lbWJlci5wdXNoKHt9KTtcblx0XHR9XG5cblx0XHR2YXIgcmVzdWx0cyA9IGNvaW5PcHRzO1xuXG5cdFx0Ly9UaGUgY29uZmlnIGZpbGUgaXMgaW4gb3JkZXIgZnJvbSBncmVhdGVzdCB0byBsZWFzdFxuXHRcdHZhciByZW1haW5pbmdDb2luQW1vdW50ID0gMDtcblx0XHR2YXIgcmVtYWluaW5nQ29pblR5cGUgPSBudWxsO1xuXHRcdGZvciAodmFyIGNvaW4gaW4gY29uZmlnLmdldChcIkNsaWVudC5jb2luXCIpKSB7XG5cdFx0XHRpZiAoIXJlc3VsdHMuaGFzT3duUHJvcGVydHkoY29pbikpIHtcblx0XHRcdFx0cmVzdWx0c1tjb2luXSA9IDA7XG5cdFx0XHR9XG5cblx0XHRcdC8vVGFrZSBhbnkgcmVtYWluaW5nIGNvaW5zIGFuZCBlaXRoZXIgXG5cdFx0XHQvL0EuIGV4Y2hhbmdlIGl0IHRvIGEgbG93ZXIgY29pbiB2YWx1ZSBvclxuXHRcdFx0Ly9CLiBhZGQgYW55IHJlbWFpbmluZyBjb3BwZXJzIGZvciBmdXJ0aGVyIHByb2Nlc3Npbmdcblx0XHRcdGlmIChyZW1haW5pbmdDb2luQW1vdW50ID4gMCkge1xuXHRcdFx0XHRpZiAoY29pbiAhPT0gcmVtYWluaW5nQ29pblR5cGUpIHtcblx0XHRcdFx0XHR2YXIgY29udmVydGVkVmFsdWUgPSBjYWxjdWxhdGVDb2luKGNvaW4sIHJlbWFpbmluZ0NvaW5BbW91bnQsIHJlbWFpbmluZ0NvaW5UeXBlKTtcblx0XHRcdFx0XHRyZXN1bHRzW2NvaW5dICs9IGNvbnZlcnRlZFZhbHVlO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGNvaW4gPT09IFwiY3BcIikge1xuXHRcdFx0XHRcdHJlc3VsdHNbY29pbl0gKz0gcmVtYWluaW5nQ29pbkFtb3VudDsgXG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly9HZXQgdGhlIGNvaW5zIHRoYXQgZXZlbmx5IGRpc3RyaWJ1dGVcblx0XHRcdHZhciBldmVuQ29pbnMgPSBNYXRoLmZsb29yKHJlc3VsdHNbY29pbl0gLyBwYXJ0eU1lbUNvdW50KTtcblxuXHRcdFx0Ly9HZXQgdGhlIGNvaW5zIHRoYXQgZG9uJ3Rcblx0XHRcdHJlbWFpbmluZ0NvaW5BbW91bnQgPSByZXN1bHRzW2NvaW5dICUgcGFydHlNZW1Db3VudDtcblx0XHRcdHJlbWFpbmluZ0NvaW5UeXBlID0gY29pbjtcblxuXHRcdFx0Ly9TZXQgdGhvc2UgY29pbnMgdGhhdCBldmVubHkgZGlzdHJpYnV0ZVxuXHRcdFx0Zm9yICh2YXIgaT0wOyBpPHBhcnR5TWVtQ291bnQ7IGkrKykge1xuXHRcdFx0XHRjb2luc0J5TWVtYmVyW2ldW2NvaW5dID0gZXZlbkNvaW5zO1xuXHRcdFx0fVxuXG5cdFx0XHQvL1NldCBhbnkgcmVtYWluaW5nIGNvaW5zIHRoYXQgZG9uJ3Rcblx0XHRcdGlmIChyZW1haW5pbmdDb2luVHlwZSA9PT0gXCJjcFwiICYmIHJlbWFpbmluZ0NvaW5BbW91bnQgPiAwKSB7XG5cdFx0XHRcdGZvciAodmFyIGk9MDsgaTxyZW1haW5pbmdDb2luQW1vdW50OyBpKyspIHtcblx0XHRcdFx0XHRjb2luc0J5TWVtYmVyW2ldW3JlbWFpbmluZ0NvaW5UeXBlXSArPSAxO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBjb2luc0J5TWVtYmVyO1xuXHR9O1xuICBcblx0cmV0dXJuIHtcbiAgXHRvcHRpbWFsRXhjaGFuZ2UgOiBvcHRpbWFsRXhjaGFuZ2UsXG4gIFx0dGVhbVNwbGl0IDogdGVhbVNwbGl0XG5cdH07XG5cbn0pKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gRXhjaGFuZ2VSYXRlOyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vZXhjaGFuZ2UtcmF0ZVwiKTsiXX0=
