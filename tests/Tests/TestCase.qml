import QtQuick 2.0
import "../include"
Rectangle {
    id: root
    width: 200
    height: 300
    color: "orange"
    Rectangle{
        id: nested
        width: 30
        height: 30
        anchors.centerIn: parent
        color: "red"
    }

    SequentialTest {
        id: test
        delay: 200
        function it_isRunFirst(){
            test.expect(true).toBe(true)
        }
        function it_compareScreenshot(done){
            test.compareRender("", function(equal){
                expect(equal).toBe(true);
                done();
            });
        }

        function it_isRunSecond(){
            test.expect(true).toBe(true)
        }
    }

}
