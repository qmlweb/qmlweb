describe('QtQuick.Repeater', function() {
  var loader = prefixedQmlLoader('QtQuick/qml/Repeater');
  var itCanRender = prefixedRenderTester("QtQuick/qml/Repeater");

  setupDivElement();
  itCanRender("Number");
});
