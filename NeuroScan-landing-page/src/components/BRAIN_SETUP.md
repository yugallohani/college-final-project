# BrainVisualization — Setup Guide

## 1. Install dependencies

```bash
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing
```

> **Peer dependency note:** `@react-three/fiber` requires React 18+.
> `@react-three/postprocessing` requires `postprocessing` as a peer —
> it's installed automatically with the command above.

### Version targets (tested)

| Package                   | Version |
|---------------------------|---------|
| `three`                   | ^0.169  |
| `@react-three/fiber`      | ^8.x    |
| `@react-three/drei`       | ^9.x    |
| `@react-three/postprocessing` | ^2.x |

---

## 2. Add files to your project

Place both files anywhere convenient (e.g. `src/components/brain/`):

```
src/
└── components/
    └── brain/
        ├── BrainVisualization.jsx
        └── BrainVisualization.css
```

---

## 3. Import and use

```jsx
import BrainVisualization from './components/brain/BrainVisualization';

export default function ProductPage() {
  return (
    <section className="product-section">

      <div className="left-content">
        {/* your feature cards */}
      </div>

      <div className="right-brain">
        <BrainVisualization />
      </div>

    </section>
  );
}
```

The `.product-section`, `.left-content`, and `.right-brain` classes are
defined inside `BrainVisualization.css` — copy them into your page
stylesheet or keep them in the component CSS.

---

## 4. Configuration knobs

Everything visual is controlled by constants at the top of `BrainVisualization.jsx`:

| Constant / prop      | Default       | Effect                              |
|----------------------|---------------|-------------------------------------|
| `COLORS.neuralBlue`  | `#4F7CFF`     | Node + synapse primary colour        |
| `COLORS.neuralCyan`  | `#00D4FF`     | Pulse particle accent colour         |
| `COLORS.neuralPurple`| `#9B72CF`     | Fill light tint                      |
| `nodeCount`          | `90`          | Number of neurons (lower = faster)   |
| `maxConnections`     | `130`         | Max synapse lines                    |
| `Bloom intensity`    | `1.8`         | Glow strength (in `<Scene />`)       |
| `distort`            | `0.32 / 0.28` | Brain-surface warping per hemisphere |

---

## 5. Performance tips

- **Lower node count** if you target lower-end devices:
  `generateNeuralData(50, 80)` is a safe minimum.
- **dpr cap** is already set to `[1, 2]` — remove the upper limit only
  on high-end desktop demos.
- The Canvas uses `alpha: true` (transparent background) so Three.js
  composites over your page; no extra background div needed.
- `pointer-events: none` on the container lets page scroll pass through.

---

## 6. Next.js / SSR note

Wrap the import in a dynamic import with `ssr: false`:

```js
import dynamic from 'next/dynamic';

const BrainVisualization = dynamic(
  () => import('./components/brain/BrainVisualization'),
  { ssr: false }
);
```

Three.js and React Three Fiber rely on browser APIs unavailable during
server-side rendering.
