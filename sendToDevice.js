function padEnd(array, minLength, fillValue = undefined) {
  return Object.assign(new Array(minLength).fill(fillValue), array);
}

export const connectAndSendDataToAdapter = async (dataToFlash) => {
  const maxConfigSize = 8192;
  const decoder = new TextDecoder();
  let device;
  try {
    device = await navigator.usb.requestDevice({
      filters: [{ vendorId: 0x0f0d }],
    });

    await device.open(); // Begin a session.
    await device.selectConfiguration(1); // Select configuration #1 for the device (1-indexed, so first config is 1).
    await device.claimInterface(1); // Request exclusive control over second interface (0-indexed, so 2nd interface is 1).
  } catch (error) {
    console.error("Error connecting to device.", error);
    return;
  }

  const config = new Uint8Array(padEnd(dataToFlash, maxConfigSize, 0));
  console.log(config);
  const prepareForData = await device.controlTransferOut({
    requestType: "vendor",
    recipient: "endpoint",
    request: 0x09,
    value: 0x01,
    index: 0x04,
  }); // We just told the adapter to expect the config to come in.

  console.log("Done telling the adapter to expect the config.", prepareForData);

  const configSendRes = await device.transferOut(4, config.buffer);

  console.log("Sent config!", configSendRes);
  console.log("Received: " + decoder.decode(configSendRes.data));
};
