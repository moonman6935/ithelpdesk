import * as XLSX from 'xlsx';

const TEMPLATE_URL = `${process.env.PUBLIC_URL}/templates/Zimmet-Formu.xlsx`;
const NAME_CELL = 'B4';
const MATERIAL_START_ROW = 18;
const MATERIAL_MAX_ROWS = 8;

function setCell(sheet, address, value) {
  const text = String(value ?? '').trim();
  if (!text) {
    delete sheet[address];
    return;
  }
  sheet[address] = { t: 's', v: text };
}

function fillZimmetSheet(sheet, { personnelName, items }) {
  setCell(sheet, NAME_CELL, personnelName);

  for (let i = 0; i < MATERIAL_MAX_ROWS; i += 1) {
    const row = MATERIAL_START_ROW + i;
    const item = items[i];
    setCell(sheet, `A${row}`, item?.itemName || item?.item_name || '');
    setCell(sheet, `B${row}`, item?.serialNo || item?.serial_number || '');
  }
}

function buildPrintHtml(tableHtml, overflowNote) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>Zimmet Formu</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 12px;
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
      background: #fff;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 10.5pt;
    }
    td {
      border: 1px solid #222;
      padding: 5px 7px;
      vertical-align: middle;
      word-wrap: break-word;
    }
    tr:first-child td {
      font-weight: 700;
      font-size: 14pt;
      text-align: center;
      padding: 10px;
    }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  ${overflowNote}
  ${tableHtml}
</body>
</html>`;
}

function printHtmlInFrame(html) {
  const existing = document.getElementById('zimmet-print-frame');
  if (existing) existing.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'zimmet-print-frame';
  iframe.setAttribute('title', 'Zimmet Formu');
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
    opacity: '0',
    pointerEvents: 'none',
  });
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDoc = frameWindow.document;
  frameDoc.open();
  frameDoc.write(html);
  frameDoc.close();

  const runPrint = () => {
    frameWindow.focus();
    frameWindow.print();
    window.setTimeout(() => iframe.remove(), 1500);
  };

  if (frameDoc.readyState === 'complete') {
    window.setTimeout(runPrint, 150);
  } else {
    iframe.onload = () => window.setTimeout(runPrint, 150);
  }
}

function extractTableHtml(sheet) {
  const fullHtml = XLSX.utils.sheet_to_html(sheet);
  const match = fullHtml.match(/<table[\s\S]*<\/table>/i);
  return match ? match[0] : fullHtml;
}

export async function printZimmetForm({ personnelName, items = [] }) {
  const name = String(personnelName ?? '').trim();
  const filledItems = items.filter(
    (item) => String(item?.itemName || item?.item_name || '').trim()
  );

  if (!name) {
    throw new Error('MISSING_NAME');
  }
  if (!filledItems.length) {
    throw new Error('MISSING_ITEMS');
  }

  const response = await fetch(TEMPLATE_URL);
  if (!response.ok) {
    throw new Error('TEMPLATE_NOT_FOUND');
  }

  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellStyles: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  fillZimmetSheet(sheet, { personnelName: name, items: filledItems });

  const tableHtml = extractTableHtml(sheet);

  const overflowNote =
    filledItems.length > MATERIAL_MAX_ROWS
      ? `<p style="color:#b45309;font-size:12px;margin:0 0 12px;">${filledItems.length - MATERIAL_MAX_ROWS} kalem form satır limiti nedeniyle yazdırılmadı.</p>`
      : '';

  printHtmlInFrame(buildPrintHtml(tableHtml, overflowNote));
}

export async function downloadFilledZimmetForm({ personnelName, items = [] }) {
  const response = await fetch(TEMPLATE_URL);
  if (!response.ok) throw new Error('TEMPLATE_NOT_FOUND');

  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  fillZimmetSheet(sheet, { personnelName, items });

  const out = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = String(personnelName || 'zimmet').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
  link.href = url;
  link.download = `Zimmet-Formu_${safeName || 'personel'}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
