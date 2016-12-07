const anchorNames = [
  "left", "right", "top", "bottom", "verticalCenter", "horizontalCenter"
];

const ignoreProps = [
  "x", "y", "z", "scale", "rotation", "implicitWidth", "implicitHeight"
];

function getProperties(file) {
  // TODO: implement a cleaner way

  const div = document.createElement("div");
  const engine = new QmlWeb.QMLEngine(div);
  engine.loadFile(file);

  const qml = engine.rootObject;
  const properties = Object.keys(qml.$properties).filter(name => {
    // Invalid names
    if (!name.match(/^[a-z]+$/i) || name === "is") return false;

    // We don't need anchors
    if (anchorNames.indexOf(name) !== -1) return false;

    // These properties are not supported in a good way on top-level items
    if (ignoreProps.indexOf(name) !== -1) return false;

    const type = qml.$properties[name].type;
    return ["real", "color", "int", "bool", "string"].indexOf(type) !== -1;
  });

  engine.stop();
  return properties;
}

function registerElement(name, file) {
  // Delay until the document is fully loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      registerElement(name, file);
    });
    return;
  }

  // Bail out if Custom Elements v1 are not present
  if (!window.customElements) {
    throw new Error(
      "window.customElements are not supported. Consider installing a polyfill."
    );
  }

  // We need attributes list at this point, those form a static property
  const properties = getProperties(file);
  const attributes = properties.map(pname => pname.toLowerCase());
  const attr2prop = properties.reduce((map, pname) => {
    map[pname.toLowerCase()] = pname;
    return map;
  }, {});

  const QmlElement = class extends HTMLElement {
    connectedCallback() {
      // Default wrapper display is inline-block to support native width/height
      const computedStyle = window.getComputedStyle(this);
      if (computedStyle.display === "inline") {
        this.style.display = "inline-block";
      }

      const engine = this.engine = new QmlWeb.QMLEngine(this);
      engine.loadFile(file);
      engine.start();
      const qml = this.qml = engine.rootObject;

      // Bind attributes
      attributes.forEach(attr => {
        const pname = attr2prop[attr] || attr;
        const val = this.getAttribute(attr);
        if (typeof val === "string") {
          qml[pname] = val;
        }
        this.applyAttribute(attr);
        Object.defineProperty(
          this,
          attr,
          {
            get() {
              return this.qml[pname];
            },
            set(value) {
              this.qml[pname] = value;
              this.applyAttribute(attr);
            }
          }
        );
        qml.$properties[pname].changed.connect(() => this.applyAttribute(attr));
      });

      // Set and update wrapper width/height
      this.style.width = `${qml.width}px`;
      this.style.height = `${qml.height}px`;
      qml.$properties.width.changed.connect(width => {
        this.style.width = `${width}px`;
      });
      qml.$properties.height.changed.connect(height => {
        this.style.height = `${height}px`;
      });
    }

    static get observedAttributes() {
      return attributes;
    }

    attributeChangedCallback(attr, oldValue, newValue) {
      if (!this.qml) return;
      const pname = attr2prop[attr] || attr;
      const prop = this.qml.$properties[pname];
      if (!prop) return;
      switch (prop.type) {
        case "bool":
          this.qml[pname] = typeof newValue === "string";
          break;
        default:
          this.qml[pname] = newValue;
      }
    }

    applyAttribute(attr) {
      const pname = attr2prop[attr] || attr;
      const prop = this.qml.$properties[pname];
      if (!prop) {
        this.deleteAttribute(attr);
        return;
      }
      const value = this.qml[pname];
      switch (prop.type) {
        case "bool":
          if (value) {
            this.setAttribute(attr, "");
          } else {
            this.removeAttribute(attr);
          }
          break;
        default:
          this.setAttribute(attr, this.qml[pname]);
      }
    }
  };

  window.customElements.define(name, QmlElement);
}

QmlWeb.registerElement = registerElement;
