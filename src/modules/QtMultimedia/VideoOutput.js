// eslint-disable-next-line no-undef
class QtMultimedia_VideoOutput extends QtQuick_Item {
  static versions = /^5\./;
  static enums = {
    VideoOutput: { PreserveAspectFit: 0, PreserveAspectCrop: 1, Stretch: 2 }
  };
  static properties = {
    autoOrientation: "bool",
    contentRect: "rect",
    fillMode: "enum", // VideoOutput.PreserveAspectFit
    filters: "list",
    orientation: "int",
    source: "variant",
    sourceRect: "rect"
  };

  // TODO: impl
}
