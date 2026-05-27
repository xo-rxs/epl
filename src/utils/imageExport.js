import html2canvas from 'html2canvas';

const createImageFilename = (prefix = 'tactics_board', extension = 'png') => {
  const safePrefix = prefix
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .toLowerCase();

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return `${safePrefix}_${year}${month}${day}_${hours}${minutes}.${extension}`;
};

const captureElement = async (element, options = {}) => {
  if (!element) {
    throw new Error('캡처 대상 요소가 없습니다.');
  }

  return html2canvas(element, {
    scale: 2,
    backgroundColor: '#0b5d2a',
    useCORS: true,
    ...options,
  });
};

export const downloadElementAsPng = async (element, filename, options = {}) => {
  const canvas = await captureElement(element, options);
  const finalFilename = filename || createImageFilename('tactics_board', 'png');

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve(false);

      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', finalFilename);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      resolve(true);
    }, 'image/png');
  });
};

export const shareElementImage = async (
  element,
  { title = '전술 배치도', text = '', filename, options } = {}
) => {
  if (!navigator.share || !navigator.canShare) {
    return false;
  }

  const canvas = await captureElement(element, options);

  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) return resolve(false);

      const file = new File([blob], filename || createImageFilename('tactics_board', 'png'), {
        type: 'image/png',
      });

      if (!navigator.canShare({ files: [file] })) {
        resolve(false);
        return;
      }

      try {
        await navigator.share({ title, text, files: [file] });
        resolve(true);
      } catch (error) {
        console.error('공유 실패:', error);
        resolve(false);
      }
    }, 'image/png');
  });
};
