// eslint-disable-next-line no-undef
class QtQuick_Layouts_DirectionalLayout extends QtQuick_Layouts_Positioner {
  constructor(meta) {
    super(meta);
    this.spacingChanged.connect(this, this.layoutChildren);
    this.layoutDirectionChanged.connect(this, this.layoutChildren);
  }
}
