import QtQuick 2.0

Grid {
  columns: 4
  spacing: 3
  Rectangle { color: "red"; width: 5; height: 5 }
  Rectangle { color: 'green'; width: 6; height: 3 }
  Rectangle { color: "#00f"; width: 2; height: 6 }
  Rectangle { color: 'cy' + 'an'; width: 1; height: 1 }
  Rectangle { color: false ? 'green' : "magenta"; width: 4; height: 4 }
}
