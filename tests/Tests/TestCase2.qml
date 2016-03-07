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

    //Component.onCompleted: {
    //  timer.start()
    //}

    Timer{
        id: timer
        interval: 100
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
        delay: 100
        expectedCalls: 5
        function it_isRunFirst(){

            console.log("test 1")
            test.expect(true).toBe(true)
            console.log("hmm")
        }
        function it_compareScreenshot(){
            console.log("Screenshot")
            test.compareRender("", function(equal){
                console.log("ScreenshotDone", equal)
                expect(equal).toBe(true);
            });
        }

        function it_isRunSecond(){
            console.log(2)
            test.expect(true).toBe(true)
        }
    }

}
