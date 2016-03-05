describe('QtQuick.Repeater', function() {
  var loader = prefixedQmlLoader('QtQuick/qml/Text');
  var itCanRender = prefixedRenderTester("QtQuick/qml/Text");

  setupDivElement();
  itCanRender("Basic");
});
