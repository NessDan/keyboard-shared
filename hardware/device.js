function padEnd(array, minLength, fillValue = 0xff) {
  return Object.assign(new Array(minLength).fill(fillValue), array);
}

const kggVendorRequestId = {
  receiveProfile: 0x09,
  sendProfile: 0xfe,
  sendVersion: 0xff,
};

// keyboard.gg vendor Values:
const kggVendorSendVersionValues = {
  sendVersionString: 0x00,
  sendVersionMajor: 0x01,
  sendVersionMinor: 0x02,
  sendVersionPatch: 0x03,
};

const kggVendorSendProfileValues = {
  sendProfileMaxCount: 0x00,
  sendProfileMaxSize: 0x01,
};

export const connectToAdapter = async () => {
  try {
    const devices = await navigator.usb.getDevices();
    let device = devices.find((d) => d.vendorId === 0x0f0d);

    if (!device) {
      device = await navigator.usb.requestDevice({
        filters: [{ vendorId: 0x0f0d }],
      });
    }

    if (!device.opened) {
      await device.open(); // Begin a session.
      await device.selectConfiguration(1); // Select configuration #1 for the device (1-indexed, so first config is 1).
      await device.claimInterface(1); // Request exclusive control over second interface (0-indexed, so 2nd interface is 1).
    }

    return device;
  } catch (error) {
    console.error("Error connecting to device.", error);
  }
};

export const getMajorVersion = async (device) => {
  try {
    let majorVersion = await device.controlTransferIn(
      {
        requestType: "vendor",
        recipient: "device",
        index: 0x00,
        request: kggVendorRequestId.sendVersion,
        value: kggVendorSendVersionValues.sendVersionMajor,
      },
      32
    );

    majorVersion = majorVersion.data.getUint8(0);

    console.log("Major version", majorVersion);

    return majorVersion;
  } catch (error) {
    console.error(
      "Error getting major version. Must be older firmware?",
      error
    );
    return 0;
  }
};

export const getMaxProfileSize = async (device) => {
  // The below will fail if the adapter firmware is not up to date.
  // In this case, we'll default to the old size of 8192
  try {
    let maxProfileSize = await device.controlTransferIn(
      {
        requestType: "vendor",
        recipient: "device",
        index: 0x00,
        request: kggVendorRequestId.sendProfile,
        value: kggVendorSendProfileValues.sendProfileMaxSize,
      },
      32
    );

    maxProfileSize = maxProfileSize.data.getUint16(0, true);

    console.log("Max profile size", maxProfileSize);

    return maxProfileSize;
  } catch (error) {
    console.error(
      "Error getting max profile size. Must be older firmware?",
      error
    );
    return 8192;
  }
};

export const getMaxProfileCount = async (device) => {
  // The below will fail if the adapter firmware is not up to date.
  // In this case, we'll default to the old size of 1
  try {
    let maxProfileCount = await device.controlTransferIn(
      {
        requestType: "vendor",
        recipient: "device",
        index: 0x00,
        request: kggVendorRequestId.sendProfile,
        value: kggVendorSendProfileValues.sendProfileMaxCount,
      },
      32
    );

    maxProfileCount = maxProfileCount.data.getUint8(0);

    return maxProfileCount;
  } catch (error) {
    console.error(
      "Error getting max profile count. Must be older firmware?",
      error
    );
    return 1;
  }
};

export const sendDataToAdapter = async (device, dataToFlash, profileIdx) => {
  const maxProfileSize = await getMaxProfileSize(device);
  const decoder = new TextDecoder();
  const majorVersion = await getMajorVersion(device);
  const profileIdxToSend = majorVersion === 0 ? 0x01 : profileIdx; // Fallback for old firmware

  const config = new Uint8Array(padEnd(dataToFlash, maxProfileSize));
  console.log(config);
  console.log(
    "Profile Index (and index to send):",
    profileIdx,
    profileIdxToSend
  );

  const prepareForData = await device.controlTransferOut({
    requestType: "vendor",
    recipient: "endpoint",
    index: 0x04,
    request: kggVendorRequestId.receiveProfile,
    value: profileIdxToSend,
  }); // We just told the adapter to expect the config to come in.

  console.log("Done telling the adapter to expect the config.", prepareForData);

  const configSendRes = await device.transferOut(4, config.buffer);

  console.log("Sent config!", configSendRes);
  console.log("Received: " + decoder.decode(configSendRes.data));
};

export const connectAndSendDataToAdapter = async (dataToFlash, profileIdx) => {
  try {
    const device = await connectToAdapter();

    await sendDataToAdapter(device, dataToFlash, profileIdx);
  } catch (error) {
    console.error("Error in connectAndSendDataToAdapter", error);
  }
};
