import { RESTAURANT_INFO } from '../config/restaurant';
import {
  RECEIPT_CONTENT_WIDTH_MM,
  RECEIPT_PAGE_MARGIN_MM,
  RECEIPT_PAPER_WIDTH_MM,
} from '../config/printLayout';

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));

const formatCurrency = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;
const formatDate = (value) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

export const getBillTokenNumber = (bill) => {
  if (bill?.tokenNumber) return String(bill.tokenNumber);
  const digits = String(bill?.billNumber || '').replace(/\D/g, '');
  if (!digits) return '0000';
  return digits.slice(-4).padStart(4, '0');
};

const printHtmlDocument = (html) => {
  const printWindow = window.open('', '_blank', 'width=420,height=700');
  if (!printWindow) {
    alert('Please allow pop-ups to print the bill.');
    return false;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => {
    printWindow.print();
  };
  return true;
};

// Builds a printable Indian-restaurant-style GST bill (item-wise qty, rate,
// GST amount and total, plus a CGST/SGST split) and opens the browser print
// dialog in a separate window so it doesn't disturb the app's own styling.
export const printFullBillReceipt = (bill) => {
  if (!bill) return;

  const items = bill.items || [];
  const createdAt = formatDate(bill.createdAt);
  const dateStr = createdAt.toLocaleDateString('en-IN');
  const timeStr = createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const cashierName = bill.createdBy?.name || '—';
  const halfGST = Number(bill.totalGST || 0) / 2;
  const tokenNumber = getBillTokenNumber(bill);

  const rows = items.map((item) => {
    const name = escapeHtml(item.menuItem?.name || item.name || 'Item');
    const qty = Number(item.quantity || 0);
    const rate = Number(item.price || 0);
    const gstRate = Number(item.gstRate || 0);
    const gstAmount = Number(item.gstAmount || 0);
    const total = Number(item.totalAmount || rate * qty + gstAmount);
    return `
      <tr>
        <td>${name}</td>
        <td class="c">${qty}</td>
        <td class="r">${rate.toFixed(2)}</td>
        <td class="r">${gstAmount.toFixed(2)} <span class="muted">(${gstRate}%)</span></td>
        <td class="r">${total.toFixed(2)}</td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Customer Bill ${escapeHtml(bill.billNumber)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    width: ${RECEIPT_CONTENT_WIDTH_MM}mm;
    margin: 0 auto;
    padding: 0;
    color: #000;
  }
  .center { text-align: center; }
  .name { font-size: 21px; font-weight: bold; letter-spacing: 0.5px; }
  .tagline { font-size: 12px; font-style: italic; margin-top: 1px; }
  .meta { font-size: 11px; margin: 2px 0; }
  .muted { color: #444; font-size: 9px; }
  hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; table-layout: fixed; }
  th, td { text-align: left; padding: 3px 1px; vertical-align: top; overflow-wrap: anywhere; }
  th:first-child, td:first-child { width: 32%; }
  th:nth-child(2), td:nth-child(2) { width: 8%; }
  th:nth-child(3), td:nth-child(3) { width: 17%; }
  th:nth-child(4), td:nth-child(4) { width: 22%; }
  th:nth-child(5), td:nth-child(5) { width: 21%; }
  th.c, td.c { text-align: center; }
  th.r, td.r { text-align: right; }
  thead tr { border-bottom: 1px solid #000; }
  .totals div { display: flex; justify-content: space-between; gap: 8px; font-size: 11px; margin: 2px 0; }
  .grand { font-size: 14px; font-weight: bold; border-top: 1px dashed #000; padding-top: 5px; margin-top: 5px; }
  .footer { text-align: center; font-size: 11px; margin-top: 9px; }
  @media print {
    @page { size: ${RECEIPT_PAPER_WIDTH_MM}mm auto; margin: ${RECEIPT_PAGE_MARGIN_MM}mm; }
    body { width: ${RECEIPT_CONTENT_WIDTH_MM}mm; }
  }
</style>
</head>
<body>
  <div class="center">
    <div class="name">${escapeHtml(RESTAURANT_INFO.name)}</div>
    <div class="tagline">${escapeHtml(RESTAURANT_INFO.tagline)}</div>
    ${RESTAURANT_INFO.address ? `<div class="meta">${escapeHtml(RESTAURANT_INFO.address)}</div>` : ''}
    ${RESTAURANT_INFO.phone ? `<div class="meta">Ph: ${escapeHtml(RESTAURANT_INFO.phone)}</div>` : ''}
    <div class="meta">GSTIN: ${RESTAURANT_INFO.gstin ? escapeHtml(RESTAURANT_INFO.gstin) : '(to be added)'}</div>
  </div>
  <hr />
  <div class="meta">Bill No: <strong>${escapeHtml(bill.billNumber)}</strong></div>
  <div class="meta">Token No: <strong>${escapeHtml(tokenNumber)}</strong></div>
  <div class="meta">Date: ${dateStr} &nbsp; Time: ${timeStr}</div>
  <div class="meta">Served by: ${escapeHtml(cashierName)}</div>
  <div class="meta">Payment mode: ${escapeHtml(bill.paymentMethod || '—')}</div>
  <hr />
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="c">Qty</th>
        <th class="r">Rate</th>
        <th class="r">GST Amt</th>
        <th class="r">Total</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <hr />
  <div class="totals">
    <div><span>Subtotal</span><span>${formatCurrency(bill.subtotal)}</span></div>
    <div><span>CGST</span><span>${formatCurrency(halfGST)}</span></div>
    <div><span>SGST</span><span>${formatCurrency(halfGST)}</span></div>
    <div class="grand"><span>Grand Total</span><span>${formatCurrency(bill.total)}</span></div>
  </div>
  <div class="footer">Thank you! Visit again 🙏</div>
</body>
</html>`;
  printHtmlDocument(html);
};

export const printKitchenTokenReceipt = (bill) => {
  if (!bill) return;

  const items = bill.items || [];
  const createdAt = formatDate(bill.createdAt);
  const dateStr = createdAt.toLocaleDateString('en-IN');
  const timeStr = createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const tokenNumber = getBillTokenNumber(bill);

  const rows = items.map((item) => {
    const name = escapeHtml(item.menuItem?.name || item.name || 'Item');
    const qty = Number(item.quantity || 0);
    return `
      <tr>
        <td>${name}</td>
        <td class="c">${qty}</td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Kitchen Token ${escapeHtml(tokenNumber)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    width: ${RECEIPT_CONTENT_WIDTH_MM}mm;
    margin: 0 auto;
    padding: 0;
    color: #000;
  }
  .center { text-align: center; }
  .name {   font-size: 20px; font-weight: bold; letter-spacing: 0.4px; }
  .tagline { font-size: 11px; font-style: italic; margin-top: 1px; }
  .token {
    margin-top: 8px;
    font-size: 24px;
    font-weight: bold;
    letter-spacing: 1px;
  }
  .meta { font-size: 11px; margin: 3px 0; }
  hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
  th, td { text-align: left; padding: 4px 2px; vertical-align: top; overflow-wrap: anywhere; }
  th.c, td.c { text-align: center; width: 54px; }
  thead tr { border-bottom: 1px solid #000; }
  .footer { text-align: center; font-size: 11px; margin-top: 8px; }
  @media print {
    @page { size: ${RECEIPT_PAPER_WIDTH_MM}mm auto; margin: ${RECEIPT_PAGE_MARGIN_MM}mm; }
    body { width: ${RECEIPT_CONTENT_WIDTH_MM}mm; }
  }
</style>
</head>
<body>
  <div class="center">
    <div class="name">${escapeHtml(RESTAURANT_INFO.name)}</div>
    <div class="tagline">${escapeHtml(RESTAURANT_INFO.tagline)}</div>
    <div class="token">TOKEN ${escapeHtml(tokenNumber)}</div>
    <div class="meta">Date: ${dateStr} &nbsp; Time: ${timeStr}</div>
  </div>
  <hr />
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="c">Qty</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <hr />
  <div class="footer">Kitchen Copy</div>
</body>
</html>`;

  printHtmlDocument(html);
};

export const printBillReceipts = (bill) => {
  printFullBillReceipt(bill);
  setTimeout(() => {
    printKitchenTokenReceipt(bill);
  }, 250);
};

// Backward-compatible alias.
export const printBillReceipt = printBillReceipts;
