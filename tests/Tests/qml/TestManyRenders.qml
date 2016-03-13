import QtQuick 2.0
import "../../common"

Rectangle {
  id: rect
  color: 'red'
  width: 25
  height: 25

  RenderTest {
      name: "red"
  }

  RenderTest {
      name: "blue"
      function before(){
          rect.color = 'blue';
      }
  }

  TestCase {
    name: "green"
    function test(done) {
      rect.color = 'green'
      compareRender(name, function(equal){
        expect(equal).toBe(true);
        done();
      });
    }
  }
}
