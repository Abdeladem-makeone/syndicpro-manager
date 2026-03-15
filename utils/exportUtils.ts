
/**
 * Converts an array of objects to a CSV string.
 */
export const convertToCSV = (data: any[]) => {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(obj => 
    headers.map(header => {
      const value = obj[header] === null || obj[header] === undefined ? '' : obj[header];
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
};

/**
 * Triggers a browser download for a string content.
 */
export const downloadFile = (content: string, fileName: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToCSV = (data: any[], fileName: string) => {
  const csv = convertToCSV(data);
  downloadFile(csv, `${fileName}.csv`, 'text/csv;charset=utf-8;');
};
