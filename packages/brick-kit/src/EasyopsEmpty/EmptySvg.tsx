import { Empty } from "antd";
import React from "react";
import { uniqueId } from "lodash";

export interface EmptySvgProps {
  isBig?: boolean;
}

export function EmptySvg(props: EmptySvgProps): React.ReactElement {
  const prefix = uniqueId();
  const createNewId = (id: string): string => {
    return prefix + id;
  };
  return props.isBig ? (
    <svg
      width={86}
      height={80}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <defs>
        <linearGradient
          x1="5.718%"
          y1="4.311%"
          x2="83.05%"
          y2="88.915%"
          id={createNewId("a")}
        >
          <stop stopColor="#D4D8E4" offset="0%" />
          <stop stopColor="#A9B0C4" offset="100%" />
        </linearGradient>
        <linearGradient
          x1="0%"
          y1="11.08%"
          x2="80.548%"
          y2="107.704%"
          id={createNewId("d")}
        >
          <stop stopColor="#C2C7DA" offset="0%" />
          <stop stopColor="#8F96B3" offset="100%" />
        </linearGradient>
        <linearGradient
          x1="41.823%"
          y1="24.795%"
          x2="8.813%"
          y2="86.427%"
          id={createNewId("g")}
        >
          <stop stopColor="#CCD0DD" offset="0%" />
          <stop stopColor="#9DA3B9" offset="100%" />
        </linearGradient>
        <filter
          x="-37.5%"
          y="-31.3%"
          width="187.5%"
          height="187.5%"
          filterUnits="objectBoundingBox"
          id={createNewId("b")}
        >
          <feOffset
            dx={1}
            dy={2}
            in="SourceAlpha"
            result="shadowOffsetOuter1"
          />
          <feGaussianBlur
            stdDeviation={2}
            in="shadowOffsetOuter1"
            result="shadowBlurOuter1"
          />
          <feComposite
            in="shadowBlurOuter1"
            in2="SourceAlpha"
            operator="out"
            result="shadowBlurOuter1"
          />
          <feColorMatrix
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.22 0"
            in="shadowBlurOuter1"
          />
        </filter>
        <filter
          x="-61.9%"
          y="-79.5%"
          width="223.7%"
          height="223.7%"
          filterUnits="objectBoundingBox"
          id={createNewId("e")}
        >
          <feOffset dy={-2} in="SourceAlpha" result="shadowOffsetOuter1" />
          <feGaussianBlur
            stdDeviation={2}
            in="shadowOffsetOuter1"
            result="shadowBlurOuter1"
          />
          <feColorMatrix
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
            in="shadowBlurOuter1"
          />
        </filter>
        <path
          d="M34 36h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4v-8a4 4 0 0 1 4-4Z"
          id={createNewId("c")}
        />
        <path
          d="M59 19a4 4 0 0 1 4 4v7.314L51.686 19H59Z"
          id={createNewId("f")}
        />
      </defs>
      <g fill="none" fillRule="evenodd">
        <path
          d="M61.108 51.8H15.892a2.8 2.8 0 0 0-1.941.782L5.6 60.615V74.2a5.6 5.6 0 0 0 5.6 5.6h54.6a5.6 5.6 0 0 0 5.6-5.6V60.615l-8.35-8.033a2.8 2.8 0 0 0-1.942-.782Z"
          fill="#A6AAC3"
        />
        <path
          d="M51.686 19 63 30.314V66.2a2.8 2.8 0 0 1-2.8 2.8H16.8a2.8 2.8 0 0 1-2.8-2.8V25a6 6 0 0 1 6-6h31.686Z"
          fill={`url(#${createNewId("a")})`}
        />
        <g>
          <use
            fill="#000"
            filter={`url(#${createNewId("b")})`}
            xlinkHref={`#${createNewId("c")}`}
          />
          <path
            stroke="#FFF"
            d="M42 36.5c.966 0 1.841.392 2.475 1.025A3.489 3.489 0 0 1 45.5 40v8c0 .966-.392 1.841-1.025 2.475A3.489 3.489 0 0 1 42 51.5h-8a3.489 3.489 0 0 1-2.475-1.025A3.489 3.489 0 0 1 30.5 48v-8c0-.966.392-1.841 1.025-2.475A3.489 3.489 0 0 1 34 36.5Z"
            strokeLinejoin="round"
            fill={`url(#${createNewId("d")})`}
          />
        </g>
        <g transform="rotate(180 57.343 24.657)">
          <use
            fill="#000"
            filter={`url(#${createNewId("e")})`}
            xlinkHref={`#${createNewId("f")}`}
          />
          <use
            fill={`url(#${createNewId("g")})`}
            xlinkHref={`#${createNewId("f")}`}
          />
        </g>
        <path
          d="M82.6 42a.7.7 0 0 1 .7.7v1.399l1.4.001a.7.7 0 0 1 0 1.4l-1.4-.001V46.9a.7.7 0 0 1-1.4 0v-1.401l-1.4.001a.7.7 0 0 1 0-1.4l1.4-.001V42.7a.7.7 0 0 1 .7-.7ZM2.1 30.8c.29 0 .525.235.525.525l-.001.874.876.001a.7.7 0 0 1 0 1.4h-.876l.001.875a.525.525 0 1 1-1.05 0l-.001-.875H.7a.7.7 0 0 1 0-1.4l.874-.001.001-.874c0-.29.235-.525.525-.525Z"
          fill="#D6D8E4"
          opacity={0.3}
        />
        <path
          d="m8.4 79.8-.17-.005A2.8 2.8 0 0 1 5.6 77V60.2h12.393l.175-.006c3.802-.04 7.95 5.943 19.61 6.19l.022-.002.022.002c10.856.218 15.009-5.902 19.558-6.175l.227-.009H71.4V77a2.8 2.8 0 0 1-2.63 2.795l-.17.005H8.4Z"
          fill="#D6D8E4"
        />
        <path
          d="M21 3.356S24.518 2.509 25.516 0c1.438 2.057 2.18 2.947 3.884 3.338-2.321.692-3.33 1.468-4.123 3.662-.912-2.584-1.741-2.919-4.277-3.644"
          fill="#D6D8E4"
          opacity={0.5}
        />
        <path
          d="M63 10.125S72.382 7.923 75.044 1.4c3.834 5.35 5.81 7.663 10.356 8.68-6.19 1.797-8.878 3.816-10.995 9.52-2.43-6.72-4.643-7.59-11.405-9.475"
          fill="#D6D8E4"
          opacity={0.8}
        />
      </g>
    </svg>
  ) : (
    <svg
      width={56}
      height={53}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <defs>
        <linearGradient
          x1="5.718%"
          y1="4.311%"
          x2="83.05%"
          y2="88.915%"
          id={createNewId("a")}
        >
          <stop stopColor="#D4D8E4" offset="0%" />
          <stop stopColor="#A9B0C4" offset="100%" />
        </linearGradient>
        <linearGradient
          x1="0%"
          y1="11.08%"
          x2="80.548%"
          y2="107.704%"
          id={createNewId("d")}
        >
          <stop stopColor="#C2C7DA" offset="0%" />
          <stop stopColor="#8F96B3" offset="100%" />
        </linearGradient>
        <linearGradient
          x1="41.823%"
          y1="24.795%"
          x2="8.813%"
          y2="86.427%"
          id={createNewId("g")}
        >
          <stop stopColor="#CCD0DD" offset="0%" />
          <stop stopColor="#9DA3B9" offset="100%" />
        </linearGradient>
        <filter
          x="-57.2%"
          y="-47.7%"
          width="233.4%"
          height="233.4%"
          filterUnits="objectBoundingBox"
          id={createNewId("b")}
        >
          <feOffset
            dx={1}
            dy={2}
            in="SourceAlpha"
            result="shadowOffsetOuter1"
          />
          <feGaussianBlur
            stdDeviation={2}
            in="shadowOffsetOuter1"
            result="shadowBlurOuter1"
          />
          <feComposite
            in="shadowBlurOuter1"
            in2="SourceAlpha"
            operator="out"
            result="shadowBlurOuter1"
          />
          <feColorMatrix
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.22 0"
            in="shadowBlurOuter1"
          />
        </filter>
        <filter
          x="-94.4%"
          y="-121.3%"
          width="288.7%"
          height="288.7%"
          filterUnits="objectBoundingBox"
          id={createNewId("e")}
        >
          <feOffset dy={-2} in="SourceAlpha" result="shadowOffsetOuter1" />
          <feGaussianBlur
            stdDeviation={2}
            in="shadowOffsetOuter1"
            result="shadowBlurOuter1"
          />
          <feColorMatrix
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
            in="shadowBlurOuter1"
          />
        </filter>
        <path
          d="M23.672 23.607h2.492a4 4 0 0 1 4 4v2.491a4 4 0 0 1-4 4h-2.492a4 4 0 0 1-4-4v-2.491a4 4 0 0 1 4-4Z"
          id={createNewId("c")}
        />
        <path
          d="M37.311 12.459a4 4 0 0 1 4 4v3.419l-7.418-7.419h3.418Z"
          id={createNewId("f")}
        />
      </defs>
      <g fill="none" fillRule="evenodd">
        <path
          d="M39.682 33.967H10.81a2.8 2.8 0 0 0-1.94.782l-5.197 4.999v6.98a5.6 5.6 0 0 0 5.6 5.6H41.22a5.6 5.6 0 0 0 5.6-5.6v-6.98l-5.196-4.999a2.8 2.8 0 0 0-1.942-.782Z"
          fill="#A6AAC3"
        />
        <path
          d="m33.893 12.459 7.418 7.419v22.568a2.8 2.8 0 0 1-2.8 2.8h-26.53a2.8 2.8 0 0 1-2.8-2.8V18.459a6 6 0 0 1 6-6h18.712Z"
          fill={`url(#${createNewId("a")})`}
        />
        <g>
          <use
            fill="#000"
            filter={`url(#${createNewId("b")})`}
            xlinkHref={`#${createNewId("c")}`}
          />
          <path
            stroke="#FFF"
            d="M26.164 24.107c.966 0 1.841.391 2.475 1.025a3.489 3.489 0 0 1 1.025 2.475v2.491c0 .967-.392 1.842-1.025 2.475a3.489 3.489 0 0 1-2.475 1.025h-2.492a3.489 3.489 0 0 1-2.475-1.025 3.489 3.489 0 0 1-1.025-2.475v-2.491c0-.967.392-1.842 1.025-2.475a3.489 3.489 0 0 1 2.475-1.025Z"
            strokeLinejoin="round"
            fill="url(#d)"
          />
        </g>
        <g transform="rotate(180 37.602 16.168)">
          <use
            fill="#000"
            filter={`url(#${createNewId("e")})`}
            xlinkHref={`#${createNewId("f")}`}
          />
          <use
            fill={`url(#${createNewId("g")})`}
            xlinkHref={`#${createNewId("f")}`}
          />
        </g>
        <path
          d="M54.164 27.541c.253 0 .459.205.459.459v.918h.918a.459.459 0 1 1 0 .918h-.918v.918a.459.459 0 0 1-.918 0v-.918h-.918a.459.459 0 0 1 0-.918h.918V28c0-.254.205-.459.459-.459ZM1.377 20.197c.19 0 .344.154.344.344v.574h.574a.459.459 0 1 1 0 .918h-.574v.574a.344.344 0 0 1-.688 0l-.001-.574H.459a.459.459 0 0 1 0-.918h.573v-.574c0-.19.155-.344.345-.344Z"
          fill="#D6D8E4"
          opacity={0.3}
        />
        <path
          d="M24.787 43.53h.014c7.087.143 9.817-3.834 12.785-4.046l.19-.008h9.044v10.052a2.8 2.8 0 0 1-2.63 2.795l-.17.005H6.472l-.17-.005a2.8 2.8 0 0 1-2.63-2.795V39.475h8.126l.144-.004c2.485.004 5.214 3.898 12.83 4.06l.015-.002Z"
          fill="#D6D8E4"
        />
        <path
          d="M13.77 2.2s2.308-.555 2.962-2.2c.943 1.35 1.429 1.933 2.547 2.189-1.522.453-2.183.963-2.704 2.401-.598-1.695-1.142-1.914-2.805-2.39"
          fill="#D6D8E4"
          opacity={0.5}
        />
        <path
          d="M41.311 6.64S47.464 5.194 49.21.917c2.514 3.508 3.81 5.025 6.791 5.691-4.059 1.18-5.822 2.503-7.21 6.243-1.594-4.406-3.045-4.976-7.479-6.213"
          fill="#D6D8E4"
          opacity={0.8}
        />
      </g>
    </svg>
  );
}
