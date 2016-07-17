describe("QtBase.QColor", function() {
  it("present", function() {
    expect(!!QmlWeb && !!QmlWeb.QColor).toBe(true);
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
