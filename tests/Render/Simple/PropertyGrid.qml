import QtQuick 2.0
import "./res"

Grid {
  columns: 4
  spacing: 3
  Rectangle { color: "red"; width: 5; height: 5 }
  PropertyGridComponent { color: 'green'; width: 6; height: 3 }
  Rectangle { color: "#00f"; width: 2; height: 6 }
  PropertyGridComponent { color: 'cy' + 'an'; width: 1; height: 1 }
  Rectangle { color: false ? 'green' : "magenta"; width: 4; height: 4 }
}
