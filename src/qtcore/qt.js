window.Qt = {
  rgba: function(r,g,b,a) {
    return "rgba("
      + Math.round(r * 255) + ","
      + Math.round(g * 255) + ","
      + Math.round(b * 255) + ","
      + a + ")";
  },
  // Buttons masks
  LeftButton: 1,
  RightButton: 2,
  MiddleButton: 4,
  // Modifiers masks
  NoModifier: 0,
  ShiftModifier: 1,
  ControlModifier: 2,
  AltModifier: 4,
  MetaModifier: 8,
  KeypadModifier: 16, // Note: Not available in web
  // Layout directions
  LeftToRight: 0,
  RightToLeft: 1
}
