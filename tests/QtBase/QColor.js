describe("QtBase.QColor", function() {
  it("present", function() {
    expect(!!QmlWeb && !!QmlWeb.QColor).toBe(true);
  });

  it("construction", function() {
    var colors = [
      "#abcDEF",
      "#abcdef",
      0xabcdef
    ];
    colors.forEach(function(input) {
      var color = new QmlWeb.QColor(input);
      expect(color.toString()).toBe("#abcdef");
    });
  });

  it("comparison", function() {
    var color = new QmlWeb.QColor("#abcDEF");
    expect(color.toString()).toBe("#abcdef");
    // eslint-disable-next-line eqeqeq
    expect(color == "#abcdef").toBe(true);
    // eslint-disable-next-line eqeqeq
    expect(color == "#abcDEF").toBe(false);
    expect(color === "#abcdef").toBe(false);
  });
});
