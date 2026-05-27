/**
 * CSV 내보내기 유틸리티
 */

/**
 * 배열을 CSV 문자열로 변환
 * @param {Array<object>} data - 데이터 배열
 * @param {Array<string>} headers - 헤더 배열 (optional)
 * @returns {string} - CSV 문자열
 */
export const arrayToCSV = (data, headers = null) => {
  if (!data || data.length === 0) {
    return '';
  }

  // 헤더 결정
  const csvHeaders = headers || Object.keys(data[0]);
  const headerRow = csvHeaders.map(escapeCSV).join(',');

  // 데이터 행 생성
  const dataRows = data.map((row) =>
    csvHeaders.map((header) => escapeCSV(row[header])).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
};

/**
 * CSV 값 이스케이프 (쉼표, 줄바꿈, 큰따옴표 처리)
 * @param {any} value - 값
 * @returns {string} - 이스케이프된 값
 */
const escapeCSV = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

/**
 * CSV 파일 다운로드
 * @param {string} csvContent - CSV 내용
 * @param {string} filename - 파일명 (기본값: 'export.csv')
 */
export const downloadCSV = (csvContent, filename = 'export.csv') => {
  // BOM 추가 (Excel에서 한글이 깨지지 않도록)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 메모리 정리
  URL.revokeObjectURL(url);
};

/**
 * 현재 날짜 기반 파일명 생성
 * @param {string} prefix - 파일명 접두사
 * @returns {string} - 파일명 (예: 'export_20240424.csv')
 */
export const generateFilename = (prefix = 'export') => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return `${prefix}_${year}${month}${day}_${hours}${minutes}.csv`;
};

/**
 * 데이터를 CSV로 내보내고 다운로드
 * @param {Array<object>} data - 데이터 배열
 * @param {string} filename - 파일명 (optional)
 * @param {Array<string>} headers - 헤더 배열 (optional)
 */
export const exportToCSV = (data, filename, headers = null) => {
  const csvContent = arrayToCSV(data, headers);
  const finalFilename = filename || generateFilename('export');
  downloadCSV(csvContent, finalFilename);
};
