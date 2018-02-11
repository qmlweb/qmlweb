// eslint-disable-next-line no-undef
class QtBluetooth_BluetoothDiscoveryModel extends QtQml_QtObject {
  static enums = {
    BluetoothDiscoveryModel: {
      FullServiceDiscovery: 1, MinimalServiceDiscovery: 0, DeviceDiscovery: 2,
      NoError: 0, InputOutputError: 1, PoweredOffError: 2,
      InvalidBluetoothAdapterError: 4, UnknownError: 3
    }
  };
  static properties = {
    discoveryMode: { type: "enum", initialValue: 3 }, // MinimalServiceDiscovery
    error: { type: "enum", initialValue: 0 }, // NoError
    remoteAddress: "string",
    running: "bool",
    uuidFilter: "string",
    url: "url"
  };
  static signals = {
    deviceDiscovered: [{ type: "string", name: "device" }],
    serviceDiscovered: [{ type: "string", name: "device" }]
  };

  // TODO: implementation based on navigator.bluetooth
}
