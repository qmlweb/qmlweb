describe("QtQuick.Item", function() {
  setupDivElement();
  var load = prefixedQmlLoader("QtQuick/qml/Item");

  it("Empty", function() {
    load("Empty", this.div);
    var div = this.div.children[0];
    expect(div.innerHTML).toBe("");
    expect(div.style.backgroundColor).toBe("");
  });
  it("Size", function() {
    load("Size", this.div);
    var div = this.div.children[0];
    expect(div.offsetWidth).toBe(200);
    expect(div.offsetHeight).toBe(100);
    expect(div.clientWidth).toBe(200);
    expect(div.clientHeight).toBe(100);
  });
});
