QmlWeb.registerQmlType({
  module: "QtMultimedia",
  name: "Camera",
  versions: /^5\./,
  baseClass: "QtQml.QtObject",
  enums: {
    Camera: {
      Available: 0, Busy: 2, Unavailable: 1, ResourceMissing: 3,

      UnloadedState: 0, LoadedState: 1, ActiveState: 2
    }
  },
  properties: {
    availability: "enum", // Camera.Available
    cameraState: { type: "enum", initialValue: 2 }, // Camera.ActiveState
    cameraStatus: "enum", // TODO
    captureMode: "enum", // TODO
    deviceId: "string",
    digitalZoom: { type: "real", initialValue: 1 },
    displayName: "string",
    errorCode: "enum", // TODO
    errorString: "string",
    lockStatus: "enum", // TODO
    maximumDigitalZoom: "real",
    maximumOpticalZoom: "real",
    opticalZoom: { type: "real", initialValue: 1 },
    orientation: "int",
    position: "enum", // TODO
  },
  signals: {
    error: [
      { type: "enum", name: "errorCode" },
      { type: "string", name: "errorString" }
    ]
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    // TODO: impl
  }
});
