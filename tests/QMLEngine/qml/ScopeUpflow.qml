import QtQuick 2.5

ScopeUpflowWithFoo {
  Item {
    id: child
    property int thisFoo: typeof foo == "undefined" ? "undefined" : foo
  }
}
