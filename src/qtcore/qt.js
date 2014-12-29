global.Qt = {
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
  RightToLeft: 1,
  // Keys
  Key_Asterisk: 0, Key_Back: 0, Key_Backtab: 0, Key_Call: 0, Key_Cancel: 0, Key_Flip: 0, Key_Hangup: 0, Key_Menu: 0, Key_No: 0, Key_Return: 0, Key_Select: 0,
  Key_Space: 0, Key_Tab: 0, Key_VolumeDown: 0, Key_VolumeUp: 0, Key_VolumeMute: 0, Key_Yes: 0,
  Key_Backspace: 8, Key_Tab: 9, Key_Enter: 13, Key_Shift: 16, Key_Control: 17, Key_Alt: 18,
  Key_Pause: 19, Key_CapsLock: 20, Key_Escape: 27, Key_PageUp: 33, Key_PageDown: 34, Key_End: 35, Key_Home: 36,
  Key_Left: 37, Key_Up: 38, Key_Right: 39, Key_Down: 40,
  Key_Insert: 45, Key_Delete: 46,
  Key_0: 48, Key_1: 49, Key_2: 50, Key_3: 51, Key_4: 52, Key_5: 53, Key_6: 54, Key_7: 55, Key_8: 56, Key_9: 57,
  Key_A: 65, Key_B: 66, Key_C: 67, Key_D: 68, Key_E: 69, Key_F: 70, Key_G: 71, Key_H: 72, Key_I: 73, Key_J: 74, Key_K: 75, Key_L: 76, Key_M: 77, Key_N: 78, Key_O: 79, Key_P: 80, Key_Q: 81, Key_R: 82, Key_S: 83, Key_T: 84, Key_U: 85, Key_V: 86, Key_W: 87, Key_X: 88, Key_Y: 89, Key_Z: 90,
  Key_Select: 93,
  Key_F1: 112, Key_F2: 113, Key_F3: 114, Key_F4: 115, Key_F5: 116, Key_F6: 117, Key_F7: 118, Key_F8: 119, Key_F9: 120, Key_F10: 121, Key_F11: 122, Key_F12: 123, Key_F13: 124, Key_F14: 125, Key_F15: 126, Key_F16: 127, Key_F17: 128, Key_F18: 129
}
