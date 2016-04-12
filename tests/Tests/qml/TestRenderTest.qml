import QtQuick 2.0
import "../../common"

Item {
    width: 25
    height: 25
    Rectangle {
      color: 'red'
      width: 25
      height: 25
    }

    RenderTest { delay: 1000 }
}
