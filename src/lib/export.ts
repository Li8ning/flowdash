import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Log {
  id: number;
  product_name: string;
  color: string;
  model: string;
  produced: number;
  created_at: string;
  username?: string;
}


export const exportToPdf = (logs: Log[], allLogs: boolean) => {
  const doc = new jsPDF();
  const tableColumn = allLogs 
    ? ["Product Name", "Color", "Model", "User", "Quantity Change", "Date"]
    : ["Product Name", "Color", "Model", "Quantity Change", "Date"];
  const tableRows: any[][] = [];

  logs.forEach(log => {
    const logData = allLogs
      ? [
          log.product_name,
          log.color,
          log.model,
          log.username,
          log.produced,
          new Date(log.created_at).toLocaleString(),
        ]
      : [
          log.product_name,
          log.color,
          log.model,
          log.produced,
          new Date(log.created_at).toLocaleString(),
        ];
    tableRows.push(logData);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 20,
  });
  doc.text("Inventory Logs", 14, 15);
  doc.save("inventory_logs.pdf");
};

export const exportToExcel = (logs: Log[], allLogs: boolean) => {
  const worksheetData = logs.map(log => {
    if (allLogs) {
      return {
        "Product Name": log.product_name,
        "Color": log.color,
        "Model": log.model,
        "User": log.username,
        "Quantity Change": log.produced,
        "Date": new Date(log.created_at).toLocaleString(),
      };
    }
    return {
      "Product Name": log.product_name,
      "Color": log.color,
      "Model": log.model,
      "Quantity Change": log.produced,
      "Date": new Date(log.created_at).toLocaleString(),
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Logs");
  XLSX.writeFile(workbook, "inventory_logs.xlsx");
};