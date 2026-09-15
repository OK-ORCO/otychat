import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, CSSProperties } from 'react';
import Icon from './Icons';
import EmojiText from '../EmojiText';

/*
  DS primitives. Every screen is built from these plus the classes in ds.css.
  Rules: no gradients, no blur, no glow, no radius above 3px, no emoji as icons.
*/

export { Icon };

export function Bar({ title, sub, left, right }: { title: ReactNode; sub?: ReactNode; left?: ReactNode; right?: ReactNode }) {
  return (
    <div className="ds-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        {left}
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
      </div>
      {(sub || right) && <div className="ds-bar-sub" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{sub}{right}</div>}
    </div>
  );
}

export function Window({ title, grey, right, children, className, style, pad = true }: {
  title?: ReactNode; grey?: boolean; right?: ReactNode; children: ReactNode; className?: string; style?: CSSProperties; pad?: boolean;
}) {
  return (
    <div className={`ds-window ${className || ''}`} style={style}>
      {title !== undefined && (
        <div className={`ds-window-title ${grey ? 'grey' : ''}`}>
          <span>{title}</span>
          {right}
        </div>
      )}
      {pad ? <div className="ds-window-body">{children}</div> : children}
    </div>
  );
}

type KeyProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  kind?: 'default' | 'primary' | 'warn' | 'danger' | 'paper';
  on?: boolean;
  big?: boolean;
  sq?: boolean;
  wide?: boolean;
  col?: boolean;
  icon?: string;
  iconSize?: number;
};

export function Key({ kind = 'default', on, big, sq, wide, col, icon, iconSize = 18, className, children, ...rest }: KeyProps) {
  const cls = ['ds-key', kind !== 'default' ? kind : '', on ? 'on' : '', big ? 'big' : '', sq ? 'sq' : '', wide ? 'wide' : '', col ? 'col' : '', className || '']
    .filter(Boolean).join(' ');
  return (
    <button className={cls} {...rest}>
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
    </button>
  );
}

export function Chip({ kind, children, style }: { kind?: 'q' | 'live' | 'blue' | 'red'; children: ReactNode; style?: CSSProperties }) {
  return <span className={`ds-chip ${kind || ''}`} style={style}>{children}</span>;
}

export function Field(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`ds-field ${props.className || ''}`} />;
}

export function Row({ children, onClick, right, className }: { children: ReactNode; onClick?: () => void; right?: ReactNode; className?: string }) {
  if (onClick) {
    return (
      <button className={`ds-row press ${className || ''}`} onClick={onClick}>
        {children}
        {right !== undefined && <span className="ds-n">{right}</span>}
      </button>
    );
  }
  return (
    <div className={`ds-row ${className || ''}`}>
      {children}
      {right !== undefined && <span className="ds-n">{right}</span>}
    </div>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  return <div className="ds-h">{children}</div>;
}

/** A user's picture: emoji, or an image path/data URL. */
export function Pic({ src, size = 40, style }: { src?: string | null; size?: number; style?: CSSProperties }) {
  const s = src || '👤';
  const isImage = s.startsWith('data:') || s.startsWith('http') || s.startsWith('/');
  return (
    <div className="ds-pic" style={{ width: size, height: size, fontSize: size * 0.55, ...style }}>
      {isImage ? <img src={s} alt="" /> : <span>{s}</span>}
    </div>
  );
}

/** Composer canvas heights; a PNG this tall is handwriting, anything else is a photo. */
const DOODLE_HEIGHTS = [176, 110];

/**
 * A drawing or photo inside a note. Handwriting is pinned to its natural height
 * so its strokes stay on the note's rules, and so the notes below it never land
 * on a fractional pixel (a scaled image would push everything under it half a
 * pixel off the rules on a Retina screen).
 */
export function Doodle({ src, onClick, style }: { src: string; onClick?: () => void; style?: CSSProperties }) {
  return (
    <img
      className="doodle"
      src={src}
      alt=""
      onClick={onClick}
      onLoad={(e) => {
        const img = e.currentTarget;
        if (DOODLE_HEIGHTS.includes(img.naturalHeight)) img.style.height = `${img.naturalHeight}px`;
      }}
      style={style}
    />
  );
}

/**
 * A PictoChat note. Colour is the sender's pen colour; the body sits on ruled
 * paper so typed text and handwriting share the same lines.
 */
export function Note({ name, time, color, onName, image, text, foot, children }: {
  name: string; time?: string; color?: string; onName?: () => void;
  image?: string | null; text?: string | null; foot?: ReactNode; children?: ReactNode;
}) {
  const style = { '--note': color || 'var(--ds-blue)' } as CSSProperties;
  const tab = (
    <>
      <span>{name}</span>
      {time && <span className="t">{time}</span>}
    </>
  );
  return (
    <div className="ds-note" style={style}>
      {onName
        ? <button className="ds-note-tab press" onClick={onName}>{tab}</button>
        : <div className="ds-note-tab">{tab}</div>}
      <div className="ds-note-main">
        <div className="ds-note-body">
          {image && <Doodle src={image} />}
          {text && <div className="txt"><EmojiText text={text} /></div>}
          {children}
        </div>
        {foot && <div className="ds-note-foot">{foot}</div>}
      </div>
    </div>
  );
}

export function Scrim({ children, onClose, bottom }: { children: ReactNode; onClose?: () => void; bottom?: boolean }) {
  return (
    <div className={`ds-scrim ${bottom ? 'bottom' : ''}`} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420 }}>
        {children}
      </div>
    </div>
  );
}

export function Progress({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 100;
  return <div className="ds-progress"><i style={{ width: `${pct}%` }} /></div>;
}

export function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' ', '').toLowerCase();
}
