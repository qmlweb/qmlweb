import QtQuick 2.0

Item {
  property var theUndefined

  Text {
    text: typeof(theUndefined)
  }
}
