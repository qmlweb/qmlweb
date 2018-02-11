// eslint-disable-next-line no-undef
class QmlWeb_RestModel extends QtQuick_Item {
  static properties = {
    url: "string",
    isLoading: "bool",
    mimeType: { type: "string", initialValue: "application/json" },
    queryMimeType: {
      type: "string",
      initialValue: "application/x-www-urlencoded"
    }
  };
  static signals = {
    fetched: [],
    saved: []
  };

  constructor(meta) {
    super(meta);

    this.attributes = this.getAttributes();
    this.runningRequests = 0;
  }
  fetch() {
    this.$ajax({
      method: "GET",
      mimeType: this.mimetype,
      success: xhr => {
        this.$xhrReadResponse(xhr);
        this.fetched();
      }
    });
  }
  remove() {
    this.$ajax({
      method: "DELETE",
      success: () => {
        this.destroy();
      }
    });
  }
  create() {
    this.$sendToServer("POST");
  }
  save() {
    this.$sendToServer("PUT");
  }
  $sendToServer(method) {
    this.$ajax({
      method,
      mimeType: this.queryMimeType,
      body: this.$generateBodyForPostQuery(),
      success: xhr => {
        this.$xhrReadResponse(xhr);
        this.saved();
      }
    });
  }
  $generateBodyForPostQuery() {
    const object = {};
    for (let i = 0; i < this.attributes.length; ++i) {
      object[this.attributes[i]] = this.$properties[this.attributes[i]].get();
    }
    console.log(object);
    switch (this.queryMimeType) {
      case "application/json":
      case "text/json":
        return JSON.stringify(object);
      case "application/x-www-urlencoded":
        return this.$objectToUrlEncoded(object);
    }
    return undefined;
  }
  $objectToUrlEncoded(object, prefix) {
    const parts = [];
    for (let key in object) {
      if (object.hasOwnProperty(key)) {
        const value = object[key];
        if (typeof prefix !== "undefined") {
          key = `${prefix}[${key}]`;
        }
        if (typeof value === "object") {
          parts.push(this.$objectToUrlEncoded(value, key));
        } else {
          const ekey = this.$myEncodeURIComponent(key);
          const evalue = this.$myEncodeURIComponent(value);
          parts.push(`${ekey}=${evalue}`);
        }
      }
    }
    return parts.join("&");
  }
  $myEncodeURIComponent(str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, c =>
      `%${c.charCodeAt(0).toString(16)}`
    );
  }
  $ajax(options) {
    const xhr = new XMLHttpRequest();
    xhr.overrideMimeType(this.mimeType);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 200) {
          options.success(xhr);
        } else {
          options.failure(xhr);
        }
        this.runningRequests -= 1;
        if (this.runningRequests <= 0) {
          this.isLoading = false;
        }
      }
    };
    xhr.open(options.method, this.url, true);
    if (typeof options.body !== "undefined") {
      xhr.setRequestHeader("Content-Type", this.queryMimeType);
      xhr.send(options.body);
    } else {
      xhr.send(null);
    }
    this.runningRequests += 1;
    this.isLoading = true;
  }
  $xhrReadResponse(xhr) {
    let responseObject;
    if (this.mimeType === "application/json" || this.mimeType === "text/json") {
      responseObject = JSON.parse(xhr.responseText);
    }
    this.$updatePropertiesFromResponseObject(responseObject);
  }
  $updatePropertiesFromResponseObject(responseObject) {
    const QMLProperty = QmlWeb.QMLProperty;
    for (const key in responseObject) {
      if (responseObject.hasOwnProperty(key) && this.$hasProperty(key)) {
        this.$properties[key].set(responseObject[key], QMLProperty.ReasonUser);
      }
    }
  }
  $hasProperty(name) {
    return typeof this.$properties[name] !== "undefined";
  }
}
