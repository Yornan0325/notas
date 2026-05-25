const listLinePattern = /^(\s*)(?:([\u2022\u25cf\u25cb\u25aa\u25a0\u2023\u2013-])|(\d+|[a-zA-Z])[.)])\s+(.+)$/;
const leadingListMarkerPattern = /^(\s*)(?:[\u2022\u25cf\u25cb\u25aa\u25a0\u2023\u2013-]|(?:\d+|[a-zA-Z])[.)])\s*/;

const normalizePastedText = (text: string) =>
  text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/^\n+|\n+$/g, '');

export const plainTextToHtml = (text: string) => {
  const parsed = document.implementation.createHTMLDocument('');
  const container = parsed.createElement('div');
  const lines = normalizePastedText(text).split('\n');
  const lists: Array<{
    element: HTMLOListElement | HTMLUListElement;
    type: 'ol' | 'ul';
    lastItem?: HTMLLIElement;
  }> = [];
  let paragraphLines: string[] = [];

  const closeLists = () => {
    lists.length = 0;
  };

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    const paragraph = parsed.createElement('p');
    paragraphLines.forEach((line, index) => {
      if (index > 0) paragraph.appendChild(parsed.createElement('br'));
      paragraph.appendChild(parsed.createTextNode(line));
    });
    container.appendChild(paragraph);
    paragraphLines = [];
  };

  const appendElement = (tagName: 'blockquote' | 'h1' | 'h2' | 'h3' | 'hr', content?: string) => {
    flushParagraph();
    closeLists();
    const element = parsed.createElement(tagName);
    if (content) element.textContent = content;
    container.appendChild(element);
  };

  lines.forEach((line) => {
    if (!line.trim()) {
      flushParagraph();
      closeLists();
      return;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length as 1 | 2 | 3;
      appendElement(`h${level}` as 'h1' | 'h2' | 'h3', heading[2].trim());
      return;
    }

    if (/^\s*(?:---+|\*\*\*+)\s*$/.test(line)) {
      appendElement('hr');
      return;
    }

    const quote = line.match(/^\s*>\s?(.*)$/);
    if (quote) {
      appendElement('blockquote', quote[1]);
      return;
    }

    const listMatch = line.match(listLinePattern);
    if (listMatch) {
      flushParagraph();
      const [, indent, unorderedMarker, orderedMarker, content] = listMatch;
      const type: 'ol' | 'ul' = unorderedMarker ? 'ul' : 'ol';
      const rawLevel = Math.min(4, Math.floor(indent.replace(/\t/g, '    ').length / 2));
      const level = Math.min(rawLevel, lists.length);

      while (lists.length > level + 1) lists.pop();
      if (lists[level]?.type !== type) {
        lists.length = level;
        const list = parsed.createElement(type);
        const numericStart = orderedMarker && /^\d+$/.test(orderedMarker) ? Number(orderedMarker) : 0;
        if (type === 'ol' && numericStart > 1) (list as HTMLOListElement).start = numericStart;

        if (level === 0) {
          container.appendChild(list);
        } else {
          lists[level - 1].lastItem?.appendChild(list);
        }

        lists.push({ element: list, type });
      }

      const item = parsed.createElement('li');
      item.textContent = content.trim();
      const numericValue = orderedMarker && /^\d+$/.test(orderedMarker) ? Number(orderedMarker) : 0;
      if (type === 'ol' && numericValue > 0 && lists[level].element.childElementCount > 0) {
        item.value = numericValue;
      }
      lists[level].element.appendChild(item);
      lists[level].lastItem = item;
      return;
    }

    closeLists();
    paragraphLines.push(line.trim());
  });

  flushParagraph();
  return container.innerHTML;
};

const removeLeadingListMarker = (element: Element, root: HTMLElement) => {
  const walker = root.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let textNode = walker.nextNode() as Text | null;

  while (textNode) {
    const value = textNode.nodeValue || '';
    if (value.trim()) {
      textNode.nodeValue = value.replace(leadingListMarkerPattern, '');
      return;
    }
    textNode = walker.nextNode() as Text | null;
  }
};

const normalizePseudoLists = (root: HTMLElement) => {
  const blocks = Array.from(root.querySelectorAll('p, div')).filter(
    (element) => !element.closest('ul, ol') && listLinePattern.test(element.textContent || '')
  );

  blocks.forEach((element) => {
    const text = element.textContent || '';
    const match = text.match(listLinePattern);
    if (!match) return;

    const [, , unorderedMarker, , content] = match;
    const list = root.ownerDocument.createElement(unorderedMarker ? 'ul' : 'ol');
    const item = root.ownerDocument.createElement('li');
    item.innerHTML = element.innerHTML;
    removeLeadingListMarker(item, root);
    if (!item.textContent?.trim()) item.textContent = content.trim();
    list.appendChild(item);
    element.replaceWith(list);
  });
};

const cleanPastedListItems = (root: HTMLElement) => {
  root.querySelectorAll('li').forEach((item) => {
    Array.from(item.children).forEach((child) => {
      const tagName = child.tagName.toLowerCase();
      const text = child.textContent?.trim() || '';

      if ((tagName === 'p' || tagName === 'div') && !text) {
        child.remove();
        return;
      }

      if (tagName === 'p' || tagName === 'div') {
        child.replaceWith(...Array.from(child.childNodes));
      }
    });

    item.normalize();
  });
};

const removeEmptyFlowBlocks = (root: HTMLElement) => {
  root.querySelectorAll('p, div').forEach((element) => {
    if (element.closest('li')) return;

    const hasText = Boolean(element.textContent?.replace(/\u00a0/g, ' ').trim());
    const hasContent = Boolean(element.querySelector('img, hr, table, ul, ol'));
    if (!hasText && !hasContent) element.remove();
  });

  root.querySelectorAll('li').forEach((item) => {
    const hasText = Boolean(item.textContent?.replace(/\u00a0/g, ' ').trim());
    const hasNestedList = Boolean(item.querySelector('ul, ol'));
    if (!hasText && !hasNestedList) item.remove();
  });

  Array.from(root.childNodes).forEach((node) => {
    if (!(node instanceof HTMLBRElement)) return;

    const adjacentBlock = [node.previousSibling, node.nextSibling].some(
      (sibling) =>
        sibling instanceof HTMLElement &&
        sibling.matches('p, div, h1, h2, h3, blockquote, pre, hr, table, ul, ol')
    );
    const adjacentBreak =
      node.previousSibling instanceof HTMLBRElement || node.nextSibling instanceof HTMLBRElement;

    if (adjacentBlock || adjacentBreak) node.remove();
  });
};

const mergeAdjacentLists = (root: HTMLElement) => {
  const mergeInContainer = (container: Element | DocumentFragment) => {
    let current = container.firstChild;

    while (current) {
      if (current instanceof HTMLElement) mergeInContainer(current);

      if (!(current instanceof HTMLElement) || !['UL', 'OL'].includes(current.tagName)) {
        current = current.nextSibling;
        continue;
      }

      let next = current.nextSibling;

      while (next && next.nodeType === Node.TEXT_NODE && !next.textContent?.trim()) {
        const emptyText = next;
        next = next.nextSibling;
        emptyText.remove();
      }

      while (next instanceof HTMLBRElement) {
        const breakNode = next;
        next = next.nextSibling;
        breakNode.remove();
      }

      if (next instanceof HTMLElement && next.tagName === current.tagName) {
        while (next.firstChild) current.appendChild(next.firstChild);
        const listToRemove = next;
        next = next.nextSibling;
        listToRemove.remove();
        continue;
      }

      current = current.nextSibling;
    }
  };

  mergeInContainer(root);
};

export const sanitizePastedHtml = (html: string) => {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const blockedTags = ['script', 'style', 'meta', 'link', 'iframe', 'object', 'embed'];
  const semanticTags = new Set([
    'a', 'b', 'blockquote', 'br', 'code', 'del', 'div', 'em', 'h1', 'h2', 'h3', 'h4',
    'hr', 'i', 'img', 'li', 'ol', 'p', 'pre', 's', 'strong', 'table', 'tbody', 'td',
    'th', 'thead', 'tr', 'u', 'ul',
  ]);
  const allowedAttributes: Record<string, string[]> = {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt'],
    li: ['value'],
    ol: ['start', 'type'],
  };

  blockedTags.forEach((tag) => {
    parsed.querySelectorAll(tag).forEach((node) => node.remove());
  });

  parsed.body.querySelectorAll('*').forEach((element) => {
    const tagName = element.tagName.toLowerCase();
    const allowedForTag = allowedAttributes[tagName] || [];

    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();

      if (!allowedForTag.includes(name) || name.startsWith('on')) {
        element.removeAttribute(attribute.name);
        return;
      }

      if ((name === 'href' || name === 'src') && value.startsWith('javascript:')) {
        element.removeAttribute(attribute.name);
      }
    });

    if (tagName === 'a' && element.getAttribute('href')) {
      element.setAttribute('target', '_blank');
      element.setAttribute('rel', 'noreferrer');
    }
  });

  parsed.body.querySelectorAll('img').forEach((image) => {
    if (/^data:image\//i.test(image.getAttribute('src') || '')) image.remove();
  });
  parsed.body.querySelectorAll('h4').forEach((heading) => {
    const replacement = parsed.createElement('h3');
    replacement.append(...Array.from(heading.childNodes));
    heading.replaceWith(replacement);
  });
  parsed.body.querySelectorAll('*').forEach((element) => {
    if (!semanticTags.has(element.tagName.toLowerCase())) {
      element.replaceWith(...Array.from(element.childNodes));
    }
  });
  parsed.body.querySelectorAll('li').forEach((item) => removeLeadingListMarker(item, parsed.body));
  normalizePseudoLists(parsed.body);
  cleanPastedListItems(parsed.body);
  removeEmptyFlowBlocks(parsed.body);
  mergeAdjacentLists(parsed.body);

  return parsed.body.innerHTML;
};
