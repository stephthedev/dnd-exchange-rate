var assert = require('assert');
var config = require("config");
var ER = require('../src/exchange-rate.js');

describe("Undefined coin", function() {

  var zeroCoins = {
    cp: 0,
    sp: 0, 
    ep: 0,
    gp: 0,
    pp: 0
  }

  it("copper", function() {
    assert.deepEqual(ER.optimalExchange({cp: undefined}), zeroCoins);
  });

  it("silver", function() {
    assert.deepEqual(ER.optimalExchange({sp: "notanum"}), zeroCoins);
  });

  it("electrum", function() {
    assert.deepEqual(ER.optimalExchange({ep: NaN}), zeroCoins);
  });

  it("gold", function() {
    assert.deepEqual(ER.optimalExchange({gp: []}), zeroCoins);
  });

  it("platinum", function() {
    assert.deepEqual(ER.optimalExchange({pp: null}), zeroCoins);
  });
});

describe("Optimally exchange", function() {
  describe("cp", function() {
    it("to all coin types", function() {
      var results = ER.optimalExchange({cp: 1187});
      assert.deepEqual(results, {
        cp: 7, 
        sp: 3,
        ep: 1, 
        gp: 1, 
        pp: 1
      });
    });
  });

  describe("sp", function() {
    it("to all coin types", function() {
      var results = ER.optimalExchange({sp: 126});
      assert.deepEqual(results, {
        cp: 0, 
        sp: 1,
        ep: 1, 
        gp: 2, 
        pp: 1
      });
    });
  });

  describe("ep", function() {
    it("to all coin types", function() {
      var results = ER.optimalExchange({ep: 107});
      assert.deepEqual(results, {
        cp: 0, 
        sp: 0,
        ep: 1, 
        gp: 3, 
        pp: 5
      });
    });

    it("to only cp", function() {
      var results = ER.optimalExchange({ep: 3}, ["cp"]);
      assert.deepEqual(results, {
        cp: 150, 
        sp: 0,
        ep: 0, 
        gp: 0, 
        pp: 0
      });
    });
  });

  describe("gp", function() {
    it("to all coin types", function() {
      var results = ER.optimalExchange({gp: 397});
      assert.deepEqual(results, {
        cp: 0, 
        sp: 0,
        ep: 0, 
        gp: 7, 
        pp: 39
      });
    });
  });

  describe("pp", function() {
    it("to all coin types", function() {
      var results = ER.optimalExchange({pp: 621});
      assert.deepEqual(results, {
        cp: 0, 
        sp: 0,
        ep: 0, 
        gp: 0, 
        pp: 621
      });
    });

    it("to only gp", function() {
      var results = ER.optimalExchange({pp: 25}, ["gp"]);
      assert.deepEqual(results, {
        cp: 0, 
        sp: 0, 
        ep: 0, 
        gp: 250, 
        pp: 0
      });
    });
  });
});

describe("Team split", function() {
  it("coins amongst a party of 1", function() {
    var results = ER.teamSplit(1, {gp: 10, sp: 2, cp: 7});
    assert.equal(results.length, 1);
    assert.deepEqual(results[0], {
        cp: 7, 
        sp: 2,
        ep: 0, 
        gp: 0, 
        pp: 1
    });
  });

  it("coins that do not evenly distribute", function() {
    var results = ER.teamSplit(4, {cp: 3});
    assert.equal(results.length, 4);
    assert.equal(1, results[0].cp);
    assert.equal(1, results[1].cp);
    assert.equal(1, results[2].cp);
    assert.equal(0, results[3].cp, "The last player should not receive any coins");
  });

  it("coins that evenly and unevenly distribute", function() {
    var results = ER.teamSplit(4, {gp: 3, sp: 11, cp: 3});
    assert.equal(results.length, 4);
  });

  it("coins that evenly distribute", function() {
    var results = ER.teamSplit(4, {gp: 26});
    assert.equal(results.length, 4);
    for (var i=0; i<results.length; i++) {
      assert.equal(6, results[i].gp);
      assert.equal(1, results[i].ep);
    }
  });
});
