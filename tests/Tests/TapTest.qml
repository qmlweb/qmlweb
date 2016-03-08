import QtQuick 2.0

Item {

    function expect(value){
      console.log("expect", value)
      var exp = null
      if(jasmine !== undefined){
        exp = jasmineExpect(value)
      }
      else{
        exp = qtExpect(value);
      }

      var oldExp = exp.toBe.bind(exp);
      exp.toBe = function(value){
         __counter += 1
         oldExp(value)

         if(__counter === expectedCalls){
            console.log("done", value)
            testDone()
         }
      }
      return exp
    }
}
