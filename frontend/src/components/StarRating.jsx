import { Star } from 'lucide-react';
import { useState } from 'react';

export default function StarRating({ value = 0, onChange, readonly = false, size = 20 }) {
  const [hoverVal, setHoverVal] = useState(0);

  const displayVal = hoverVal || value || 0;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const isFilled = starIndex <= Math.round(displayVal);
        return (
          <button
            key={starIndex}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange && onChange(starIndex)}
            onMouseEnter={() => !readonly && setHoverVal(starIndex)}
            onMouseLeave={() => !readonly && setHoverVal(0)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 2,
              cursor: readonly ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.15s ease',
              transform: !readonly && hoverVal === starIndex ? 'scale(1.2)' : 'scale(1)',
            }}
          >
            <Star
              size={size}
              fill={isFilled ? '#f59e0b' : 'transparent'}
              color={isFilled ? '#f59e0b' : '#475569'}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}
