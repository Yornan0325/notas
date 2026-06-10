import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'pre', 'code', 'blockquote', 'hr', 'table', 'thead', 'tbody',
  'tr', 'th', 'td', 'div', 'span', 'sup', 'sub', 'mark',
  'img', 'figure', 'figcaption',
];

const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'title', 'alt', 'src',
  'width', 'height', 'class', 'id', 'style',
];

export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: true,
    ADD_ATTR: ['target', 'rel'],
  });
};
