describe("QMLEngine.javascript", function() {
  setupDivElement();
  var load = prefixedQmlLoader("QMLEngine/qml/Javascript");

  it("can be parsed", function() {
    load("BasicSyntax", this.div);
  });

  it("can parse regexp", function() {
    var qml = load("Regexp", this.div);
    expect("toto".match(qml.reg)).toBe(null);
    expect("4242/firstsecond".match(qml.reg)).not.toBe(null);
  });
});
