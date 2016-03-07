import QtQuick 2.0

Rectangle {
    id: root
    width: 100
    height: 100
    color: "orange"
    Rectangle{
        id: nested
        width: 30
        height: 30
        anchors.centerIn: parent
        color: "red"
    }

    Timer{
        id: timer
        interval: 100
        onTriggered: {
            nested.width =  60
            test.expect(nested.width).toBe(60)
            compareRender("bigger", function(equal){
                test.expect(equal).toBe(true);
            });
            test.expect(false).toBe(true)
        }
    }

    Describe {
        id: test
        expectedCalls: 6
        function it_isRunFirst(){
            timer.start();
            console.log(1)
            expect(true).toBe(false)
        }
        function it_compareScreenshot(){
            compareRender("", function(equal){
                expect(equal).toBe(true);
            });
        }

        function it_isRunSecond(){
            console.log(2)
            expect(true).toBe(true)
        }
    }

}
