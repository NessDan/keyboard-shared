import assert from "node:assert/strict";
import test from "node:test";

import { connectToAdapter } from "../hardware/device.js";

function makeInterface(
  interfaceNumber,
  interfaceClass,
  endpointNumber,
  endpointDirection = "out"
) {
  const alternate = {
    alternateSetting: 0,
    interfaceClass,
    interfaceSubclass: 0,
    interfaceProtocol: 0,
    endpoints:
      endpointNumber == null
        ? []
        : [
            {
              endpointNumber,
              direction: endpointDirection,
              type: "interrupt",
              packetSize: 64,
            },
          ],
  };

  return {
    interfaceNumber,
    alternate,
    alternates: [alternate],
    claimed: false,
  };
}

function makeDevice({
  vendorId,
  productId,
  interfaceNumber,
  interfaceClass = 0xff,
  outEndpointNumber = 7,
  endpointDirection = "out",
  configurationValue = 1,
  prependHidInterface = false,
  opened = false,
  configured = false,
}) {
  const configuration = {
    configurationValue,
    configurationName: null,
    interfaces: [
      ...(prependHidInterface ? [makeInterface(0, 0x03, 3)] : []),
      makeInterface(
        interfaceNumber,
        interfaceClass,
        outEndpointNumber,
        endpointDirection
      ),
    ],
  };

  return {
    vendorId,
    productId,
    opened,
    configuration: configured ? configuration : null,
    configurations: [configuration],
    async open() {
      this.opened = true;
    },
    async selectConfiguration(configurationValue) {
      if (!this.opened) throw new Error("Device must be opened");
      const selected = this.configurations.find(
        (candidate) => candidate.configurationValue === configurationValue
      );
      if (!selected) throw new Error("Unsupported configuration");
      this.configuration = selected;
    },
    async claimInterface(claimedInterfaceNumber) {
      if (!this.opened) throw new Error("Device must be opened");
      if (!this.configuration) throw new Error("Device must be configured");
      const claimed = this.configuration?.interfaces.find(
        (candidate) =>
          candidate.interfaceNumber === claimedInterfaceNumber
      );
      if (!claimed) throw new Error("Unsupported interface");
      claimed.claimed = true;
    },
  };
}

function installUsb(t, { knownDevices = [], selectedDevice } = {}) {
  const originalNavigator = Object.getOwnPropertyDescriptor(
    globalThis,
    "navigator"
  );
  t.after(() => {
    if (originalNavigator) {
      Object.defineProperty(globalThis, "navigator", originalNavigator);
    } else {
      delete globalThis.navigator;
    }
  });

  let requestedOptions;
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      usb: {
        getDevices: async () => knownDevices,
        requestDevice: async (options) => {
          requestedOptions = options;
          return selectedDevice;
        },
      },
    },
  });

  return {
    requestedOptions: () => requestedOptions,
  };
}

test("configuration identity claims vendor interface 0", async (t) => {
  const device = makeDevice({
    vendorId: 0x0403,
    productId: 0x68e0,
    interfaceNumber: 0,
  });
  installUsb(t, { selectedDevice: device });

  const connectedDevice = await connectToAdapter();

  assert.equal(connectedDevice, device);
  assert.equal(device.configuration.interfaces[0].claimed, true);
});

test("legacy console identity claims its vendor interface 1", async (t) => {
  const device = makeDevice({
    vendorId: 0x0738,
    productId: 0x8480,
    interfaceNumber: 1,
    outEndpointNumber: 4,
    prependHidInterface: true,
  });
  installUsb(t, { selectedDevice: device });

  const connectedDevice = await connectToAdapter();

  assert.equal(connectedDevice, device);
  assert.equal(device.configuration.interfaces[0].claimed, false);
  assert.equal(device.configuration.interfaces[1].claimed, true);
});

test("previously authorized configuration identity reconnects without chooser", async (t) => {
  const device = makeDevice({
    vendorId: 0x0403,
    productId: 0x68e0,
    interfaceNumber: 0,
    opened: true,
    configured: true,
  });
  const usb = installUsb(t, { knownDevices: [device] });

  const connectedDevice = await connectToAdapter();

  assert.equal(connectedDevice, device);
  assert.equal(usb.requestedOptions(), undefined);
});

test("known controller-only identity is skipped for a configurable legacy device", async (t) => {
  const controllerOnly = makeDevice({
    vendorId: 0x0738,
    productId: 0x8480,
    interfaceNumber: 0,
    interfaceClass: 0x03,
    outEndpointNumber: 3,
    opened: true,
    configured: true,
  });
  const configurableLegacy = makeDevice({
    vendorId: 0x0738,
    productId: 0x8480,
    interfaceNumber: 1,
    outEndpointNumber: 4,
    prependHidInterface: true,
    opened: true,
    configured: true,
  });
  const usb = installUsb(t, {
    knownDevices: [controllerOnly, configurableLegacy],
  });

  const connectedDevice = await connectToAdapter();

  assert.equal(connectedDevice, configurableLegacy);
  assert.equal(controllerOnly.configuration.interfaces[0].claimed, false);
  assert.equal(configurableLegacy.configuration.interfaces[0].claimed, false);
  assert.equal(configurableLegacy.configuration.interfaces[1].claimed, true);
  assert.equal(usb.requestedOptions(), undefined);
});

test("known lookalike with the wrong product ID is skipped", async (t) => {
  const lookalike = makeDevice({
    vendorId: 0x0738,
    productId: 0x9999,
    interfaceNumber: 1,
    opened: true,
    configured: true,
  });
  const edgeguard = makeDevice({
    vendorId: 0x0403,
    productId: 0x68e0,
    interfaceNumber: 0,
    opened: true,
    configured: true,
  });
  installUsb(t, { knownDevices: [lookalike, edgeguard] });

  const connectedDevice = await connectToAdapter();

  assert.equal(connectedDevice, edgeguard);
  assert.equal(lookalike.configuration.interfaces[0].claimed, false);
  assert.equal(edgeguard.configuration.interfaces[0].claimed, true);
});

test("known vendor-class identity without an OUT endpoint is skipped", async (t) => {
  const noVendorOut = makeDevice({
    vendorId: 0x0738,
    productId: 0x8480,
    interfaceNumber: 1,
    outEndpointNumber: 6,
    endpointDirection: "in",
    prependHidInterface: true,
    opened: true,
    configured: true,
  });
  const edgeguard = makeDevice({
    vendorId: 0x0403,
    productId: 0x68e0,
    interfaceNumber: 0,
    opened: true,
    configured: true,
  });
  installUsb(t, { knownDevices: [noVendorOut, edgeguard] });

  const connectedDevice = await connectToAdapter();

  assert.equal(connectedDevice, edgeguard);
  assert.equal(noVendorOut.configuration.interfaces[0].claimed, false);
  assert.equal(noVendorOut.configuration.interfaces[1].claimed, false);
  assert.equal(edgeguard.configuration.interfaces[0].claimed, true);
});

test("already-open unconfigured device selects its vendor configuration", async (t) => {
  const device = makeDevice({
    vendorId: 0x0403,
    productId: 0x68e0,
    interfaceNumber: 0,
    opened: true,
  });
  installUsb(t, { knownDevices: [device] });

  const connectedDevice = await connectToAdapter();

  assert.equal(connectedDevice, device);
  assert.equal(device.configuration.configurationValue, 1);
  assert.equal(device.configuration.interfaces[0].claimed, true);
});

test("device selects the configuration value advertised by its descriptor", async (t) => {
  const device = makeDevice({
    vendorId: 0x0403,
    productId: 0x68e0,
    interfaceNumber: 0,
    configurationValue: 7,
  });
  installUsb(t, { selectedDevice: device });

  const connectedDevice = await connectToAdapter();

  assert.equal(connectedDevice, device);
  assert.equal(device.configuration.configurationValue, 7);
  assert.equal(device.configuration.interfaces[0].claimed, true);
});

test("the chooser only offers configurable Edgeguards", async (t) => {
  const selectedDevice = makeDevice({
    vendorId: 0x0403,
    productId: 0x68e0,
    interfaceNumber: 0,
    opened: true,
    configured: true,
  });
  const usb = installUsb(t, { selectedDevice });

  const connectedDevice = await connectToAdapter();

  assert.equal(connectedDevice, selectedDevice);
  assert.deepEqual(usb.requestedOptions(), {
    filters: [
      { vendorId: 0x0403, productId: 0x68e0 },
      { vendorId: 0x0f0d, productId: 0x00c1, classCode: 0xff },
      { vendorId: 0x0738, productId: 0x8480, classCode: 0xff },
    ],
  });
});
