# dnd-exchange-rate

A small javascript library to convert coins from Dungeons and Dragons 5e. 
See a working calculator [here](http://stephthedev.com/dnd-exchange-rate/).

## Overview
This library does two things:
* Converts lower value coins to higher value coins (i.e. coppers and silvers to gold)
* Evenly splits coins amongst a defined party size (i.e. (23 cp, 35 sp, 58 ep) split between 4 heroes)

## Building it
* `npm install`
* `npm test`	# Run tests
* `grunt`	# Bundle js scripts to dist/ directory


## Running it
### Setup
Include the library into your application using:
```js
var ExchangeRate = require('exchange-rate.js');
```
### Optimal exchange
Optimally exchange lower value coins for higher value coins
```js
var results = ExchangeRate.optimalExchange({cp: 229, sp: 137, ep: 29, gp: 41});
console.log(results); // {pp: 6, gp: 10, ep: 2, sp: 4, cp: 9}
```
You can also optimally exchange lower value coins for *only* copper, silver, and gold. 
```js
var results = ExchangeRate.optimalExchange({cp: 229, sp: 137, ep: 29, gp: 41}, ["cp", "sp", "gp"]);
console.log(results); // {pp: 0, gp: 70, ep: 0, sp: 14, cp: 9}
```

### Team Split
You can split the total coins evenly amongst a set amount of players. 
```js
var results = ExchangeRate.optimalExchange(4, {cp: 229, sp: 137, ep: 29, gp: 41});
console.log(results); 
// [{pp: 1, gp: 6, ep: 3, sp: 3, cp: 8}, 
// {pp: 1, gp: 6, ep: 3, sp: 3, cp: 7},
// {pp: 1, gp: 6, ep: 3, sp: 3, cp: 7}, 
// {pp: 1, gp: 6, ep: 3, sp: 3, cp: 7}]
```
In this example, all 4 players would receive 1 pp, 6 gp, 3 ep, but only one player would receive 8 cp while the others would  receive 7 cp. 

You can also split the coins evenly amongst a set amount of players, but *only* use copper, silver, and gold in the output.
```js
var results = ExchangeRate.teamSplit(4, {cp: 229, sp: 137, ep: 29, gp: 41}, ["cp", "sp", "gp"]);
console.log(results);
// [{pp: 0, gp: 16, ep: 0, sp: 18, cp: 8},
// {pp: 0, gp: 16, ep: 0, sp: 18, cp: 7},
// {pp: 0, gp: 16, ep: 0, sp: 18, cp: 7},
// {pp: 0, gp: 16, ep: 0, sp: 18, cp: 7}]
```

