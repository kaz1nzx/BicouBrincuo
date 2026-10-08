"use client";

import { useRef, useState, type PointerEvent } from "react";
import { Pause, Play } from "lucide-react";

/** Original vector composition: the strings, beads and wood move as one toy. */
export function CraftScene({ compact = false }: { compact?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  function follow(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || paused) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    ref.current?.style.setProperty(
      "--lean",
      `${((event.clientX - bounds.left) / bounds.width - 0.5) * 8}deg`,
    );
  }
  function reset() {
    ref.current?.style.setProperty("--lean", "0deg");
  }
  return (
    <div
      ref={ref}
      className={`craft-scene ${compact ? "compact" : ""} ${paused ? "paused" : ""}`}
      onPointerMove={follow}
      onPointerLeave={reset}
    >
      <div className="scene-caption" aria-hidden="true">
        <span>ESTUDO Nº 01</span>
        <span>MADEIRA + CORDA</span>
      </div>
      <div className="scene-orbit" aria-hidden="true" />
      <div
        className="scene-toys"
        role="img"
        aria-label="Ilustração de brinquedos artesanais suspensos: balanço com uma ave e um móbile de madeira e contas coloridas"
      >
        <div className="pendant pendant-mobile">
          <svg viewBox="0 0 200 430" fill="none" aria-hidden="true">
            <path
              d="M100 0V105M100 85L42 140V305M100 85l58 55v165M100 105v273"
              stroke="#a78048"
              strokeWidth="5"
              strokeDasharray="2 3"
            />
            <path
              d="M87 28a13 13 0 1 0 26 0a13 13 0 1 0-26 0"
              stroke="#355746"
              strokeWidth="5"
            />
            {[145, 210, 275].map((y) => (
              <g key={y}>
                <rect
                  x="13"
                  y={y}
                  width="59"
                  height="22"
                  rx="3"
                  fill="#b76d3e"
                />
                <path
                  d={`M19 ${y + 8}h44M24 ${y + 15}h28`}
                  stroke="#e4ab70"
                  strokeWidth="2"
                />
                <circle
                  cx="42"
                  cy={y + 43}
                  r="11"
                  fill={y === 210 ? "#d8b746" : "#315a47"}
                />
              </g>
            ))}
            {[130, 202, 274, 346].map((y) => (
              <g key={y}>
                <rect
                  x="70"
                  y={y}
                  width="60"
                  height="25"
                  rx="3"
                  fill="#d4a66e"
                />
                <path
                  d={`M77 ${y + 9}h42M87 ${y + 18}h30`}
                  stroke="#a57543"
                  strokeWidth="2"
                />
                <circle
                  cx="100"
                  cy={y + 46}
                  r="12"
                  fill={y === 202 ? "#315a47" : "#bc5139"}
                />
              </g>
            ))}
            {[145, 210, 275].map((y) => (
              <g key={y}>
                <rect
                  x="129"
                  y={y}
                  width="59"
                  height="22"
                  rx="3"
                  fill="#b76d3e"
                />
                <path
                  d={`M135 ${y + 8}h44M140 ${y + 15}h28`}
                  stroke="#e4ab70"
                  strokeWidth="2"
                />
                <circle
                  cx="158"
                  cy={y + 43}
                  r="11"
                  fill={y === 210 ? "#bc5139" : "#d8b746"}
                />
              </g>
            ))}
            <path
              d="M100 393l-13 25m13-25v30m0-30l13 25"
              stroke="#a78048"
              strokeWidth="4"
            />
          </svg>
        </div>
        <div className="pendant pendant-swing">
          <svg viewBox="0 0 300 440" fill="none" aria-hidden="true">
            <path
              d="M150 0v35M150 35C55 97 49 233 54 344M150 35c95 62 101 198 96 309"
              stroke="#c0a174"
              strokeWidth="8"
            />
            <path
              d="M150 35C55 97 49 233 54 344M150 35c95 62 101 198 96 309"
              stroke="#f1d7ad"
              strokeWidth="2"
              strokeDasharray="3 6"
            />
            <circle cx="73" cy="141" r="17" fill="#bf543b" />
            <circle cx="62" cy="184" r="14" fill="#d9b348" />
            <circle cx="58" cy="225" r="16" fill="#315a47" />
            <circle cx="227" cy="141" r="17" fill="#315a47" />
            <circle cx="238" cy="184" r="14" fill="#d9b348" />
            <circle cx="242" cy="225" r="16" fill="#bf543b" />
            <rect
              x="34"
              y="335"
              width="232"
              height="27"
              rx="9"
              fill="#ad7242"
            />
            <path d="M45 343h206M64 352h131" stroke="#dfab73" strokeWidth="2" />
            <path
              d="M144 313l-4 24m30-24l6 24"
              stroke="#433e2c"
              strokeWidth="4"
            />
            <path
              d="M130 318c-32-20-34-77-10-105c8-10 13-27 30-32c28-9 51 12 49 40c-1 16-9 29-14 45c-5 18-2 43-24 52z"
              fill="#315a47"
            />
            <path
              d="M126 237c-22 23-15 59 5 73c21-11 27-38 23-65z"
              fill="#d8b746"
            />
            <path d="M137 317l-25 60l36-33l12-23" fill="#315a47" />
            <path d="M185 205l28 13l-25 13" fill="#d69a52" />
            <circle cx="173" cy="202" r="4" fill="#f7f0de" />
            <circle cx="174" cy="202" r="2" fill="#24392e" />
            <path
              d="M137 180l4-17m6 14l7-16"
              stroke="#315a47"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M53 362l-7 32m10-32v35m188-35l7 32m-11-32v35"
              stroke="#c0a174"
              strokeWidth="4"
            />
          </svg>
        </div>
      </div>
      <span className="scene-stamp" aria-hidden="true">
        BICOU
        <br />
        <i>&</i>
        <br />
        BRINCOU
      </span>
      {!compact ? (
        <span className="scene-footnote">
          Um convite para
          <br />
          <em>brincar de ser ave.</em>
        </span>
      ) : null}
      <button
        className="scene-pause"
        onClick={() => {
          reset();
          setPaused(!paused);
        }}
        aria-label={
          paused
            ? "Retomar movimento da ilustração"
            : "Pausar movimento da ilustração"
        }
      >
        {paused ? <Play size={14} /> : <Pause size={14} />}
      </button>
    </div>
  );
}
