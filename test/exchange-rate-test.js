var assert = require('assert');
var config = require("config");
var ER = require('../modules/exchange-rate.js');

describe.skip('Default exchange rate for', function() {
  it('copper', function() {
  	defaultExchangeRate("cp");
  });

  it('silver', function() {
  	defaultExchangeRate("sp");
  });

  it('electrum', function() {
  	defaultExchangeRate("ep");
  });

  it('gold', function() {
  	defaultExchangeRate("gp");
  });

  it('platinum', function() {
  	defaultExchangeRate("pp");
  });
});

describe.skip("Undefined coin", function() {
  it("copper", function() {
    assert.equal(0, ER.optimalExchange(undefined, 0, 0, 0, 0));
  });

  it("silver", function() {
    assert.equal(0, ER.optimalExchange(0, "notanum", 0, 0, 0));
  });

  it("electrum", function() {
    assert.equal(0, ER.optimalExchange(0, 0, NaN, 0, 0));
  });

  it("gold", function() {
    assert.equal(0, ER.optimalExchange(0, 0, 0, {}, 0));
  });

  it("platinum", function() {
    assert.equal(0, ER.optimalExchange(0, 0, 0, 0, null));
  });
});

describe("Optimally exchange", function() {
  describe.skip("cp", function() {
    it("to all coin types", function() {
      var exchange = ER.optimalExchange(1187, 0, 0, 0, 0);
      assert.equal(exchange.cp, 7, "Expected cp to contain remaining coins");
      assert.equal(exchange.sp, 3, "Expected sp to contain exchanged rate value");
      assert.equal(exchange.ep, 1, "Expected ep to contain exchanged rate value");
      assert.equal(exchange.gp, 1, "Expected gp to contain exchanged rate value");
      assert.equal(exchange.pp, 1, "Expected pp to contain exchanged rate value");
    });
  });

  describe.skip("sp", function() {
    it("to all coin types", function() {
      var exchange = ER.optimalExchange(0, 126, 0, 0, 0);
      assert.equal(exchange.cp, 0, "Expected cp to not be used in exchanged rate value");
      assert.equal(exchange.sp, 1, "Expected sp to contain exchanged rate value");
      assert.equal(exchange.ep, 1, "Expected ep to contain exchanged rate value");
      assert.equal(exchange.gp, 2, "Expected gp to contain exchanged rate value");
      assert.equal(exchange.pp, 1, "Expected pp to contain exchanged rate value");
    });
  });

  describe.skip("ep", function() {
    it("to all coin types", function() {
      var exchange = ER.optimalExchange(0, 0, 107, 0, 0);
      assert.equal(exchange.cp, 0, "Expected cp to not be used in exchanged rate value");
      assert.equal(exchange.sp, 0, "Expected sp to not be used in exchanged rate value");
      assert.equal(exchange.ep, 1, "Expected ep to contain exchanged rate value");
      assert.equal(exchange.gp, 3, "Expected gp to contain exchanged rate value");
      assert.equal(exchange.pp, 5, "Expected pp to contain exchanged rate value");
    });
  });

  describe("gp", function() {
    it("to all coin types", function() {
      var exchange = ER.optimalExchange(0, 0, 0, 397, 0);
      assert.equal(exchange.cp, 0, "Expected cp to not be used in exchanged rate value");
      assert.equal(exchange.sp, 0, "Expected sp to not be used in exchanged rate value");
      assert.equal(exchange.ep, 0, "Expected ep to not be used in exchanged rate value");
      assert.equal(exchange.gp, 7, "Expected gp to contain exchanged rate value");
      assert.equal(exchange.pp, 39, "Expected pp to contain exchanged rate value");
    });
  });

  describe("pp", function() {
    it("to all coin types", function() {
      var exchange = ER.optimalExchange(0, 0, 0, 0, 621);
      assert.equal(exchange.cp, 0, "Expected cp to not be used in exchanged rate value");
      assert.equal(exchange.sp, 0, "Expected sp to not be used in exchanged rate value");
      assert.equal(exchange.ep, 0, "Expected ep to not be used in exchanged rate value");
      assert.equal(exchange.gp, 0, "Expected gp to not be used in exchanged rate value");
      assert.equal(exchange.pp, 621, "Expected pp to contain exchanged rate value");
    });
  });
});

function defaultExchangeRate(coinType) {
	assert.equal(config.get("coin." + coinType + ".cp.rate"), ER.optimalExchange(1, 0, 0, 0, 0).cp);
	assert.equal(config.get("coin." + coinType + ".sp.rate"), ER.optimalExchange(0, 1, 0, 0, 0).sp);
	assert.equal(config.get("coin." + coinType + ".ep.rate"), ER.optimalExchange(0, 0, 1, 0, 0).ep);
	assert.equal(config.get("coin." + coinType + ".gp.rate"), ER.optimalExchange(0, 0, 0, 1, 0).gp);
	assert.equal(config.get("coin." + coinType + ".pp.rate"), ER.optimalExchange(0, 0, 0, 0, 1).pp);
}