import QtQuick 2.0

Item {
    property bool isTest: true
    id: describe
    property int expectedCalls
    property int __counter: 0
    property int delay: 10
    property var jasmine
    property var functions: []

    Timer{
        id: startupTimer
        interval: delay
        onTriggered: {
            console.log("START")
            for (var prop in parent) {
                if(typeof parent[prop] === 'function') {
                    if(prop.indexOf("it_") === 0){
                        functions.push(parent[prop]);
                    }
                }
            }
            console.log(functions)
            run(0, function(){

            })
        }
    }
    function start() {
        startupTimer.start();
    }

    function run(i, cb){
        if(i >= functions.length){
            cb()
            return
        }

        var fn = functions[i]
        if(functions[i].length === 0){ //no callback argument
            fn()
            run(i + 1, cb) //TODO: should not nest when not using callback

        }
        if(fn.length > 1){
            fn(function(){
                run(i + 1, cb)
            })
        }
    }

    function expect(value){
      if(jasmine !== undefined){
         return jasmine.expect(value)
      }
      else{
        return qtExpect(value);
      }
    }
    function done(){
      if(jasmine !== undefined){
         jasmine.done()
      }
      else{
        Qt.quit()
      }
    }

    function qtExpect(value){
      return {
           toBe: function(expected){
               __counter += 1
               if(expected !== value){
                   console.log("FAILED: expected " + expected + " to be " + value);
               }
               else console.log("PASS");
               console.log("expectedCalls", expectedCalls, __counter)
               if(__counter === expectedCalls){
                   console.log("done")
                   done()
               }
           }
       }
    }

}
