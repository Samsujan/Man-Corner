import { RESTAURANT_INFO } from '../config/restaurant';
import { getBillTokenNumber } from './printReceipt';

// Web Bluetooth ESC/POS printing for Bluetooth thermal printers such as the
// POSIFLOW KP307. This is an ADDITIONAL print path alongside printReceipt.js
// (which uses the browser's normal print dialog / window.print()). Use this
// when the bill needs to go straight to a paired Bluetooth thermal printer
// without a system print dialog — mainly useful on Android Chrome/Edge,
// since Web Bluetooth is not available on iOS Safari.

// Different printer boards expose different GATT service/characteristic
// UUIDs for their "serial" print channel. Rather than guessing a single
// pair (which can silently fail to connect), we ask for *any* nearby
// Bluetooth device but list several known candidate services so the
// browser can see past ones the device may not advertise up front, then
// discover whichever writable characteristic the device actually exposes.
const CANDIDATE_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // common printer-module profile (KP307 and similar OEM boards)
  '0000ffe0-0000-1000-8000-00805f9b34fb', // generic HM-10 style BLE serial profile used by many thermal printers
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC/telit style serial profile, also seen on cheap printer modules
];

// BLE writes are unreliable above ~20 bytes per packet on most default MTU
// negotiations, so the receipt bytes are always sent in small chunks with a
// short pause in between rather than as one big write.
const CHUNK_SIZE = 20;
const CHUNK_DELAY_MS = 20;
const LINE_WIDTH = 32; // characters per line on a standard 58mm thermal printer

let cachedPrinter = null; // { device, characteristic }

const ESC = 0x1b;
const GS = 0x1d;

const encoder = new TextEncoder();
const textBytes = (str) => Array.from(encoder.encode(str));

const cmds = {
  init: [ESC, 0x40],
  alignLeft: [ESC, 0x61, 0x00],
  alignCenter: [ESC, 0x61, 0x01],
  boldOn: [ESC, 0x45, 0x01],
  boldOff: [ESC, 0x45, 0x00],
  cut: [GS, 0x56, 0x42, 0x00],
};

const padRow = (left, right, width = LINE_WIDTH) => {
  const l = String(left);
  const r = String(right);
  const gap = Math.max(1, width - l.length - r.length);
  return `${l}${' '.repeat(gap)}${r}\n`;
};

const divider = (width = LINE_WIDTH) => `${'-'.repeat(width)}\n`;

const money = (value) => Number(value || 0).toFixed(2);

export const isBluetoothPrintSupported = () =>
  typeof navigator !== 'undefined' && !!navigator.bluetooth;

const findWritableCharacteristic = async (server) => {
  const services = await server.getPrimaryServices();
  for (const service of services) {
    // eslint-disable-next-line no-await-in-loop
    const characteristics = await service.getCharacteristics();
    const writable = characteristics.find(
      (c) => c.properties.write || c.properties.writeWithoutResponse
    );
    if (writable) return writable;
  }
  return null;
};

// Opens the browser's Bluetooth device picker (must be called directly from
// a user gesture, e.g. a button click) and remembers the connection so
// repeat prints don't require re-pairing every time.
export const connectBluetoothPrinter = async ({ forceNew = false } = {}) => {
  if (!isBluetoothPrintSupported()) {
    throw new Error(
      'Web Bluetooth is not available on this device/browser. Use Chrome or Edge on Android.'
    );
  }
  if (!forceNew && cachedPrinter && cachedPrinter.device.gatt.connected) {
    return cachedPrinter;
  }
  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: CANDIDATE_SERVICES,
  });
  const server = await device.gatt.connect();
  const characteristic = await findWritableCharacteristic(server);
  if (!characteristic) {
    throw new Error(
      'Connected, but no printable (write) service was found on this device. It may not be an ESC/POS printer.'
    );
  }
  cachedPrinter = { device, characteristic };
  device.addEventListener('gattserverdisconnected', () => {
    cachedPrinter = null;
  });
  return cachedPrinter;
};

const writeBytes = async (characteristic, bytes) => {
  const useWithoutResponse = !!characteristic.properties.writeWithoutResponse;
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = Uint8Array.from(bytes.slice(i, i + CHUNK_SIZE));
    // eslint-disable-next-line no-await-in-loop
    await (useWithoutResponse
      ? characteristic.writeValueWithoutResponse(chunk)
      : characteristic.writeValue(chunk));
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, CHUNK_DELAY_MS));
  }
};

const startPrinterBuffer = () => {
  let out = [];
  out.push(...cmds.init);
  out.push(...cmds.alignLeft);
  return out;
};

const buildFullReceiptBytes = (bill) => {
  const items = bill.items || [];
  const createdAt = bill.createdAt ? new Date(bill.createdAt) : new Date();
  const dateStr = createdAt.toLocaleDateString('en-IN');
  const timeStr = createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const cashierName = bill.createdBy?.name || '-';
  const halfGST = Number(bill.totalGST || 0) / 2;
  const tokenNumber = getBillTokenNumber(bill);

  const out = startPrinterBuffer();
  out.push(...cmds.alignCenter);
  out.push(...cmds.boldOn);
  out.push(...textBytes(`${RESTAURANT_INFO.name}\n`));
  out.push(...cmds.boldOff);
  out.push(...textBytes(`${RESTAURANT_INFO.tagline}\n`));
  if (RESTAURANT_INFO.address) out.push(...textBytes(`${RESTAURANT_INFO.address}\n`));
  if (RESTAURANT_INFO.phone) out.push(...textBytes(`Ph: ${RESTAURANT_INFO.phone}\n`));
  out.push(...textBytes(`GSTIN: ${RESTAURANT_INFO.gstin || '(to be added)'}\n`));
  out.push(...cmds.alignLeft);
  out.push(...textBytes(divider()));
  out.push(...textBytes(`Bill No: ${bill.billNumber}\n`));
  out.push(...textBytes(`Token No: ${tokenNumber}\n`));
  out.push(...textBytes(`Date: ${dateStr}  Time: ${timeStr}\n`));
  out.push(...textBytes(`Served by: ${cashierName}\n`));
  out.push(...textBytes(`Payment: ${bill.paymentMethod || '-'}\n`));
  out.push(...textBytes(divider()));

  items.forEach((item) => {
    const name = item.menuItem?.name || item.name || 'Item';
    const qty = Number(item.quantity || 0);
    const rate = Number(item.price || 0);
    const gstAmount = Number(item.gstAmount || 0);
    const total = Number(item.totalAmount || rate * qty + gstAmount);
    out.push(...textBytes(`${name}\n`));
    out.push(...textBytes(padRow(`  ${qty} x Rs.${money(rate)}`, `Rs.${money(total)}`)));
    if (gstAmount > 0) {
      out.push(...textBytes(padRow('  GST', `Rs.${money(gstAmount)}`)));
    }
  });

  out.push(...textBytes(divider()));
  out.push(...textBytes(padRow('Subtotal', `Rs.${money(bill.subtotal)}`)));
  out.push(...textBytes(padRow('CGST', `Rs.${money(halfGST)}`)));
  out.push(...textBytes(padRow('SGST', `Rs.${money(halfGST)}`)));
  out.push(...cmds.boldOn);
  out.push(...textBytes(padRow('GRAND TOTAL', `Rs.${money(bill.total)}`)));
  out.push(...cmds.boldOff);
  out.push(...textBytes(divider()));
  out.push(...cmds.alignCenter);
  out.push(...textBytes('Thank you! Visit again\n'));
  out.push(...textBytes('\n\n\n'));
  out.push(...cmds.cut);

  return out;
};

const buildKitchenReceiptBytes = (bill) => {
  const items = bill.items || [];
  const createdAt = bill.createdAt ? new Date(bill.createdAt) : new Date();
  const dateStr = createdAt.toLocaleDateString('en-IN');
  const timeStr = createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const tokenNumber = getBillTokenNumber(bill);

  const out = startPrinterBuffer();
  out.push(...cmds.alignCenter);
  out.push(...cmds.boldOn);
  out.push(...textBytes(`${RESTAURANT_INFO.name}\n`));
  out.push(...cmds.boldOff);
  out.push(...textBytes(`${RESTAURANT_INFO.tagline}\n`));
  out.push(...textBytes(divider()));
  out.push(...cmds.boldOn);
  out.push(...textBytes(`TOKEN ${tokenNumber}\n`));
  out.push(...cmds.boldOff);
  out.push(...textBytes(`Date: ${dateStr} ${timeStr}\n`));
  out.push(...cmds.alignLeft);
  out.push(...textBytes(divider()));
  items.forEach((item) => {
    const name = item.menuItem?.name || item.name || 'Item';
    const qty = Number(item.quantity || 0);
    out.push(...textBytes(padRow(name, `x${qty}`)));
  });
  out.push(...textBytes(divider()));
  out.push(...cmds.alignCenter);
  out.push(...textBytes('Kitchen Copy\n'));
  out.push(...textBytes('\n\n\n'));
  out.push(...cmds.cut);
  return out;
};

// Connects (or reuses the last connected printer) and sends the bill to it.
// Must be invoked directly from a user click handler — Web Bluetooth's
// device picker will not open otherwise.
export const printFullBillToBluetoothPrinter = async (bill) => {
  if (!bill) return;
  const { characteristic } = await connectBluetoothPrinter();
  const bytes = buildFullReceiptBytes(bill);
  await writeBytes(characteristic, bytes);
};

export const printKitchenTokenToBluetoothPrinter = async (bill) => {
  if (!bill) return;
  const { characteristic } = await connectBluetoothPrinter();
  const bytes = buildKitchenReceiptBytes(bill);
  await writeBytes(characteristic, bytes);
};

export const printBillToBluetoothPrinter = async (bill) => {
  if (!bill) return;
  const { characteristic } = await connectBluetoothPrinter();
  const fullBytes = buildFullReceiptBytes(bill);
  await writeBytes(characteristic, fullBytes);
  await new Promise((resolve) => setTimeout(resolve, 300));
  const kitchenBytes = buildKitchenReceiptBytes(bill);
  await writeBytes(characteristic, kitchenBytes);
};

export const disconnectBluetoothPrinter = () => {
  if (cachedPrinter?.device?.gatt?.connected) {
    cachedPrinter.device.gatt.disconnect();
  }
  cachedPrinter = null;
};
