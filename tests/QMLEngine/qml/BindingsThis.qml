import QtQuick 2.0

Item {
  property int intA: 10
  property int intB: this.intA * 2
  function foo() {
    return this.intB + this.intA;
  }
}
