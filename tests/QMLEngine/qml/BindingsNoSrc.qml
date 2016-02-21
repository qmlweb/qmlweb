import QtQuick 2.0

Item {
  width: 10
  height: (typeof bindSrc === 'undefined') ? width + 2 : bindSrc.length
}
