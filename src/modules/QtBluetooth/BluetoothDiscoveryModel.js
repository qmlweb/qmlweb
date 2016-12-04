QmlWeb.registerQmlType({
  module: "QtBluetooth",
  name: "BluetoothDiscoveryModel",
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  enums: {
    BluetoothDiscoveryModel: {
      FullServiceDiscovery: 1, MinimalServiceDiscovery: 0, DeviceDiscovery: 2,
      NoError: 0, InputOutputError: 1, PoweredOffError: 2,
      InvalidBluetoothAdapterError: 4, UnknownError: 3
    }
  },
  properties: {
    discoveryMode: { type: "enum", initialValue: 3 }, // MinimalServiceDiscovery
    error: { type: "enum", initialValue: 0 }, // NoError
    remoteAddress: "string",
    running: "bool",
    uuidFilter: "string",
    url: "url"
  },
  signals: {
    deviceDiscovered: [{ type: "string", name: "device" }],
    serviceDiscovered: [{ type: "string", name: "device" }]
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    // TODO: implementation based on navigator.bluetooth
  }
});
