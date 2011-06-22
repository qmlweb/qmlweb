
// Comment

/* Comment
 * if(true) console.log("Commented-out code");
 */
 
 
// Inside function
var shouldBeExported = (function shouldntBeExported() {

})();

function noop() {
    console.log("noop called");
    function youShouldntSeeThis() {}
}

var noopVar = noop;

if (true) {
    // This might be harder to get.
    // Also, isn't very good use of javascript :/
    var anotherVar = 5;
}

var variable1 = 1;
var variable2 = "";

function foo(ops) {

}

function foobar(op) {
     if (foo(op)) {
         return
     }

 }
