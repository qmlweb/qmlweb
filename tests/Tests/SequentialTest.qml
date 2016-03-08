import QtQuick 2.0

BaseTest {
    property bool isTest: true
    id: describe
    property var functions: []
    startTest: function(){
        console.log("START")
        findTests()
        run(0, function(){
            console.log("Test done")
            testDone();
        })
    }

    function findTests(){
        for (var prop in describe) {
            if(typeof describe[prop] === 'function') {
                if(prop.indexOf("it_") === 0){
                    functions.push(describe[prop]);
                }
            }
        }
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
        else {
            console.log("async")
            fn(function(){
                run(i + 1, cb)
            })
        }
    }
}
