import { forwardRef, useEffect, useImperativeHandle, useRef, CSSProperties } from 'react';
import { getEmojiUrl } from '../data/emoji-data';

export interface EmojiInputHandle {
  /** Insert a unicode emoji or a `:<discord id>:` token at the caret and refocus. */
  insert: (s: string) => void;
  focus: () => void;
}

interface EmojiInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  style?: CSSProperties;
  emojiSize?: number;
}

const TOKEN = /^:(\d{17,20}):$/;

function emojiImg(id: string, size: number) {
  const img = document.createElement('img');
  img.src = getEmojiUrl(id);
  img.alt = '';
  img.className = 'px';
  img.dataset.token = `:${id}:`;
  img.draggable = false;
  img.style.cssText = `width:${size}px;height:${size}px;vertical-align:middle;object-fit:contain;display:inline-block;margin:0 1px;`;
  return img;
}

/** Walk the editable DOM back into plain text with `:id:` tokens and newlines. */
function serialise(root: HTMLElement): string {
  let out = '';
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) { out += node.textContent || ''; return; }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    if (el.tagName === 'IMG') { out += el.dataset.token || ''; return; }
    if (el.tagName === 'BR') { out += '\n'; return; }
    // Enter makes the browser wrap the new line in a <div>; read that as a newline
    const block = el.tagName === 'DIV' || el.tagName === 'P';
    if (block && out.length > 0 && !out.endsWith('\n')) out += '\n';
    el.childNodes.forEach(child => walk(child));
  };
  root.childNodes.forEach(child => walk(child));
  return out;
}

/** Build the editable DOM from a value (only used when the value changes from outside, e.g. clear). */
function render(root: HTMLElement, value: string, size: number) {
  root.innerHTML = '';
  const parts = value.split(/(:\d{17,20}:)/g);
  parts.forEach(part => {
    if (!part) return;
    const m = part.match(TOKEN);
    if (m) { root.appendChild(emojiImg(m[1], size)); return; }
    const lines = part.split('\n');
    lines.forEach((line, i) => {
      if (i > 0) root.appendChild(document.createElement('br'));
      if (line) root.appendChild(document.createTextNode(line));
    });
  });
}

/**
 * A contenteditable that shows custom emoji as the actual picture while you
 * type, instead of the `:id:` token the message is sent as.
 */
const EmojiInput = forwardRef<EmojiInputHandle, EmojiInputProps>(function EmojiInput(
  { value, onChange, placeholder, autoFocus, style, emojiSize = 20 }, ref
) {
  const rootRef = useRef<HTMLDivElement>(null);

  // Keep the DOM in step with the value only when they disagree (clear, send)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (serialise(root) !== value) render(root, value, emojiSize);
  }, [value, emojiSize]);

  useEffect(() => {
    if (autoFocus) rootRef.current?.focus();
  }, [autoFocus]);

  const emit = () => {
    const root = rootRef.current;
    if (root) onChange(serialise(root));
  };

  const caretRange = (): Range => {
    const root = rootRef.current!;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const r = sel.getRangeAt(0);
      if (root.contains(r.commonAncestorContainer)) return r;
    }
    const r = document.createRange();
    r.selectNodeContents(root);
    r.collapse(false);
    return r;
  };

  const insertNode = (node: Node) => {
    const root = rootRef.current;
    if (!root) return;
    root.focus();
    const r = caretRange();
    r.deleteContents();
    r.insertNode(node);
    r.setStartAfter(node);
    r.collapse(true);
    const sel = window.getSelection();
    if (sel) { sel.removeAllRanges(); sel.addRange(r); }
    emit();
  };

  useImperativeHandle(ref, () => ({
    insert: (s: string) => {
      const m = s.match(TOKEN);
      insertNode(m ? emojiImg(m[1], emojiSize) : document.createTextNode(s));
    },
    focus: () => rootRef.current?.focus()
  }), [emojiSize]);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {!value && placeholder && (
        <span style={{ position: 'absolute', left: 8, top: 3, lineHeight: `${style?.lineHeight ?? '22px'}`, color: 'var(--ds-faint)', fontSize: 14, pointerEvents: 'none' }}>
          {placeholder}
        </span>
      )}
      <div
        ref={rootRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        onInput={emit}
        onBlur={emit}
        onPaste={(e) => {
          e.preventDefault();
          const plain = e.clipboardData.getData('text/plain');
          if (plain) insertNode(document.createTextNode(plain));
        }}
        style={{
          position: 'absolute', inset: 0, overflowY: 'auto', outline: 'none',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word', WebkitUserSelect: 'text', userSelect: 'text',
          ...style
        }}
      />
    </div>
  );
});

export default EmojiInput;
