import QtQuick 2.0

ScopeOverrideBase {
  id: foo
  width: 200

  function getFooWidth() {
    return foo.width;
  }

  Text {
    text: getFooWidth()
  }
}
