// eslint-disable-next-line no-undef
class QtQuick_Controls_CheckBox extends QtQuick_Item {
  static properties = {
    text: "string",
    font: "font",
    checked: "bool",
    color: "color"
  };

  constructor(meta) {
    super(meta);

    this.impl = document.createElement("label");
    this.impl.style.pointerEvents = "auto";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.style.verticalAlign = "text-bottom";
    checkbox.addEventListener("change", () => {
      this.checked = checkbox.checked;
    });
    this.impl.appendChild(checkbox);

    const span = document.createElement("span");
    this.impl.appendChild(span);

    this.dom.appendChild(this.impl);

    this.Component.completed.connect(this, this.Component$onCompleted);
    this.textChanged.connect(this, this.$onTextChanged);
    this.colorChanged.connect(this, this.$onColorChanged);
    this.checkedChanged.connect(this, this.$onCheckedChanged);
  }
  $onTextChanged(newVal) {
    this.impl.children[1].innerHTML = newVal;
    this.implicitHeight = this.impl.offsetHeight;
    this.implicitWidth = this.impl.offsetWidth > 0 ?
                          this.impl.offsetWidth + 4 :
                          0;
  }
  $onColorChanged(newVal) {
    this.impl.children[1].style.color = newVal.$css;
  }
  $onCheckedChanged() {
    this.impl.children[0].checked = this.checked;
  }
  Component$onCompleted() {
    this.implicitHeight = this.impl.offsetHeight;
    this.implicitWidth = this.impl.offsetWidth > 0 ?
                          this.impl.offsetWidth + 4 :
                          0;
  }
}
