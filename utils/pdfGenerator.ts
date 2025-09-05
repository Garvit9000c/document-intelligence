import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExtractedData {
  [key: string]: any;
}

export function generatePDFFromExtractedData(data: ExtractedData, documentType: string = 'Document'): void {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(`Extracted ${documentType} Data`, 20, 30);
  
  // Add timestamp
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 40);
  
  let currentY = 60;
  
  // Process the data and create tables
  const processedData = processDataForTable(data);
  
  if (processedData.simpleFields.length > 0) {
    // Simple fields table
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Document Information', 20, currentY);
    currentY += 10;
    
    autoTable(doc, {
      startY: currentY,
      head: [['Field', 'Value']],
      body: processedData.simpleFields,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 20;
  }
  
  // Process array/complex fields
  if (processedData.complexFields.length > 0) {
    processedData.complexFields.forEach((complexField, index) => {
      if (currentY > 250) {
        doc.addPage();
        currentY = 30;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text(complexField.title, 20, currentY);
      currentY += 10;
      
      autoTable(doc, {
        startY: currentY,
        head: [complexField.headers],
        body: complexField.rows,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 4,
        },
        headStyles: {
          fillColor: [34, 197, 94],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 15;
    });
  }
  
  // Save the PDF
  const fileName = `extracted-${documentType.toLowerCase()}-${Date.now()}.pdf`;
  doc.save(fileName);
}

function processDataForTable(data: ExtractedData): {
  simpleFields: string[][];
  complexFields: Array<{
    title: string;
    headers: string[];
    rows: string[][];
  }>;
} {
  const simpleFields: string[][] = [];
  const complexFields: Array<{
    title: string;
    headers: string[];
    rows: string[][];
  }> = [];
  
  // Process data recursively to handle any depth of nesting
  processNestedData(data, '', simpleFields, complexFields);
  
  return { simpleFields, complexFields };
}

function processNestedData(
  data: any, 
  prefix: string, 
  simpleFields: string[][], 
  complexFields: Array<{
    title: string;
    headers: string[];
    rows: string[][];
  }>
) {
  if (Array.isArray(data)) {
    // Handle arrays
    if (data.length > 0 && typeof data[0] === 'object') {
      // Array of objects - create a table
      const headers = getAllKeys(data[0]);
      const rows = data.map(item => 
        headers.map(header => 
          getNestedValue(item, header) !== undefined ? String(getNestedValue(item, header)) : ''
        )
      );
      
      complexFields.push({
        title: formatFieldName(prefix) || 'Array Data',
        headers: headers.map(formatFieldName),
        rows
      });
    } else {
      // Simple array
      simpleFields.push([
        formatFieldName(prefix) || 'Array',
        data.join(', ')
      ]);
    }
  } else if (typeof data === 'object' && data !== null) {
    // Handle nested objects recursively
    Object.entries(data).forEach(([key, value]) => {
      const newPrefix = prefix ? `${prefix}.${key}` : key;
      
      if (Array.isArray(value)) {
        // Array at any level
        processNestedData(value, newPrefix, simpleFields, complexFields);
      } else if (typeof value === 'object' && value !== null) {
        // Nested object - recurse deeper
        processNestedData(value, newPrefix, simpleFields, complexFields);
      } else {
        // Simple value
        simpleFields.push([
          formatFieldName(newPrefix),
          String(value)
        ]);
      }
    });
  } else {
    // Simple value
    simpleFields.push([
      formatFieldName(prefix),
      String(data)
    ]);
  }
}

function getAllKeys(obj: any, prefix: string = ''): string[] {
  const keys: string[] = [];
  
  Object.entries(obj).forEach(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Nested object - get all nested keys
      keys.push(...getAllKeys(value, fullKey));
    } else {
      // Simple value or array
      keys.push(fullKey);
    }
  });
  
  return keys;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}
