describe('QMLEngine.states', function() {
  setupDivElement();
  var loader = prefixedQmlLoader('QMLEngine/qml/State');

  it("changes property values state is changed", function(done) {
    qml = loader("Simple", this.div);
    var count = 0;
    qml.yield = function() {
      if (count == 0) {
        expect(qml.value).toBe(10);
      } else if (count == 1) {
        expect(qml.value).toBe(20);
      } else {
        expect(qml.value).toBe(10);
        done();
      }
      count += 1;
    };
    qml.start();
  });

  it("changes state when conditions are met", function(done) {
    qml = loader("When", this.div);
    var count = 0;
    qml.yield = function() {
      if (count == 0) {
        expect(qml.value).toBe(10);
      } else if (count == 1) {
        expect(qml.value).toBe(20);
      } else if (count == 2) {
        expect(qml.value).toBe(30);
      } else {
        expect(qml.value).toBe(10);
        done();
      }
      count += 1;
    };
    qml.start();
  });
});
