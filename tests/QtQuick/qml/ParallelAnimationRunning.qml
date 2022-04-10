import QtQuick 2.0

Item {
  width: 900
  height: 300

  Row {
    Rectangle { id: rectA }
    Rectangle { id: rectB }
    Rectangle { id: rectC }
  }

  ParallelAnimation {
    id:ani
    ColorAnimation { target: rectA; property: "color"; to: 'red'; duration: 100 }
    ColorAnimation { target: rectB; property: "color"; to: 'green'; duration: 100 }
    ColorAnimation { target: rectC; property: "color"; to: 'blue'; duration: 100 }
  }
}

