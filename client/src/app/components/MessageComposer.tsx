import { useRef, useEffect, useState } from 'react';
import { Key, Icon } from './ds';

interface MessageComposerProps {
  onSend: (data: { drawing?: string; text?: string; image?: string }) => void;
  onSendToQueue?: (data: { drawing?: string; text?: string; image?: string }) => void;
  placeholder?: string;
  compact?: boolean;
  /** The user's pen colour; the first swatch and the default ink */
  penColor?: string;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const PALETTE = ['#2a2f38', '#d1483c', '#3b62c4', '#2f9e5b', '#c9931a', '#9a4bc4', '#e26fb2', '#8a5a2b'];
const BRUSH_SIZES = [2, 4, 8];

const PAPER = '#ffffff';
const RULE = '#b7d6f0';
const RULE_GAP = 22;

/**
 * The bottom DS screen: ruled paper you draw or type on, a tool column on the
 * left, SEND / Q / CLEAR keys and the palette on the right.
 */
export default function MessageComposer({ onSend, onSendToQueue, placeholder = 'Write or draw here', compact = false, penColor }: MessageComposerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState(penColor || PALETTE[0]);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1]);
  const [eraser, setEraser] = useState(false);
  const [text, setText] = useState('');
  const [hasDrawing, setHasDrawing] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const width = 300;
  const height = compact ? 110 : 176;

  useEffect(() => {
    if (penColor) setCurrentColor(penColor);
  }, [penColor]);

  const paintPaper = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = RULE;
    ctx.lineWidth = 1;
    for (let y = RULE_GAP; y < height; y += RULE_GAP) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
      ctx.stroke();
    }
  };

  useEffect(() => {
    paintPaper();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compact, height]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return { x: ((clientX - rect.left) / rect.width) * width, y: ((clientY - rect.top) / rect.height) * height };
  };

  const strokeStyle = () => (eraser ? PAPER : currentColor);
  const strokeWidth = () => (eraser ? brushSize * 3 : brushSize);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isTyping) return;
    if ('touches' in e) e.preventDefault();
    const coords = getCanvasCoords(e);
    if (!coords) return;
    setIsDrawing(true);
    if (!eraser) setHasDrawing(true);
    lastPosRef.current = coords;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.fillStyle = strokeStyle();
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, strokeWidth() / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPosRef.current = null;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isTyping) return;
    if ('touches' in e) e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    const coords = getCanvasCoords(e);
    if (!ctx || !coords) return;
    const last = lastPosRef.current;
    if (last) {
      ctx.strokeStyle = strokeStyle();
      ctx.lineWidth = strokeWidth();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
    lastPosRef.current = coords;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);
    if (!file.type.startsWith('image/')) { setImageError('That is not an image'); return; }
    if (file.size > MAX_IMAGE_SIZE) { setImageError('Image must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setAttachedImage(reader.result as string);
    reader.onerror = () => setImageError('Could not read that image');
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleClear = () => {
    paintPaper();
    setText('');
    setHasDrawing(false);
    setAttachedImage(null);
    setImageError(null);
  };

  const payload = () => ({
    drawing: hasDrawing ? canvasRef.current?.toDataURL() : undefined,
    text: text.trim() || undefined,
    image: attachedImage || undefined
  });

  const hasContent = hasDrawing || text.trim().length > 0 || !!attachedImage;

  const handleSend = () => {
    if (!hasContent) return;
    onSend(payload());
    handleClear();
    setIsTyping(false);
  };

  const handleSendToQueue = () => {
    if (!hasContent || !onSendToQueue) return;
    onSendToQueue(payload());
    handleClear();
    setIsTyping(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />

      {(attachedImage || imageError) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {attachedImage && (
            <div className="ds-window" style={{ padding: 3, display: 'inline-flex' }}>
              <img src={attachedImage} alt="" style={{ maxHeight: 64, maxWidth: 120, objectFit: 'contain', display: 'block' }} />
            </div>
          )}
          {attachedImage && <Key sq icon="x" onClick={() => setAttachedImage(null)} title="Remove photo" />}
          {imageError && <span style={{ color: 'var(--ds-red)', fontSize: 12 }}>{imageError}</span>}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
        {/* tool column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 34, flex: 'none' }}>
          <Key sq on={!isTyping && !eraser} icon="pencil" title="Draw" onClick={() => { setIsTyping(false); setEraser(false); }} />
          <Key sq on={isTyping} icon="text" title="Type" onClick={() => { setIsTyping(true); setEraser(false); }} />
          <Key sq on={eraser && !isTyping} icon="broom" title="Eraser" onClick={() => { setIsTyping(false); setEraser(true); }} disabled={isTyping} />
          <Key
            sq
            title="Pen size"
            onClick={() => setBrushSize(BRUSH_SIZES[(BRUSH_SIZES.indexOf(brushSize) + 1) % BRUSH_SIZES.length])}
            disabled={isTyping}
          >
            <span style={{ width: brushSize * 2 + 2, height: brushSize * 2 + 2, background: 'currentColor', display: 'block' }} />
          </Key>
          {!compact && <Key sq icon="camera" title="Attach a photo" on={!!attachedImage} onClick={() => fileInputRef.current?.click()} />}
        </div>

        {/* paper */}
        <div className="ds-paper" style={{ flex: 1, minWidth: 0, height }}>
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{
              display: 'block', width: '100%', height: '100%',
              touchAction: 'none',
              cursor: isTyping ? 'text' : 'crosshair',
              pointerEvents: isTyping ? 'none' : 'auto',
              imageRendering: 'pixelated'
            }}
          />
          {isTyping ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder}
              autoFocus
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                background: 'transparent', border: 0, outline: 'none', resize: 'none',
                fontFamily: 'inherit', fontSize: 15, lineHeight: `${RULE_GAP}px`, color: currentColor,
                padding: `3px 8px 0`
              }}
            />
          ) : (
            !hasDrawing && (
              <span style={{ position: 'absolute', left: 8, top: 3, lineHeight: `${RULE_GAP}px`, color: 'var(--ds-faint)', fontSize: 14, pointerEvents: 'none' }}>
                {placeholder}
              </span>
            )
          )}
          {text && !isTyping && (
            <div style={{ position: 'absolute', left: 8, right: 8, bottom: 2, fontSize: 12, color: currentColor, background: 'rgba(255,255,255,0.85)', padding: '0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {text}
            </div>
          )}
        </div>

        {/* action column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: compact ? 52 : 64, flex: 'none' }}>
          <Key kind="paper" col onClick={handleSend} disabled={!hasContent} style={{ height: compact ? 44 : 60 }} title="Send">
            <Icon name="send" size={18} />
            SEND
          </Key>
          {onSendToQueue && !compact && (
            <Key kind="warn" onClick={handleSendToQueue} disabled={!hasContent} title="Send to the question queue">
              Q <Icon name="play" size={12} />
            </Key>
          )}
          <Key onClick={handleClear} title="Clear" style={{ fontSize: 12 }}>CLEAR</Key>
          {!compact && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, marginTop: 'auto' }}>
              {PALETTE.map(c => (
                <button
                  key={c}
                  className={`ds-swatch ${currentColor === c && !eraser ? 'on' : ''}`}
                  style={{ background: c, width: '100%', height: 12 }}
                  onClick={() => { setCurrentColor(c); setEraser(false); }}
                  title={c}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {compact && (
        <div style={{ display: 'flex', gap: 3 }}>
          {PALETTE.map(c => (
            <button
              key={c}
              className={`ds-swatch ${currentColor === c && !eraser ? 'on' : ''}`}
              style={{ background: c, flex: 1, height: 12 }}
              onClick={() => { setCurrentColor(c); setEraser(false); }}
              title={c}
            />
          ))}
          <Key sq icon="camera" title="Attach a photo" on={!!attachedImage} onClick={() => fileInputRef.current?.click()} style={{ width: 28, height: 20, minHeight: 0 }} iconSize={14} />
        </div>
      )}
    </div>
  );
}
