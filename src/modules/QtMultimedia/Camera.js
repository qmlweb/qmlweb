// eslint-disable-next-line no-undef
class QtMultimedia_Camera extends QtQml_QtObject {
  static versions = /^5\./;
  static enums = {
    Camera: {
      Available: 0, Busy: 2, Unavailable: 1, ResourceMissing: 3,

      UnloadedState: 0, LoadedState: 1, ActiveState: 2
    }
  };
  static properties = {
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
  };
  static signals = {
    error: [
      { type: "enum", name: "errorCode" },
      { type: "string", name: "errorString" }
    ]
  };

  // TODO: impl
}
