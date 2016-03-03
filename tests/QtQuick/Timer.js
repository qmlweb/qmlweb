describe('QtQuick.Timer', function() {
  setupDivElement();
  beforeEach(function() {
    jasmine.addMatchers(customMatchers);
  });

  var loader = prefixedQmlLoader('QtQuick/qml/Timer');
  it("can roughly set short intervals", function(done) {
    var qml = loader("Singleshot", this.div);
    qml.interval = 50;
    qml.yield = function(arg) {
      var t = new Date() - now;
      expect(t).toBeRoughly(50, 0.5);
      done();
    };
    var now = new Date();
    qml.start();
  });

  it("can roughly set short intervals", function(done) {
    var qml = loader("Singleshot", this.div);
    qml.interval = 500;
    qml.yield = function(arg) {
      var t = new Date() - now;
      expect(t).toBeRoughly(500, 0.05);
      done();
    };
    var now = new Date();
    qml.start();
  });
});
