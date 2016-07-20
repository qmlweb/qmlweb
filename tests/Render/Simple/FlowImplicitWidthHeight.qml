import QtQuick 2.0

Rectangle {
  width: 31
  height: 26

  /* Test implicitWidth with a row */
  Row {
    Flow {
      flow: Flow.LeftToRight
      spacing: 1
      Repeater {
        model: 2
        Rectangle {
          width: 4
          height: 4
          color: "red"
        }
      }
    }
    Flow {
      flow: Flow.TopToBottom
      spacing: 1
      Repeater {
        model: 2
        Rectangle {
          width: 4
          height: 4
          color: "blue"
        }
      }
    }
    Flow {
      flow: Flow.TopToBottom
      spacing: 1
      height: 9
      Repeater {
        model: 4
        Rectangle {
          width: 4
          height: 4
          color: "black"
        }
      }
    }
    /* Test implicitHeight with a column */
    Column {
      Flow {
        flow: Flow.LeftToRight
        spacing: 1
        Repeater {
          model: 2
          Rectangle {
            width: 4
            height: 4
            color: "green"
          }
        }
      }
      Flow {
        flow: Flow.TopToBottom
        spacing: 1
        Repeater {
          model: 2
          Rectangle {
            width: 4
            height: 4
            color: "orange"
          }
        }
      }
      Flow {
        flow: Flow.LeftToRight
        spacing: 1
        width: 9
        Repeater {
          model: 4
          Rectangle {
            width: 4
            height: 4
            color: "blue"
          }
        }
      }
      Rectangle {
        width: 4
        height: 4
        color: "red"
      }
    }
  }
}
