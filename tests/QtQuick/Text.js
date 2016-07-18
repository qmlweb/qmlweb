describe("QtQuick.Text", function() {
  setupDivElement();

  var load = prefixedQmlLoader("QtQuick/qml/Text");
  it("implicit size", function() {
    var qml = load("ImplicitSize", this.div);
    expect(qml.text_item.width).toBeGreaterThan(0);
  });
});

