interface Log {
  id: number;
  product_name: string;
  color: string;
  design: string;
  produced: number;
  created_at: string;
  username?: string;
}


export const exportToPdf = async (logs: Log[], allLogs: boolean) => {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  
  const doc = new jsPDF();
  const tableColumn = allLogs
    ? ["Product Name", "Color", "Design", "User", "Quantity Change", "Date"]
    : ["Product Name", "Color", "Design", "Quantity Change", "Date"];
  const tableRows: (string | number)[][] = [];

  logs.forEach(log => {
    const logData = allLogs
      ? [
          log.product_name,
          log.color,
          log.design,
          log.username || '',
          log.produced,
          new Date(log.created_at).toLocaleString(),
        ]
      : [
          log.product_name,
          log.color,
          log.design,
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

export const exportToExcel = async (logs: Log[], allLogs: boolean) => {
  const { default: ExcelJS } = await import('exceljs');
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Inventory Logs');

  // Define columns
  worksheet.columns = allLogs
    ? [
        { header: 'Product Name', key: 'product_name', width: 30 },
        { header: 'Color', key: 'color', width: 15 },
        { header: 'Design', key: 'design', width: 15 },
        { header: 'User', key: 'username', width: 20 },
        { header: 'Quantity Change', key: 'produced', width: 15 },
        { header: 'Date', key: 'created_at', width: 25 },
      ]
    : [
        { header: 'Product Name', key: 'product_name', width: 30 },
        { header: 'Color', key: 'color', width: 15 },
        { header: 'Design', key: 'design', width: 15 },
        { header: 'Quantity Change', key: 'produced', width: 15 },
        { header: 'Date', key: 'created_at', width: 25 },
      ];

  // Add data rows
  const data = logs.map(log => ({
    ...log,
    created_at: new Date(log.created_at).toLocaleString(),
  }));
  worksheet.addRows(data);

  // Style header
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });

  // Write to buffer and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'inventory_logs.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};