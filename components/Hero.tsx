import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { innerDrivers, outerDrivers } from '../data/drivers';
import type { DriverNode } from '../data/drivers';

// ── Layout & Diagram Constants ───────────────────────────────────────
const CX = 350;
const CY = 350;
const INNER_RADIUS = 170;
const OUTER_RADIUS = 280;
const NODE_SIZE = 44;

const toRad = (deg: number) => (deg * Math.PI) / 180;

function ringPositions(count: number, radius: number, offsetDeg = 0) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i * 360) / count - 90 + offsetDeg;
    return {
      x: CX + radius * Math.cos(toRad(angle)),
      y: CY + radius * Math.sin(toRad(angle)),
      angleDeg: angle + 90,
    };
  });
}

const innerPositions = ringPositions(6, INNER_RADIUS, 0);
const outerPositions = ringPositions(6, OUTER_RADIUS, 30);

// ── Orbit Animation CSS ─────────────────────────────────────────────
const ORBIT_STYLES = `
@keyframes hero-orbit {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.hero-inner-orbit {
  animation: hero-orbit 80s linear infinite;
  transform-origin: ${CX}px ${CY}px;
}
.hero-outer-orbit {
  animation: hero-orbit 120s linear infinite reverse;
  transform-origin: ${CX}px ${CY}px;
}
.hero-inner-node-upright {
  animation: hero-orbit 80s linear infinite reverse;
}
.hero-outer-node-upright {
  animation: hero-orbit 120s linear infinite;
}
.hero-diagram-paused .hero-inner-orbit,
.hero-diagram-paused .hero-outer-orbit,
.hero-diagram-paused .hero-inner-node-upright,
.hero-diagram-paused .hero-outer-node-upright {
  animation-play-state: paused;
}
@media (prefers-reduced-motion: reduce) {
  .hero-inner-orbit, .hero-outer-orbit,
  .hero-inner-node-upright, .hero-outer-node-upright {
    animation: none !important;
  }
}
`;

// ── Tooltip Component ────────────────────────────────────────────────
interface TooltipProps {
  node: DriverNode;
  x: number;
  y: number;
  containerWidth: number;
  containerHeight: number;
}

const Tooltip: React.FC<TooltipProps> = ({
  node,
  x,
  y,
  containerWidth,
  containerHeight,
}) => {
  const IconComp = node.icon;
  const isInternal = node.ring === 'internal';

  const TOOLTIP_W = 260;
  const GAP = 28;

  const style: React.CSSProperties = {
    position: 'absolute',
    zIndex: 50,
    width: `${TOOLTIP_W}px`,
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '16px 20px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
    pointerEvents: 'none',
  };

  // Horizontal: place tooltip away from diagram center
  if (x < containerWidth / 2) {
    style.left = `${x + GAP}px`;
  } else {
    style.left = `${Math.max(8, x - TOOLTIP_W - GAP)}px`;
  }

  // Vertical: place tooltip away from diagram center
  if (y < containerHeight / 2) {
    style.top = `${y + GAP}px`;
  } else {
    style.bottom = `${Math.max(8, containerHeight - y + GAP)}px`;
  }

  return (
    <div style={style} role="tooltip">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <IconComp
          size={18}
          color={isInternal ? '#FFFFFF' : '#D4A843'}
          style={
            isInternal
              ? {
                  background: '#38B2AC',
                  borderRadius: '50%',
                  padding: '3px',
                  width: '24px',
                  height: '24px',
                }
              : undefined
          }
        />
        <span style={{ fontSize: '15px', fontWeight: 700, color: '#1A202C' }}>
          {node.label}
        </span>
      </div>
      <p
        style={{
          fontSize: '13px',
          fontWeight: 400,
          color: '#4A5568',
          lineHeight: 1.6,
          marginTop: '8px',
          marginBottom: 0,
        }}
      >
        {node.description}
      </p>
      <div style={{ marginTop: '12px' }}>
        <span
          style={{
            display: 'inline-block',
            fontSize: '11px',
            fontWeight: 600,
            borderRadius: '10px',
            padding: '3px 10px',
            ...(isInternal
              ? { background: '#E6FFFA', color: '#2C9A94' }
              : {
                  background: '#FFFDF0',
                  color: '#B8962E',
                  border: '1px solid #E8C547',
                }),
          }}
        >
          {isInternal ? 'Internal Driver' : 'External Driver'}
        </span>
      </div>
    </div>
  );
};

// ── Concentric Circles Diagram ───────────────────────────────────────
interface DiagramProps {
  isMobile: boolean;
  reducedMotion: boolean;
}

const ConcentricCircles: React.FC<DiagramProps> = ({
  isMobile,
  reducedMotion,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<{
    node: DriverNode;
    x: number;
    y: number;
  } | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [tappedNode, setTappedNode] = useState<string | null>(null);

  // Track container size for tooltip positioning
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Mobile tap-to-dismiss
  useEffect(() => {
    if (!isMobile || !tappedNode) return;
    const handleTap = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-driver-node]')) {
        setTappedNode(null);
        setHoveredNode(null);
        setIsPaused(false);
      }
    };
    document.addEventListener('click', handleTap);
    return () => document.removeEventListener('click', handleTap);
  }, [isMobile, tappedNode]);

  // Hover: get visual position via getBoundingClientRect
  const handleNodeHover = useCallback(
    (e: React.MouseEvent | React.FocusEvent, driver: DriverNode) => {
      const target = e.currentTarget as SVGGElement;
      const rect = target.getBoundingClientRect();
      const containerR = containerRef.current?.getBoundingClientRect();
      if (!containerR) return;
      setHoveredNode({
        node: driver,
        x: rect.left + rect.width / 2 - containerR.left,
        y: rect.top + rect.height / 2 - containerR.top,
      });
    },
    [],
  );

  // Mobile tap handler
  const handleNodeTap = useCallback(
    (e: React.MouseEvent, driver: DriverNode) => {
      if (!isMobile) return;
      if (tappedNode === driver.label) {
        setTappedNode(null);
        setHoveredNode(null);
        setIsPaused(false);
      } else {
        setTappedNode(driver.label);
        setIsPaused(true);
        const target = e.currentTarget as SVGGElement;
        const rect = target.getBoundingClientRect();
        const containerR = containerRef.current?.getBoundingClientRect();
        if (containerR) {
          setHoveredNode({
            node: driver,
            x: rect.left + rect.width / 2 - containerR.left,
            y: rect.top + rect.height / 2 - containerR.top,
          });
        }
      }
    },
    [isMobile, tappedNode],
  );

  return (
    <div
      ref={containerRef}
      className={isPaused ? 'hero-diagram-paused' : ''}
      style={{ position: 'relative', width: '100%', maxWidth: '680px' }}
      onMouseEnter={() => {
        if (!isMobile) setIsPaused(true);
      }}
      onMouseLeave={() => {
        if (!isMobile) {
          setIsPaused(false);
          setHoveredNode(null);
        }
      }}
    >
      <style>{ORBIT_STYLES}</style>

      <svg
        viewBox="0 0 700 700"
        role="img"
        aria-label="Interactive diagram showing AI transformation drivers. Inner ring: 6 internal drivers including Growth Mindset, Thinking Beyond, Collaboration, Sharing Learnings, Learning to Learn, and Curiosity. Outer ring: 6 external drivers including Personalized Pathways, Incentive Structures, Training Programs, Change Management, Communication, and Tools & Resources."
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E6FFFA" stopOpacity="1" />
            <stop offset="70%" stopColor="#E6FFFA" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#E6FFFA" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Inner ring fill tint */}
        <circle
          cx={CX}
          cy={CY}
          r={INNER_RADIUS}
          fill="rgba(56, 178, 172, 0.04)"
        />

        {/* Inner ring stroke */}
        <circle
          cx={CX}
          cy={CY}
          r={INNER_RADIUS}
          fill="none"
          stroke="#38B2AC"
          strokeWidth="2"
        />

        {/* Outer ring stroke (dashed yellow) */}
        <circle
          cx={CX}
          cy={CY}
          r={OUTER_RADIUS}
          fill="none"
          stroke="#E8C547"
          strokeWidth="1.5"
          strokeDasharray="8 6"
        />

        {/* Center glow */}
        <circle cx={CX} cy={CY} r={60} fill="url(#center-glow)" />

        {/* Center visual — nested department clusters */}
        <g>
          {/* Top cluster — 3 people (teal) */}
          {[-12, 0, 12].map((dx, i) => {
            const px = CX + dx;
            const py = CY - 26;
            return (
              <g key={`top-${i}`}>
                <circle cx={px} cy={py - 5} r={4.5} fill="#38B2AC" />
                <path
                  d={`M${px - 6},${py + 7} C${px - 6},${py + 2} ${px - 3},${py} ${px},${py} C${px + 3},${py} ${px + 6},${py + 2} ${px + 6},${py + 7} Z`}
                  fill="#38B2AC"
                  opacity="0.85"
                />
              </g>
            );
          })}
          {/* Bottom-left cluster — 2 people (darker teal) */}
          {[-6, 6].map((dx, i) => {
            const px = CX - 24 + dx;
            const py = CY + 16;
            return (
              <g key={`bl-${i}`}>
                <circle cx={px} cy={py - 5} r={4.5} fill="#2C9A94" />
                <path
                  d={`M${px - 6},${py + 7} C${px - 6},${py + 2} ${px - 3},${py} ${px},${py} C${px + 3},${py} ${px + 6},${py + 2} ${px + 6},${py + 7} Z`}
                  fill="#2C9A94"
                  opacity="0.85"
                />
              </g>
            );
          })}
          {/* Bottom-right cluster — 2 people (lighter teal) */}
          {[-6, 6].map((dx, i) => {
            const px = CX + 24 + dx;
            const py = CY + 16;
            return (
              <g key={`br-${i}`}>
                <circle cx={px} cy={py - 5} r={4.5} fill="#4FD1C5" />
                <path
                  d={`M${px - 6},${py + 7} C${px - 6},${py + 2} ${px - 3},${py} ${px},${py} C${px + 3},${py} ${px + 6},${py + 2} ${px + 6},${py + 7} Z`}
                  fill="#4FD1C5"
                  opacity="0.85"
                />
              </g>
            );
          })}
        </g>

        {/* "Your Organization" label */}
        <text
          x={CX}
          y={CY + 42}
          textAnchor="middle"
          style={{ fontSize: '12px', fontWeight: 600, fill: '#2C9A94' }}
        >
          Your Organization
        </text>

        {/* ── Rotating inner ring group — clockwise ── */}
        <g className="hero-inner-orbit">
          {/* Connecting lines from center to inner nodes */}
          {innerPositions.map((pos, i) => (
            <line
              key={`conn-inner-${i}`}
              x1={CX}
              y1={CY}
              x2={pos.x}
              y2={pos.y}
              stroke="#E2E8F0"
              strokeWidth="1"
              opacity="0.35"
            />
          ))}

          {/* Inner nodes with counter-rotation to stay upright */}
          {innerPositions.map((pos, i) => {
            const driver = innerDrivers[i];
            const IconComp = driver.icon;
            const isHovered = hoveredNode?.node.label === driver.label;

            return (
              <g
                key={`inner-${i}`}
                className="hero-inner-node-upright"
                style={{
                  transformOrigin: `${pos.x}px ${pos.y}px`,
                  cursor: 'pointer',
                  outline: 'none',
                }}
                data-driver-node
                tabIndex={0}
                role="button"
                aria-label={`${driver.label}: ${driver.description}`}
                onMouseEnter={(e) => {
                  if (!isMobile) handleNodeHover(e, driver);
                }}
                onMouseLeave={() => {
                  if (!isMobile) setHoveredNode(null);
                }}
                onFocus={(e) => handleNodeHover(e, driver)}
                onBlur={() => setHoveredNode(null)}
                onClick={(e) => handleNodeTap(e, driver)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setHoveredNode(null);
                }}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={NODE_SIZE / 2}
                  fill={isHovered ? '#4FD1C5' : '#38B2AC'}
                  style={{
                    transition: 'fill 200ms ease',
                    filter: isHovered
                      ? 'drop-shadow(0 0 4px rgba(56,178,172,0.3))'
                      : 'none',
                  }}
                />
                <foreignObject
                  x={pos.x - 11}
                  y={pos.y - 11}
                  width="22"
                  height="22"
                  style={{ pointerEvents: 'none' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '22px',
                      height: '22px',
                    }}
                  >
                    <IconComp size={17} color="#FFFFFF" strokeWidth={2.5} />
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </g>

        {/* ── Rotating outer ring group — counter-clockwise ── */}
        <g className="hero-outer-orbit">
          {/* Short outward lines from outer nodes */}
          {outerPositions.map((pos, i) => {
            const angle = toRad((i * 360) / 6 - 90 + 30);
            const endX = pos.x + 18 * Math.cos(angle);
            const endY = pos.y + 18 * Math.sin(angle);
            return (
              <line
                key={`conn-outer-${i}`}
                x1={pos.x}
                y1={pos.y}
                x2={endX}
                y2={endY}
                stroke="#E2E8F0"
                strokeWidth="1"
                opacity="0.25"
              />
            );
          })}

          {/* Outer nodes with counter-rotation to stay upright */}
          {outerPositions.map((pos, i) => {
            const driver = outerDrivers[i];
            const IconComp = driver.icon;
            const isHovered = hoveredNode?.node.label === driver.label;

            return (
              <g
                key={`outer-${i}`}
                className="hero-outer-node-upright"
                style={{
                  transformOrigin: `${pos.x}px ${pos.y}px`,
                  cursor: 'pointer',
                  outline: 'none',
                }}
                data-driver-node
                tabIndex={0}
                role="button"
                aria-label={`${driver.label}: ${driver.description}`}
                onMouseEnter={(e) => {
                  if (!isMobile) handleNodeHover(e, driver);
                }}
                onMouseLeave={() => {
                  if (!isMobile) setHoveredNode(null);
                }}
                onFocus={(e) => handleNodeHover(e, driver)}
                onBlur={() => setHoveredNode(null)}
                onClick={(e) => handleNodeTap(e, driver)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setHoveredNode(null);
                }}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={NODE_SIZE / 2}
                  fill={isHovered ? '#FFF8E1' : '#FFFFFF'}
                  stroke="#D4A843"
                  strokeWidth={isHovered ? 3 : 2}
                  style={{
                    transition: 'fill 200ms ease, stroke-width 200ms ease',
                    filter: isHovered
                      ? 'drop-shadow(0 0 4px rgba(212,168,67,0.25))'
                      : 'none',
                  }}
                />
                <foreignObject
                  x={pos.x - 11}
                  y={pos.y - 11}
                  width="22"
                  height="22"
                  style={{ pointerEvents: 'none' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '22px',
                      height: '22px',
                    }}
                  >
                    <IconComp size={17} color="#D4A843" strokeWidth={2.5} />
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Ring labels (HTML overlays — static, don't rotate) */}
      {/* "What Your People Bring" — above all rings, top center */}
      <div
        style={{
          position: 'absolute',
          top: '1%',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            fontSize: '11px',
            fontWeight: 600,
            color: '#38B2AC',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            background: '#E6FFFA',
            border: '1px solid #38B2AC',
            borderRadius: '12px',
            padding: '4px 10px',
            whiteSpace: 'nowrap',
          }}
        >
          What Your People Bring
        </span>
      </div>

      {/* "What We Provide" — below all rings, bottom center */}
      <div
        style={{
          position: 'absolute',
          bottom: '0%',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            fontSize: '11px',
            fontWeight: 600,
            color: '#B8962E',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            background: '#FFFDF0',
            border: '1px solid #E8C547',
            borderRadius: '12px',
            padding: '4px 10px',
            whiteSpace: 'nowrap',
          }}
        >
          What We Provide
        </span>
      </div>

      {/* Tooltip */}
      {hoveredNode && (
        <Tooltip
          node={hoveredNode.node}
          x={hoveredNode.x}
          y={hoveredNode.y}
          containerWidth={containerSize.width}
          containerHeight={containerSize.height}
        />
      )}
    </div>
  );
};

// ── Hero Component ───────────────────────────────────────────────────
export const Hero: React.FC = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768,
  );

  // Detect reduced motion
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Track mobile breakpoint
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <section id="hero" style={{ background: '#F7FAFC' }}>
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          className="flex flex-col md:flex-row items-center"
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%',
            padding: isMobile ? '100px 24px 48px' : '0 48px',
          }}
        >
          {/* Left column — Text (~40%) */}
          <div
            style={{
              width: isMobile ? '100%' : '40%',
              flexShrink: 0,
              paddingRight: isMobile ? 0 : '32px',
            }}
          >
            {/* Badge */}
            <div>
              <span
                className="inline-block uppercase tracking-widest"
                style={{
                  border: '1px solid #38B2AC',
                  color: '#38B2AC',
                  borderRadius: '20px',
                  padding: '6px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '1.5px',
                }}
              >
                OXYGY AI CENTER OF EXCELLENCE
              </span>
            </div>

            {/* Headline */}
            <h1
              style={{
                fontSize: isMobile ? '36px' : 'clamp(42px, 4vw, 52px)',
                fontWeight: 800,
                color: '#1A202C',
                lineHeight: 1.15,
                marginTop: '20px',
                maxWidth: '520px',
              }}
            >
              Your AI Transformation
              <br />
              Starts With
              <br />
              <span className="relative inline-block">
                Your People
                <span
                  className="absolute left-0 w-full"
                  style={{
                    bottom: '-4px',
                    height: '3px',
                    background: '#38B2AC',
                    borderRadius: '2px',
                  }}
                />
              </span>
              .
            </h1>

            {/* Subheading */}
            <p
              style={{
                fontSize: isMobile ? '15px' : '17px',
                fontWeight: 400,
                color: '#4A5568',
                lineHeight: 1.7,
                marginTop: '24px',
                maxWidth: '480px',
              }}
            >
              There is no one-size-fits-all model for AI adoption. It starts
              with your people discovering what works best for them — then
              aggregating those learnings into the processes, frameworks,
              and operating models that transform your entire organization.
            </p>

            {/* CTAs */}
            <div
              className={
                isMobile
                  ? 'flex flex-col gap-3 w-full'
                  : 'flex flex-row gap-4'
              }
              style={{ marginTop: '32px' }}
            >
              <a
                href="#journey"
                className="inline-flex items-center justify-center gap-2 transition-colors"
                style={{
                  background: '#38B2AC',
                  color: '#FFFFFF',
                  borderRadius: '28px',
                  padding: '14px 28px',
                  fontSize: '15px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = '#2C9A94')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = '#38B2AC')
                }
              >
                Start the Journey <ChevronRight size={16} />
              </a>
              <a
                href="#framework"
                className="inline-flex items-center justify-center transition-colors"
                style={{
                  background: 'transparent',
                  border: '1px solid #1A202C',
                  color: '#1A202C',
                  borderRadius: '28px',
                  padding: '14px 28px',
                  fontSize: '15px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1A202C';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#1A202C';
                }}
              >
                Explore the Framework
              </a>
            </div>
          </div>

          {/* Right column — Diagram (~60%) */}
          <div
            style={{
              width: isMobile ? '100%' : '60%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: isMobile ? '40px' : 0,
              maxWidth: isMobile ? '440px' : undefined,
              marginLeft: isMobile ? 'auto' : undefined,
              marginRight: isMobile ? 'auto' : undefined,
            }}
          >
            <ConcentricCircles
              isMobile={isMobile}
              reducedMotion={prefersReducedMotion}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
