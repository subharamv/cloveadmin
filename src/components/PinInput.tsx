import { useRef, KeyboardEvent, ClipboardEvent } from 'react';

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  showValue: boolean;
  autoFocus?: boolean;
  boxClassName?: string;
}

const DEFAULT_BOX_CLASSNAME =
  'h-14 flex-1 max-w-14 text-center text-xl font-black bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all';

// Four-box OTP-style entry for 4-digit PINs — auto-advances on type, steps
// back on backspace-through-empty, and accepts a pasted 4-digit string.
export function PinInput({ value, onChange, showValue, autoFocus, boxClassName }: PinInputProps) {
  const digits = [0, 1, 2, 3].map((i) => value[i] || '');
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    onChange(next.join(''));
    if (digit && index < 3) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4).split('');
    if (pasted.length === 0) return;
    const next = ['', '', '', ''];
    pasted.forEach((d, i) => { next[i] = d; });
    onChange(next.join(''));
    refs.current[Math.min(pasted.length, 3)]?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-2.5">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type={showValue ? 'text' : 'password'}
          inputMode="numeric"
          pattern="\d"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          autoFocus={autoFocus && i === 0}
          required
          className={boxClassName || DEFAULT_BOX_CLASSNAME}
        />
      ))}
    </div>
  );
}
