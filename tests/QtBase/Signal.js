describe("QtBase.Signal", function() {
  it("present", function() {
    expect(!!QmlWeb && !!QmlWeb.Signal).toBe(true);
  });

  it("AutoConnection", function() {
    var signal = new QmlWeb.Signal();
    var result = 0;
    var test1 = function() {
      result += 1;
    };
    var test2 = function() {
      result += 10;
    };
    signal.connect(test1);
    expect(result).toBe(0);
    signal.execute();
    expect(result).toBe(1);
    signal.execute();
    expect(result).toBe(2);
    signal.connect(test2);
    expect(result).toBe(2);
    signal.execute();
    expect(result).toBe(13);
  });

  it("UniqueConnection", function() {
    var signal = new QmlWeb.Signal();
    var result = 0;
    var test1 = function() {
      result += 1;
    };
    var test2 = function() {
      result += 10;
    };
    signal.connect(test1, QmlWeb.Signal.UniqueConnection);
    expect(result).toBe(0);
    signal.execute();
    expect(result).toBe(1);
    signal.connect(test1, QmlWeb.Signal.UniqueConnection);
    signal.execute();
    expect(result).toBe(2);
    signal.connect(test2, QmlWeb.Signal.UniqueConnection);
    expect(result).toBe(2);
    signal.execute();
    expect(result).toBe(13);
    signal.connect(test1, QmlWeb.Signal.UniqueConnection);
    signal.connect(test1, QmlWeb.Signal.UniqueConnection);
    signal.connect(test2, QmlWeb.Signal.UniqueConnection);
    signal.connect(test2, QmlWeb.Signal.UniqueConnection);
    signal.connect(test1, QmlWeb.Signal.UniqueConnection);
    signal.connect(test2, QmlWeb.Signal.UniqueConnection);
    signal.execute();
    expect(result).toBe(24);
  });

  it("QueuedConnection", function(done) {
    var signal = new QmlWeb.Signal();
    var result = 0;
    var test1 = function() {
      result += 1;
    };
    var test2 = function() {
      result += 10;
    };
    signal.connect(test1, QmlWeb.Signal.QueuedConnection);
    expect(result).toBe(0);
    signal.execute();
    expect(result).toBe(0);
    signal.connect(test2, QmlWeb.Signal.QueuedConnection);
    signal.execute();
    expect(result).toBe(0);
    signal.execute();
    expect(result).toBe(0);
    setTimeout(function() {
      expect(result).toBe(23);
      done();
    }, 10);
  });
});
