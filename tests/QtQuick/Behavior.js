describe("QtQuick.Behavior", function() {
  setupDivElement();
  var load = prefixedQmlLoader("QtQuick/qml/Behavior");

  it("Basic", function(done) {
    var qml = load("Basic", this.div);
    expect(qml.gotX).toBe(false);
    expect(qml.gotY).toBe(false);
    setTimeout(function() {
      expect(qml.gotX).toBe(true);
      expect(qml.gotY).toBe(false);
      done();
    }, 200);
  });
});
