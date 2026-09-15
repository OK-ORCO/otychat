import { Fragment } from 'react';
import { getEmojiUrl } from '../data/emoji-data';

/** A custom (Discord) emoji typed into text lands as `:<id>:`. */
const TOKEN = /:(\d{17,20}):/g;

/** Plain-text form for places that cannot show an image. */
export function stripEmojiTokens(text: string): string {
  return text.replace(TOKEN, '[emoji]');
}

/** Renders text with `:<id>:` tokens swapped for the emoji image, inline. */
export function EmojiText({ text, size = 20 }: { text: string; size?: number }) {
  const parts: Array<string | { id: string }> = [];
  const re = new RegExp(TOKEN.source, 'g');
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push({ id: m[1] });
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));

  return (
    <>
      {parts.map((p, i) =>
        typeof p === 'string'
          ? <Fragment key={i}>{p}</Fragment>
          : <img key={i} src={getEmojiUrl(p.id)} alt="" className="px" style={{ display: 'inline-block', width: size, height: size, verticalAlign: 'middle', objectFit: 'contain' }} />
      )}
    </>
  );
}

export default EmojiText;
