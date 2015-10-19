import QtQuick 2.3

// set useUpFlow to true in qtcore.js to make this example working.

RectWithFoo {
  color: "green"

  Text {
    text: "foo=" + (typeof(foo) == "undefined" ? "undefined" : foo)
  }

}
