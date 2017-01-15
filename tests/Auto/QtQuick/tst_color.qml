import QtQuick 2.0
import QtTest 1.0

TestCase {
  name: "color"
  property color foo: "#abcDEF"
  property color bar: "#abcdef"
  property color green: 'green'
  property color alpha: '#11aa33CC'
  property color tmp

  function test_toString() {
    compare(green.toString(), '#008000')
    compare(alpha.toString(), '#11aa33cc')
  }
  function test_rgba() {
    compare(green.r, 0)
    compare(green.g, 128 / 255)
    compare(green.b, 0)
    compare(green.a, 1)
    compare(alpha.r, 2 / 3)
    compare(alpha.g, 0.2)
    compare(alpha.b, 0.8)
    compare(alpha.a, 1 / 15)
  }
  function test_hsv() {
    compare(green.hsvHue, 1 / 3)
    compare(green.hsvSaturation, 1)
    compare(green.hsvValue, 128 / 255)
  }
  function test_hsl() {
    compare(green.hslHue, 1 / 3)
    compare(green.hslSaturation, 1)
    compare(green.hslLightness, 64 / 255)
  }
  function test_ligther() {
    compare(Qt.lighter(green).hslHue, green.hslHue)
    compare(Qt.lighter(green).hslSaturation, green.hslSaturation)
    compare(Qt.lighter(green).hslLightness, 1.5 * 64 / 255)
    compare(Qt.lighter(green, 2).hslHue, green.hslHue)
    compare(Qt.lighter(green, 2).hslSaturation, green.hslSaturation)
    compare(Qt.lighter(green, 2).hslLightness, 2 * 64 / 255)
    compare(Qt.lighter(green, 4).hslHue, -1)
    compare(Qt.lighter(green, 4).hslSaturation, 0)
    compare(Qt.lighter(green, 4).hslLightness, 1)
  }
  function test_darker() {
    compare(Qt.darker(green).hslHue, green.hslHue)
    compare(Qt.darker(green).hslSaturation, green.hslSaturation)
    compare(Qt.darker(green).hslLightness, 32 / 255)
    compare(Qt.darker(green, 4).hslHue, green.hslHue)
    compare(Qt.darker(green, 4).hslSaturation, green.hslSaturation)
    compare(Qt.darker(green, 4).hslLightness, 16 / 255)
  }
  function test_equal() {
    verify(Qt.colorEqual(green, "green"))
    verify(Qt.colorEqual(green, "#008000"))
    verify(Qt.colorEqual(green, "#ff008000"))
    verify(Qt.colorEqual("#aabbcc", "#abc"))
    verify(Qt.colorEqual("#ffAAbBCc", "#abc"))
    verify(!Qt.colorEqual(green, "red"))
    verify(!Qt.colorEqual(green, "#008001"))
    verify(!Qt.colorEqual("#aabbcc", "#abe"))
  }
  function tests_compare() {
    /* in QmlWeb, comparing colors works only with Qt.colorEqual
    verify(foo === bar);
    verify(foo == bar);
    */
    verify(Qt.colorEqual(foo, bar));
    verify(foo == "#abcdef");
    verify(foo !== "#abcDEF");
    verify(foo != "#abcDEF");
    verify(foo !== "#abcdef");
  }
  function test_rbga_set() {
    tmp = 'green';
    verify(Qt.colorEqual(tmp, "#008000"))
    tmp.r = 0.6;
    verify(Qt.colorEqual(tmp, "#998000"))
    tmp.g = 0.4;
    tmp.b = 0.2;
    verify(Qt.colorEqual(tmp, "#996633"))
    tmp.a = 0.4;
    verify(Qt.colorEqual(tmp, "#66996633"))
  }
  function test_hsv_set() {
    // Direct comparison (without toString) fails on Qt: QTBUG-58147
    tmp = green;
    verify(Qt.colorEqual(tmp, "#008000"))
    tmp.hsvSaturation = 0.5;
    verify(Qt.colorEqual(tmp + "", "#408040"))
    tmp.hsvSaturation = 0;
    verify(Qt.colorEqual(tmp + "", "#808080"))
    tmp = green;
    tmp.hsvHue = 0;
    verify(Qt.colorEqual(tmp + "", "#800000"))
    tmp.hsvValue = 0.4;
    verify(Qt.colorEqual(tmp + "", "#660000"))
    tmp = green;
    tmp.hsvValue = 0.8;
    verify(Qt.colorEqual(tmp + "", "#00cc00"))
    tmp.hsvHue = 1/6;
    verify(Qt.colorEqual(tmp + "", "#cccc00"))
    tmp.hsvHue = 2/6;
    verify(Qt.colorEqual(tmp + "", "#00cc00"))
    tmp.hsvHue = 3/6;
    verify(Qt.colorEqual(tmp + "", "#00cccc"))
    tmp.hsvHue = 4/6;
    verify(Qt.colorEqual(tmp + "", "#0000cc"))
    tmp.hsvHue = 5/6;
    verify(Qt.colorEqual(tmp + "", "#cc00cc"))
    tmp.hsvHue = 0;
    verify(Qt.colorEqual(tmp + "", "#cc0000"))
  }
  function test_hsl_set() {
    // Direct comparison (without toString) fails on Qt: QTBUG-58147
    tmp = green;
    verify(Qt.colorEqual(tmp, "#008000"))
    tmp.hslSaturation = 0.5;
    verify(Qt.colorEqual(tmp + "", "#206020"))
    tmp.hslSaturation = 0;
    verify(Qt.colorEqual(tmp + "", "#404040"))
    tmp = green;
    tmp.hslHue = 0;
    verify(Qt.colorEqual(tmp + "", "#800000"))
    tmp.hslLightness = 0.4;
    verify(Qt.colorEqual(tmp + "", "#cc0000"))
    tmp = green;
    tmp.hslLightness = 0.8;
    verify(Qt.colorEqual(tmp + "", "#99ff99"))
    tmp.hslHue = 1/6;
    verify(Qt.colorEqual(tmp + "", "#ffff99"))
    tmp.hslHue = 2/6;
    verify(Qt.colorEqual(tmp + "", "#99ff99"))
    tmp.hslHue = 3/6;
    verify(Qt.colorEqual(tmp + "", "#99ffff"))
    tmp.hslHue = 4/6;
    verify(Qt.colorEqual(tmp + "", "#9999ff"))
    tmp.hslHue = 5/6;
    verify(Qt.colorEqual(tmp + "", "#ff99ff"))
    tmp.hslHue = 0;
    verify(Qt.colorEqual(tmp + "", "#ff9999"))
  }
  function test_immut() {
    tmp = foo;
    tmp.r = 1;
    tmp.a = 0.2;
    compare(tmp.toString(), '#33ffcdef')
    compare(foo.toString(), '#abcdef')
  }
}
