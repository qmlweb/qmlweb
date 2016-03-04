import QtQuick 2.0
import QtQuick.Controls 1.1

Item {
  property alias childX: child.x

  Item {
    id: child
    x: 125
  }

  property string log: ""
  onChildXChanged: log = log + "childX changed to "+childX+"!"

  function go() {
    child.x = 44;
  }

  Column {
    Text {
      text: log
    }
    Button {
      text: "go!"
      onClicked: go();
    }
  }
}
