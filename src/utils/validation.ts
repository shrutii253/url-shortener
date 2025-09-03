export const validateUrl = (url: string): boolean => {
  try {
    const urlObject = new URL(url);
    return urlObject.protocol === 'http:' || urlObject.protocol === 'https:';
  } catch {
    return false;
  }
};

export const formatUrl = (url: string): string => {
  // Add https:// if no protocol is specified
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

export const isValidDomain = (url: string): boolean => {
  try {
    const urlObject = new URL(url);
    // Basic domain validation
    return urlObject.hostname.includes('.');
  } catch {
    return false;
  }
};