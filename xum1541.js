'use strict';

const XUM1541_INIT = 1;
const XUM1541_SHUTDOWN = 3;

const xum1541IDs = {
  vendorId: 0x16d0,
  productId: 0x0504
};

var device;

async function getStatus(cbmdevice) {
  await device.open();

  await device.selectConfiguration(1);
  const interfaceNumber = device.configuration.interfaces[0].interfaceNumber;
  await device.claimInterface(interfaceNumber);

  // XUM1541_INIT
  let result = await device.controlTransferIn({
    requestType: 'class',
    recipient: 'device',
    request: XUM1541_INIT,
    value: 0,
    index: 0
  }, 8);

  // TALK
  result = await device.transferOut(4, new Uint8Array([0x09, 0x13, 0x02, 0x00]));
  result = await device.transferOut(4, new Uint8Array([0x40 | cbmdevice, 0x6f]));
  result = await device.transferIn(3, 3);

  // READ STATUS
  result = await device.transferOut(4, new Uint8Array([0x08, 0x10, 0x26, 0x00]));
  const status = await device.transferIn(3, 38);

  // TALK
  result = await device.transferOut(4, new Uint8Array([0x09, 0x12, 0x01, 0x00]));
  result = await device.transferOut(4, new Uint8Array([0x5f]));
  result = await device.transferIn(3, 3);

  // XUM1541_SHUTDOWN
  result = await device.controlTransferOut({
    requestType: 'class',
    recipient: 'device',
    request: XUM1541_SHUTDOWN,
    value: 0,
    index: 0
  }, new Uint8Array([]));

  await device.releaseInterface(interfaceNumber);
  await device.close();

  if (status.status == 'ok') {
    return new TextDecoder('ascii').decode(status.data.buffer);
  }
}

async function xum1541status() {
  if (!device) {
    device = await navigator.usb.requestDevice({filters: [xum1541IDs]});
  }

  let status = '';

  if (device) {
    try {
      const cbmDevice = parseInt(document.getElementById('cbmdevice').value);
      if (cbmDevice >= 8 || cbmDevice <= 11) {
        status = await getStatus(cbmDevice);
      }
    } catch(err) {
      status = err.toString();
      device = null;
    }
  }

  document.getElementById('status').textContent = status;
}

