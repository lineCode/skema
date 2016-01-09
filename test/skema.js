'use strict';

var skema = require('../');
var expect = require('chai').expect;

describe(".validate", function(){
  it("async validate", function(done){
    var rule = {
      validate: function (value) {
        var done = this.async();
        setTimeout(function () {
          done(value > 0 ? null : true);
        }, 0);
      }
    };

    var c = skema(rule);

    c.validate(-1, [], function (err) {
      expect(err).not.to.equal(null);

      c.validate(1, function (err) {
        expect(err).to.equal(null);
        done();
      });
    });
  });

  it("sync validate", function(done){
    var rule = {
      validate: function (v) {
        return v > 0;
      }
    };

    var c = skema(rule);

    c.validate(-1, [], function (err) {
      expect(err).not.to.equal(null);
      
      c.validate(1, function (err) {
        expect(err).to.equal(null);
        done();
      });
    });
  });

  var rule = {
    validate: [
      function (v) {
        if (v <= 0) {
          return new Error('must > 0');
        }
        return true;
      },
      function (v) {
        var done = this.async();
        if (v <= 10) {
          return done('must > 10');
        }

        done();
      },
      /\d{3,}/
    ]
  };

  var cases = [
    [-1, 'must > 0'],
    [1, 'must > 10'],
    [11, true],
    [100, null]
  ];

  var one = skema(rule);

  cases.forEach(function (c) {
    var v = c[0];
    var e = c[1];
    it("array validate:" + v, function(done){
      one.validate(v, [], function (err) {
        if (err instanceof Error) {
          expect(err.message).to.equal(e);
          done();
          return;
        }

        expect(err).to.equal(e);
        done();
      });
    });
  });

  it("context", function(done){
    var rule = {
      validate: function (value) {
        var done = this.async();
        if (this.skip()) {
          return done(null);
        }

        setTimeout(function () {
          done(value > 0 ? null : true);
        }, 0);
      }
    };

    var skip;
    var c = skema(rule).context({
        skip: function () {
          return skip;
        }
      });

    c.validate(-1, [], function (err) {
      expect(err).not.to.equal(null);
      skip = true;
      c.validate(-1, function (err) {
        expect(err).to.equal(null);
        done();
      });
    });
  });
});


describe("async: .get/.set", function(){
  it("sync ", function(done){
    var rule = {
      set: function (v) {
        return v + 1;
      }
    };

    var one = skema(rule);

    one.set(1, [], function (err, v) {
      expect(err).to.equal(null);
      expect(v).to.equal(2);
      done();
    });
  });

  it("async", function(done){
    var rule = {
      set: function (v) {
        var done = this.async();
        if (v <= 0) {
          return done('must > 0'); 
        }

        setTimeout(function () {
          done(null, v + 1);
        }, 10);
      }
    };

    var one = skema(rule);

    one.set(1, [], function (err, v) {
      expect(err).to.equal(null);
      expect(v).to.equal(2);

      one.set(-1, [], function (err, v) {
        expect(err).to.equal('must > 0');
        done();
      });
    });
  });

  it("context", function(done){
    var rule = {
      set: function (v) {
        var done = this.async();
        var self = this;
        setTimeout(function () {
          done(null, v + self.plus());
        }, 10);
      }
    };

    var one = skema(rule)
      .context({
        plus: function () {
          return plus;
        }
      });

    var plus = 1;

    one.set(1, [], function (err, v) {
      expect(err).to.equal(null);
      expect(v).to.equal(2);

      plus = 2;
      one.set(1, [], function (err, v) {
        expect(err).to.equal(null);
        expect(v).to.equal(3);
        done();
      });
    });
  });
});


describe("sync: .get/.set", function(){
  it("getter", function(done){
    var one = skema({
      get: [
        function (v) {
          return v + 1
        },

        function (v, n) {
          return v + 1 + (n || 0)
        }
      ]
    }, {
      sync_getter: true
    })

    var result = one.get(1, [2])
    expect(result).to.equal(5)
    done()
  })
})


describe("type", function(){
  var type = {
    validate: function (v) {
      return v > 0
    },

    set: function (v) {
      return v + 1
    },

    get: function (v) {
      return v + 2
    }
  }

  it("default validator, setter, and getter", function(done){
    var one = skema({
      type: type
    }, {
      sync_getter: true,
      sync_setter: true
    })

    one.validate(0, function (err) {
      expect(!!err).to.equal(true)
      expect(one.set(1)).to.equal(2)
      expect(one.get(1)).to.equal(3)
      done()
    })
  })

  it("default type and custom type", function(done){
    var one = skema({
      type: type,
      get: function (v) {
        return v + 1
      }
    }, {
      sync_getter: true,
      sync_setter: true
    })

    one.validate(0, function (err) {
      expect(!!err).to.equal(true)
      expect(one.set(1)).to.equal(2)
      expect(one.get(1)).to.equal(4)
      done()
    })
  })
})
