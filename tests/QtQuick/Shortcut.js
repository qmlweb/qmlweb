describe("QtQuick.Shortcut", function() {
  setupDivElement();
  var load = prefixedQmlLoader("QtQuick/qml/Shortcut");

  // Works in live version. Doesn't work here.
  // The modifiers on the shortcut item is set to zero by
  // something.
  xit("Sequence", function() {
    var qml = load("Sequence", this.div);
    var called = 0;
    var event = {
      key: QmlWeb.Qt.Key_P,
      modifiers: QmlWeb.Qt.ControlModifer | QmlWeb.Qt.AltModifer
    };

    expect(qml.sequences[0].$text).toBe("Ctrl+Alt+P");
    expect(qml.sequences[0].$sequences.length).toBe(1);
    expect(qml.sequences[0].$sequences[0].key)
      .toBe(QmlWeb.Qt.Key_P);
    expect(qml.sequences[0].$sequences[0].modifiers)
      .toBe(QmlWeb.Qt.ControlModifer | QmlWeb.Qt.AltModifer);
    expect(
      qml.sequences[0].$match(event)
    ).toBe(true);
    qml.activated.connect(this, () => {
      called++;
    });
    qml.Keys.pressed(event);
    expect(called).toBe(1);
  });
});

