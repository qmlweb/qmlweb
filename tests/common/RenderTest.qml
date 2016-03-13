import QtQuick 2.0

TestCase {
  id: testCase
  name: "render"
  function test(done) {
    var before = findFunction("before");
    if(typeof before === "function") before();

    compareRender(name.replace(" ", "-"), function(equal) {
      expect(equal).toBe(true);
      done();
    });
  }
}
