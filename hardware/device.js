function padEnd(array, minLength, fillValue = undefined) {
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
    const device = await navigator.usb.requestDevice({
      filters: [{ vendorId: 0x0f0d }],
    });

    await device.open(); // Begin a session.
    await device.selectConfiguration(1); // Select configuration #1 for the device (1-indexed, so first config is 1).
    await device.claimInterface(1); // Request exclusive control over second interface (0-indexed, so 2nd interface is 1).

    return device;
  } catch (error) {
    console.error("Error connecting to device.", error);
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

export const sendDataToAdapter = async (device, dataToFlash, profileNumber) => {
  const maxProfileSize = await getMaxProfileSize(device);
  const decoder = new TextDecoder();

  const config = new Uint8Array(padEnd(dataToFlash, maxProfileSize, 0));
  console.log(config);
  console.log(profileNumber);

  const prepareForData = await device.controlTransferOut({
    requestType: "vendor",
    recipient: "endpoint",
    index: 0x04,
    request: kggVendorRequestId.receiveProfile,
    value: profileNumber || 0x01,
  }); // We just told the adapter to expect the config to come in.

  console.log("Done telling the adapter to expect the config.", prepareForData);

  const configSendRes = await device.transferOut(4, config.buffer);

  console.log("Sent config!", configSendRes);
  console.log("Received: " + decoder.decode(configSendRes.data));
};

export const connectAndSendDataToAdapter = async (
  dataToFlash,
  profileNumber
) => {
  try {
    const device = await connectToAdapter();

    const maxProfileCount = await getMaxProfileCount(device);
    let profileToProgram = profileNumber;

    if (maxProfileCount === 0) {
      // TODO: maxProfileCount may return something nasty if the adapter doesn't respond correctly. Test what it actually returns.
      profileToProgram = 1;
    } else if (maxProfileCount < profileNumber) {
      console.error("Profile number is too high for this device.");
      return;
    }

    await sendDataToAdapter(device, dataToFlash, profileToProgram);
  } catch (error) {
    console.error("Error in connectAndSendDataToAdapter", error);
  }
};
