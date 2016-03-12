import QtQuick 2.0

TestCase {
  id: testCase
    name: "render"
    function test(done){
      console.log("test fsdf " + testCase.name);
        compareRender(name.replace(" ", "-"), function(equal){
            expect(equal).toBe(true);
            done();
        });
    }
}
