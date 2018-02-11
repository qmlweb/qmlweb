// eslint-disable-next-line no-undef
class QtQuick_Controls_ComboBox extends QtQuick_Item {
  static properties = {
    count: "int",
    currentIndex: "int",
    currentText: "string",
    menu: { type: "array", initialValue: [] },
    model: { type: "array", initialValue: [] },
    pressed: "bool"
  };
  static signals = {
    accepted: [],
    activated: [{ type: "int", name: "index" }]
  };

  constructor(meta) {
    super(meta);

    this.dom.style.pointerEvents = "auto";
    this.name = "QMLComboBox";

    // TODO change innerHTML to DOM
    this.dom.innerHTML = "<select></select>";
    this.impl = this.dom.firstChild;

    this.Component.completed.connect(this, this.Component$onCompleted);
    this.modelChanged.connect(this, this.$onModelChanged);
    this.currentIndexChanged.connect(this, this.$onCurrentIndexChanged);
    this.heightChanged.connect(this, this.$onHeightChanged);
    this.widthChanged.connect(this, this.$onWidthChanged);

    this.dom.onclick = () => {
      const index = this.dom.firstChild.selectedIndex;
      this.currentIndex = index;
      this.currentText = this.model[index];
      this.accepted();
      this.activated(index);
    };
  }
  find(text) {
    return this.model.indexOf(text);
  }
  selectAll() {
    // TODO
  }
  textAt(index) {
    return this.model[index];
  }
  $updateImpl() {
    this.count = this.model.length;

    const k = this.count; const m = this.model;

    this.impl.options.length = k;
    for (let i = 0; i < k; i++) {
      this.impl.options[i] = new Option(m[i]);
    }

    // should call this, because width()/heights() invoke updateV(H)Geometry,
    // which in turn sets valid $useImplicitHeight flag
    const h = this.height; const w = this.width;

    this.implicitWidth = this.impl.offsetWidth;
    this.implicitHeight = this.impl.offsetHeight;

    this.$onHeightChanged(h);
    this.$onWidthChanged(w);

    this.impl.selectedIndex = this.currentIndex;
    this.$updateCurrentText();
  }
  Component$onCompleted() {
    this.$updateImpl();
  }
  $onModelChanged() {
    this.$updateImpl();
  }
  $onCurrentIndexChanged() {
    const i = this.currentIndex;
    if (this.impl.selectedIndex !== i) {
      this.impl.selectedIndex = i;
      this.$updateCurrentText();
      this.activated(i);
    }
  }
  $updateCurrentText() {
    if (typeof this.currentIndex === "undefined" || !this.model) {
      this.currentText = undefined;
    } else if (this.currentIndex >= 0 &&
              this.currentIndex < this.model.length) {
      this.currentText = this.model[ this.currentIndex ];
    }
  }
  $onHeightChanged() {
    if (this.height > 0 && this.impl
     && this.height !== this.impl.offsetHeight) {
      this.impl.style.height = `${this.height}px`;
    }
  }
  $onWidthChanged() {
    if (this.width > 0 && this.impl && this.width !== this.impl.offsetWidth) {
      this.impl.style.width = `${this.width}px`;
    }
  }
}
