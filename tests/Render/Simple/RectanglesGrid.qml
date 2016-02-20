import QtQuick 2.0

Rectangle {
  color: 'white'
  width: 20
  height: 15
  Grid {
    columns: 3
    spacing: 2
    Rectangle { color: 'red'; width: 5; height: 5 }
    Rectangle { color: 'green'; width: 6; height: 3 }
    Rectangle { color: 'blue'; width: 2; height: 6 }
    Rectangle { color: 'cyan'; width: 1; height: 1 }
    Rectangle { color: 'black'; width: 4; height: 4 }
  }
}
