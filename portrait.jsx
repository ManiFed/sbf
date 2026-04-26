// Stylized geometric portrait — CSS-only block silhouette.
// Three treatment variants: 'pixel' (terminal), 'halftone' (editorial), 'lowpoly' (fintech).
// No real photo. Suggests "curly-haired man in tee" via shape primitives only.

function Portrait({ variant = 'pixel', size = 120, fg = '#e8c87b', bg = 'transparent' }) {
  // Pixel grid — a 12x14 matrix where 1 = filled.
  // Reads as: round head with curly halo, neutral expression, t-shirt collar.
  const grid = [
    "000011111100",
    "000111111110",
    "001111111111",
    "011111111111",
    "011111111111",
    "001111111110",
    "001111111110",
    "001111111100",
    "000111111000",
    "000111111000",
    "001111111110",
    "011111111111",
    "011111111111",
    "111111111111",
  ];
  const rows = grid.length;
  const cols = grid[0].length;
  const cell = size / cols;

  if (variant === 'pixel') {
    return (
      <div style={{ width: size, height: rows * cell, position: 'relative', background: bg }}>
        {grid.map((row, r) =>
          [...row].map((c, x) =>
            c === '1' ? (
              <div key={`${r}-${x}`} style={{
                position: 'absolute',
                left: x * cell, top: r * cell,
                width: cell, height: cell,
                background: fg,
                opacity: 0.85 + Math.random() * 0.15,
              }} />
            ) : null
          )
        )}
      </div>
    );
  }

  if (variant === 'halftone') {
    return (
      <div style={{ width: size, height: rows * cell, position: 'relative', background: bg }}>
        {grid.map((row, r) =>
          [...row].map((c, x) => {
            if (c !== '1') return null;
            const d = cell * (0.45 + ((r * x) % 5) / 10);
            return (
              <div key={`${r}-${x}`} style={{
                position: 'absolute',
                left: x * cell + (cell - d) / 2,
                top: r * cell + (cell - d) / 2,
                width: d, height: d,
                background: fg, borderRadius: '50%',
              }} />
            );
          })
        )}
      </div>
    );
  }

  // lowpoly: fill cells with alternating triangle gradients
  return (
    <div style={{ width: size, height: rows * cell, position: 'relative', background: bg }}>
      {grid.map((row, r) =>
        [...row].map((c, x) => {
          if (c !== '1') return null;
          const flip = (r + x) % 2 === 0;
          const tone = 0.55 + ((r * 7 + x * 3) % 10) / 22;
          return (
            <div key={`${r}-${x}`} style={{
              position: 'absolute',
              left: x * cell, top: r * cell,
              width: cell, height: cell,
              background: `linear-gradient(${flip ? 135 : 45}deg, ${fg} 50%, transparent 50%)`,
              opacity: tone,
            }} />
          );
        })
      )}
    </div>
  );
}

Object.assign(window, { Portrait });
