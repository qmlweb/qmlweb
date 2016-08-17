describe("QtQuick.Font", function() {
  setupDivElement();
  var load = prefixedQmlLoader("QtQuick/qml/Font");

  it("Weights", function() {
    var qml = load("Weights", this.div);
    for (var i = 0; i < 9; ++i) {
      /* Special case for "Normal", as it just unsets the fontWeight style */
      expect(qml.repeater.itemAt(i).dom.children[0].style.fontWeight)
        .toBe("" + (i !== 3 ? (i + 1) * 100 : ""));
    }
  });
});
