import assert from "node:assert/strict";
import test from "node:test";

import { connectToAdapter } from "../hardware/device.js";

test("the chooser only offers configurable Edgeguards", async (t) => {
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
  const selectedDevice = { opened: true };
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      usb: {
        getDevices: async () => [],
        requestDevice: async (options) => {
          requestedOptions = options;
          return selectedDevice;
        },
      },
    },
  });

  const connectedDevice = await connectToAdapter();

  assert.equal(connectedDevice, selectedDevice);
  assert.deepEqual(requestedOptions, {
    filters: [
      { vendorId: 0x0403, productId: 0x68e0 },
      { vendorId: 0x0f0d, productId: 0x00c1, classCode: 0xff },
      { vendorId: 0x0738, productId: 0x8480, classCode: 0xff },
    ],
  });
});
