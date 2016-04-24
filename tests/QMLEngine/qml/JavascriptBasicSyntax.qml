import QtQuick 2.0

Item {
  //this is a line comment
  /*
  this is a block comment
  */
  function ifstatements(arg) {
    const b = 10;
    var foo = 0;
    if (arg == 0)
      foo = 1;
    else if (arg == 1)
      foo = 2 * 2;
    else
      foo = 2;
    return foo;
  }

  function trycatch() {
    try {
      throw new Error();
    } catch(e) {
      console.log(e);
    } finally {
      return 1;
    }
  }

  function foreach() {
    for (var i = 0; i < 5; i++) {
      continue;
    }
    var a = [1, 2, 3];
    for (var k in a) {
      break;
    }
  }

  function switchcase(arg) {
    var a = 0
    switch (arg) {
      case 1:
        a = 1;
        break;
      case "32":
        a = "hm";
        break;
      default:
        a = undefined;
    }
    return a;
  }
}
