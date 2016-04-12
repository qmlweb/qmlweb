

describe('Test.TestCase', function() {
  setupDivElement();
  var load = prefixedQmlLoader('Tests/qml/Test');
  var renderTest = prefixedRenderTester('Tests/qml/Test');


  qmlTest(load, "FailingTest", ["equal", "not equal"]);

  qmlTest(load, "Image");
  qmlTest(load, "ManyRenders", ["red", "blue", "green"]);
  qmlTest(load, "RenderTest");
  qmlTest(load, "Big");
});
