describe('QtQuick.Timer', function() {
  setupDivElement();
  beforeEach(function() {
    jasmine.addMatchers(customMatchers);
  });

  var load = prefixedQmlLoader('QtQuick/qml/Timer');
  it("can roughly set short intervals", function(done) {
    var qml = load("Singleshot", this.div);
    qml.interval = 50;
    qml.yield = function(arg) {
      var t = new Date() - now;
      expect(t).toBeRoughly(50, 1);
      done();
    };
    var now = new Date();
    qml.start();
  });

  it("can roughly set short intervals", function(done) {
    var qml = load("Singleshot", this.div);
    qml.interval = 500;
    qml.yield = function(arg) {
      var t = new Date() - now;
      expect(t).toBeRoughly(500, 0.1);
      done();
    };
    var now = new Date();
    qml.start();
  });

  it("can set Timer.running = true to start", function(done) {
    var qml = load("Running", this.div);
    qml.yield = function(succeed) {
      expect(succeed).toBe(true);
      done();
    };
    qml.start();
  });
});
