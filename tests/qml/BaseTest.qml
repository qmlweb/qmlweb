import QtQuick 2.0

Item {
    width: 0
    height: 0
    property bool __isTest: true
    property var compareRender
    property var jasmine
    property int delay: 10
    property var startTest
    property alias timer: startupTimer
    Timer{
        id: startupTimer
        interval: delay
        triggeredOnStart: false
    }

    function start(){
        startupTimer.start()
    }


    function expect(value){
      if(jasmine !== undefined){
        return jasmineExpect(value)
      }
      else{
        return qtExpect(value);
      }
    }

    function testDone(){
      if(jasmine !== undefined){
         jasmine.done()
      }
      else{
        Qt.quit()
      }
    }

    function jasmineExpect(value){
        var exp = jasmine.expect(value)
        return exp
    }

    function qtExpect(value){
      return {
           toBe: function(expected){
               if(expected !== value){
                   console.log("FAILED: expected " + expected + " to be " + value);
               }
               else console.log("PASS");

           }
       }
    }
}
