import { useRef, useEffect, useState } from 'react';

interface MessageComposerProps {
  onSend: (data: { drawing?: string; text?: string; image?: string }) => void;
  onSendToQueue?: (data: { drawing?: string; text?: string; image?: string }) => void;
  placeholder?: string;
  compact?: boolean;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const COLORS = [
  { name: 'Black', value: '#1f2937' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Yellow', value: '#fbbf24' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Orange', value: '#f97316' },
];

const BRUSH_SIZES = [
  { label: 'Small', size: 2 },
  { label: 'Medium', size: 4 },
  { label: 'Large', size: 8 }
];

export default function MessageComposer({ onSend, onSendToQueue, placeholder = 'Type or draw...', compact = false }: MessageComposerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState(COLORS[0].value);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1].size);
  const [text, setText] = useState('');
  const [hasDrawing, setHasDrawing] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const width = 300;
  const height = compact ? 96 : 150; // Reduced height for compact mode
  const lineSpacing = compact ? 24 : 30;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill with cream background and draw lines
    ctx.fillStyle = '#ffffeb';
    ctx.fillRect(0, 0, width, height);

    // Draw horizontal ruled lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let y = lineSpacing; y < height; y += lineSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, [compact, lineSpacing, height]);

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

    const x = ((clientX - rect.left) / rect.width) * width;
    const y = ((clientY - rect.top) / rect.height) * height;
    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isTyping) return;
    if ('touches' in e) e.preventDefault();

    const coords = getCanvasCoords(e);
    if (!coords) return;

    setIsDrawing(true);
    setHasDrawing(true);
    lastPosRef.current = coords;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.fillStyle = currentColor;
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPosRef.current = null;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (isTyping) return;
    if ('touches' in e) e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);
    if (!coords) return;

    const lastPos = lastPosRef.current;
    if (lastPos) {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }

    lastPosRef.current = coords;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);

    // Check file type
    if (!file.type.startsWith('image/')) {
      setImageError('Please select an image file');
      return;
    }

    // Check file size (5MB limit)
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError('Image must be under 5MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
    };
    reader.onerror = () => {
      setImageError('Failed to read image');
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const removeAttachedImage = () => {
    setAttachedImage(null);
    setImageError(null);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffeb';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let y = lineSpacing; y < height; y += lineSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    setText('');
    setHasDrawing(false);
    setAttachedImage(null);
    setImageError(null);
  };

  const handleSend = () => {
    if (!hasDrawing && !text.trim() && !attachedImage) return;

    const drawing = hasDrawing ? canvasRef.current?.toDataURL() : undefined;
    const textContent = text.trim() || undefined;

    onSend({
      drawing,
      text: textContent,
      image: attachedImage || undefined
    });

    handleClear();
    setIsTyping(false);
  };

  const handleSendToQueue = () => {
    if (!hasDrawing && !text.trim() && !attachedImage) return;
    if (!onSendToQueue) return;

    const drawing = hasDrawing ? canvasRef.current?.toDataURL() : undefined;
    const textContent = text.trim() || undefined;

    onSendToQueue({
      drawing,
      text: textContent,
      image: attachedImage || undefined
    });

    handleClear();
    setIsTyping(false);
  };

  const toggleTypingMode = () => {
    setIsTyping(prev => !prev);
    setShowColorModal(false);
    setShowSizeModal(false);
  };

  const hasContent = hasDrawing || text.trim() || attachedImage;

  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        style={{ display: 'none' }}
      />

      {/* Image Preview */}
      {attachedImage && (
        <div className="mb-2 relative inline-block">
          <img
            src={attachedImage}
            alt="Attached"
            className="rounded-xl"
            style={{
              maxHeight: '120px',
              maxWidth: '200px',
              objectFit: 'contain',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
            }}
          />
          <button
            onClick={removeAttachedImage}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
            style={{
              background: '#ef4444',
              color: 'white',
              border: '2px solid white',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Image Error */}
      {imageError && (
        <div className="mb-2 px-3 py-2 rounded-lg text-sm" style={{
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          fontFamily: 'Nunito, sans-serif'
        }}>
          {imageError}
        </div>
      )}

      {/* Main row: controls + canvas + actions */}
      <div className="flex gap-2 items-stretch">
        {/* Left side: Draw controls */}
        <div className="flex flex-col gap-0.5 justify-center">
          {/* Insert Point (Text Mode) Button */}
          <button
            onClick={toggleTypingMode}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-all"
            style={{
              background: isTyping
                ? 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)'
                : 'white',
              border: isTyping ? 'none' : '2px solid #e5e7eb',
              boxShadow: isTyping ? '0 2px 6px rgba(59, 130, 246, 0.4)' : 'none',
              cursor: 'pointer'
            }}
            title={isTyping ? 'Switch to Draw' : 'Type Text'}
          >
            <span style={{ fontSize: '12px' }}>{isTyping ? '✏️' : 'Ι'}</span>
          </button>

          {/* Color Picker Button */}
          <button
            onClick={() => {
              if (!isTyping) {
                setShowColorModal(!showColorModal);
                setShowSizeModal(false);
              }
            }}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-all"
            style={{
              background: currentColor,
              border: '2px solid white',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
              cursor: isTyping ? 'not-allowed' : 'pointer',
              opacity: isTyping ? 0.4 : 1
            }}
            disabled={isTyping}
            title="Pick Color"
          >
            <span style={{ fontSize: '10px', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' }}>🪣</span>
          </button>

          {/* Pen Size Button */}
          <button
            onClick={() => {
              if (!isTyping) {
                setShowSizeModal(!showSizeModal);
                setShowColorModal(false);
              }
            }}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-all"
            style={{
              background: 'white',
              border: '2px solid #e5e7eb',
              cursor: isTyping ? 'not-allowed' : 'pointer',
              opacity: isTyping ? 0.4 : 1
            }}
            disabled={isTyping}
            title="Brush Size"
          >
            <div
              style={{
                width: `${Math.max(brushSize * 1.5, 4)}px`,
                height: `${Math.max(brushSize * 1.5, 4)}px`,
                borderRadius: '50%',
                background: '#1f2937'
              }}
            />
          </button>

          {/* Image Attachment Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-all"
            style={{
              background: attachedImage
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'white',
              border: attachedImage ? 'none' : '2px solid #e5e7eb',
              boxShadow: attachedImage ? '0 2px 6px rgba(16, 185, 129, 0.4)' : 'none',
              cursor: 'pointer'
            }}
            title="Attach Image (max 5MB)"
          >
            <span style={{ fontSize: '12px' }}>📷</span>
          </button>
        </div>

        {/* Canvas */}
        <div className="relative flex-1">
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
            className="w-full"
            style={{
              borderRadius: '12px',
              touchAction: 'none',
              cursor: isTyping ? 'text' : 'crosshair',
              pointerEvents: isTyping ? 'none' : 'auto',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
              height: `${compact ? 96 : 150}px`
            }}
          />

          {/* Text overlay for typing mode */}
          {isTyping && (
            <textarea
              value={text}
              onChange={handleTextChange}
              placeholder={placeholder}
              autoFocus
              className="absolute inset-0 w-full h-full resize-none outline-none"
              style={{
                background: 'transparent',
                color: 'var(--text)',
                fontFamily: 'Nunito, sans-serif',
                fontSize: compact ? '14px' : '16px',
                lineHeight: `${lineSpacing}px`,
                borderRadius: '12px',
                border: 'none',
                // Align text to sit ON the ruled lines
                // First line is at y=lineSpacing, text baseline should be there
                paddingTop: `${lineSpacing - (compact ? 16 : 18)}px`,
                paddingLeft: '10px',
                paddingRight: '10px',
                paddingBottom: '6px'
              }}
            />
          )}
        </div>

        {/* Right side: Clear and Send buttons */}
        <div className="flex flex-col gap-0.5 justify-center">
          {/* Clear button */}
          <button
            onClick={handleClear}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:scale-105"
            style={{
              background: 'var(--bg-secondary)',
              border: 'none',
              cursor: 'pointer'
            }}
            title="Clear"
          >
            <span style={{ fontSize: '11px' }}>🗑️</span>
          </button>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!hasContent}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            style={{
              background: hasContent
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'var(--bg-secondary)',
              border: 'none',
              boxShadow: hasContent ? '0 2px 6px rgba(16, 185, 129, 0.4)' : 'none',
              cursor: hasContent ? 'pointer' : 'not-allowed'
            }}
            title="Send"
          >
            <span style={{
              fontSize: '11px',
              filter: hasContent ? 'none' : 'grayscale(1) opacity(0.5)',
              transform: 'rotate(-45deg)'
            }}>➤</span>
          </button>
        </div>
      </div>

      {/* Color Modal */}
      {showColorModal && (
        <div className="mt-2 p-3 rounded-xl" style={{
          background: 'white',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)'
        }}>
          <div className="flex gap-2 flex-wrap justify-center">
            {COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => {
                  setCurrentColor(color.value);
                  setShowColorModal(false);
                }}
                className="w-9 h-9 transition-all transform hover:scale-110"
                style={{
                  background: color.value,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: currentColor === color.value ? '3px solid #ec4899' : '2px solid #e5e7eb',
                  boxShadow: currentColor === color.value ? '0 2px 6px rgba(236, 72, 153, 0.4)' : 'none'
                }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* Size Modal */}
      {showSizeModal && (
        <div className="mt-2 p-3 rounded-xl" style={{
          background: 'white',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)'
        }}>
          <div className="flex gap-2 justify-center">
            {BRUSH_SIZES.map((size) => (
              <button
                key={size.label}
                onClick={() => {
                  setBrushSize(size.size);
                  setShowSizeModal(false);
                }}
                className="flex-1 max-w-20 px-3 py-2 transition-all flex flex-col items-center gap-1"
                style={{
                  background: brushSize === size.size ? '#3b82f6' : 'var(--bg-secondary)',
                  borderRadius: '10px',
                  color: brushSize === size.size ? 'white' : 'var(--text)',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: '10px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <div
                  style={{
                    width: `${size.size * 2}px`,
                    height: `${size.size * 2}px`,
                    borderRadius: '50%',
                    background: brushSize === size.size ? 'white' : '#1f2937'
                  }}
                />
                {size.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Non-compact mode: Full color/size pickers and buttons */}
      {!compact && !isTyping && (
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <div className="flex gap-2">
            {COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => setCurrentColor(color.value)}
                className="w-7 h-7 transition-all transform hover:scale-110"
                style={{
                  background: color.value,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: currentColor === color.value ? '2px solid #ec4899' : '2px solid #e5e7eb',
                  boxShadow: currentColor === color.value ? '0 2px 6px rgba(236, 72, 153, 0.4)' : 'none'
                }}
                title={color.name}
              />
            ))}
          </div>

          <div className="flex gap-2 ml-auto">
            {BRUSH_SIZES.map((size) => (
              <button
                key={size.label}
                onClick={() => setBrushSize(size.size)}
                className="px-2 py-1 transition-all"
                style={{
                  background: brushSize === size.size ? '#3b82f6' : 'var(--bg-secondary)',
                  borderRadius: '6px',
                  color: brushSize === size.size ? 'white' : 'var(--text)',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: '10px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {size.label[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons (non-compact mode) */}
      {!compact && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleClear}
            className="px-4 py-2 transition-all transform hover:scale-105"
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              color: 'var(--text)',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '13px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            🗑️ Clear
          </button>

          <button
            onClick={handleSend}
            disabled={!hasContent}
            className="flex-1 px-4 py-2 transition-all transform hover:scale-105 active:scale-95"
            style={{
              background: hasContent
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'var(--bg-secondary)',
              borderRadius: '12px',
              color: hasContent ? 'white' : 'var(--text-muted)',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '14px',
              fontWeight: '700',
              boxShadow: hasContent ? '0 4px 12px rgba(16, 185, 129, 0.4)' : 'none',
              cursor: hasContent ? 'pointer' : 'not-allowed',
              border: 'none'
            }}
          >
            {hasContent ? '✈️ SEND' : '📝 Create something...'}
          </button>

          {onSendToQueue && (
            <button
              onClick={handleSendToQueue}
              disabled={!hasContent}
              className="px-4 py-2 transition-all transform hover:scale-105 active:scale-95"
              style={{
                background: hasContent
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : 'var(--bg-secondary)',
                borderRadius: '12px',
                color: hasContent ? 'white' : 'var(--text-muted)',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '14px',
                fontWeight: '700',
                boxShadow: hasContent ? '0 4px 12px rgba(245, 158, 11, 0.4)' : 'none',
                cursor: hasContent ? 'pointer' : 'not-allowed',
                border: 'none'
              }}
            >
              📋 Q
            </button>
          )}
        </div>
      )}
    </div>
  );
}
