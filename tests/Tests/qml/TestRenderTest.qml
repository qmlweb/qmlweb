import QtQuick 2.0
import "../../qml"
Item{
    Rectangle {
      id: rect
      color: 'red'
      width: 25
      height: 25
    }
    width: 25
    height: 25
    RenderTest { }
    TestCase {
        name: "not equal"
        function test(done){
            rect.color = 'blue'
            console.log("test " + name);
            //doesnt trigger screenshot function in qt
            compareRender("render", false, function(equal){
                expect(equal).toBe(false);
                done();
            });
        }
    }

}
