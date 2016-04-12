import QtQuick 2.0
import "../../common"

Item {
  width: 25
  height: 25

  Rectangle {
    id: rect
    color: 'red'
    width: 25
    height: 25
  }

  RenderTest { name: "equal"}
  TestCase {
    name: "not equal"
    function test(done){
      rect.color = 'blue'
      console.log("test " + name);
      //doesnt trigger screenshot function in qt
      compareRender("equal", false, function(equal){
        expect(equal).toBe(false);
        done();
      });
    }
  }

}
