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
        interval: 200
        triggeredOnStart: false
        onTriggered: {
            console.log("trigger")
            nested.width =  60
            test.expect(nested.width).toBe(60)
            test.compareRender("bigger", function(equal){
                test.expect(equal).toBe(true);
            });
        }
    }
    function start(){
      timer.start();
    }

    Describe {
        id: test
        delay: 150
        expectedCalls: 5
        function it_isRunFirst(){
            console.log("test 1")
            test.expect(true).toBe(true)
        }
        function it_compareScreenshot(){
            console.log("test 2 screenshot")
            test.compareRender("", function(equal){
                expect(equal).toBe(true);
            });
        }

        function it_isRunSecond(){
            console.log("test 3")
            test.expect(true).toBe(true)
        }
    }

}
