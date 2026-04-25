/**
 * Global loading UI — Next.js renders this instantly during navigation
 * while the next page (and its data) is being fetched. Replaces the
 * "blank flash" between routes that can feel like a full refresh.
 */
export default function Loading() {
  return (
    <div className="route-loading" aria-live="polite" aria-busy="true">
      <div className="route-loading__bar" />
      <span className="visually-hidden">Loading…</span>
      <style>{`
        .route-loading {
          position: fixed;
          inset: 0 0 auto 0;
          height: 3px;
          z-index: 9999;
          pointer-events: none;
          overflow: hidden;
          background: transparent;
        }
        .route-loading__bar {
          height: 100%;
          width: 40%;
          background: linear-gradient(90deg,#613A18 0%,#a26b3a 50%,#613A18 100%);
          animation: route-loading-slide 1.1s ease-in-out infinite;
        }
        @keyframes route-loading-slide {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(150%); }
          100% { transform: translateX(250%); }
        }
        .visually-hidden {
          position: absolute;
          width: 1px; height: 1px;
          padding: 0; margin: -1px;
          overflow: hidden; clip: rect(0,0,0,0);
          white-space: nowrap; border: 0;
        }
      `}</style>
    </div>
  );
}
