/* eslint-disable react/jsx-key */
import React from "react";
import { uniqueId } from "lodash";
import { useCurrentTheme } from "../themeAndMode";

export interface EmptySvgProps {
  isBig?: boolean;
}

export function EmptySvg(props: EmptySvgProps): React.ReactElement {
  const { isBig } = props;
  const theme = useCurrentTheme();
  const prefix = uniqueId();
  const createNewId = (id: string): string => {
    return prefix + id;
  };

  if (theme === "dark-v2") {
    return isBig ? (
      <svg
        width="88px"
        height="83px"
        viewBox="0 0 88 83"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        <title>dark big empty image</title>
        <defs>
          <linearGradient
            x1="5.71824875%"
            y1="4.31113823%"
            x2="82.851613%"
            y2="88.6978534%"
            id={createNewId("inearGradient-1")}
          >
            <stop stopColor="#545454" offset="0%"></stop>
            <stop stopColor="#3B3B3B" offset="100%"></stop>
          </linearGradient>
          <linearGradient
            x1="3.89238729%"
            y1="4.31113823%"
            x2="84.2061777%"
            y2="88.6978534%"
            id={createNewId("inearGradient-2")}
          >
            <stop stopColor="#515151" offset="0%"></stop>
            <stop stopColor="#383838" offset="100%"></stop>
          </linearGradient>
          <path
            d="M34.9133489,37.0960187 L43.4004684,37.0960187 C45.6096074,37.0960187 47.4004684,38.8868797 47.4004684,41.0960187 L47.4004684,49.5831382 C47.4004684,51.7922772 45.6096074,53.5831382 43.4004684,53.5831382 L34.9133489,53.5831382 C32.7042099,53.5831382 30.9133489,51.7922772 30.9133489,49.5831382 L30.9133489,41.0960187 C30.9133489,38.8868797 32.7042099,37.0960187 34.9133489,37.0960187 Z"
            id={createNewId("path-3")}
          ></path>
          <filter
            x="-36.4%"
            y="-30.3%"
            width="184.9%"
            height="184.9%"
            filterUnits="objectBoundingBox"
            id={createNewId("path-4")}
          >
            <feOffset
              dx="1"
              dy="2"
              in="SourceAlpha"
              result="shadowOffsetOuter1"
            ></feOffset>
            <feGaussianBlur
              stdDeviation="2"
              in="shadowOffsetOuter1"
              result="shadowBlurOuter1"
            ></feGaussianBlur>
            <feComposite
              in="shadowBlurOuter1"
              in2="SourceAlpha"
              operator="out"
              result="shadowBlurOuter1"
            ></feComposite>
            <feColorMatrix
              values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.22 0"
              type="matrix"
              in="shadowBlurOuter1"
            ></feColorMatrix>
          </filter>
          <linearGradient
            x1="41.822656%"
            y1="24.7954546%"
            x2="8.8126561%"
            y2="86.4269134%"
            id={createNewId("linearGradient-5")}
          >
            <stop stopColor="#676767" offset="0%"></stop>
            <stop stopColor="#787878" offset="100%"></stop>
          </linearGradient>
          <path
            d="M60.9180328,19.5784543 C63.1271718,19.5784543 64.9180328,21.3693153 64.9180328,23.5784543 L64.9180328,31.2366083 L53.2598788,19.5784543 L60.9180328,19.5784543 Z"
            id={createNewId("path-6")}
          ></path>
          <filter
            x="-60.0%"
            y="-77.2%"
            width="220.1%"
            height="220.1%"
            filterUnits="objectBoundingBox"
            id={createNewId("filter-7")}
          >
            <feOffset
              dx="0"
              dy="-2"
              in="SourceAlpha"
              result="shadowOffsetOuter1"
            ></feOffset>
            <feGaussianBlur
              stdDeviation="2"
              in="shadowOffsetOuter1"
              result="shadowBlurOuter1"
            ></feGaussianBlur>
            <feColorMatrix
              values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.25 0"
              type="matrix"
              in="shadowBlurOuter1"
            ></feColorMatrix>
          </filter>
        </defs>
        <g
          id="其他"
          stroke="none"
          strokeWidth="1"
          fill="none"
          fillRule="evenodd"
        >
          <g id="空状态" transform="translate(-345.000000, -239.000000)">
            <g
              id="插图/空表格--白色背景备份-3"
              transform="translate(345.000000, 239.000000)"
            >
              <path
                d="M63.0027562,53.3770492 L16.3415061,53.3770492 C15.617696,53.3770492 14.9220071,53.6573421 14.4003686,54.1591332 L5.7704918,62.4606569 L5.7704918,62.4606569 L5.7704918,76.6295082 C5.7704918,79.7223028 8.2776972,82.2295082 11.3704918,82.2295082 L67.9737705,82.2295082 C71.0665651,82.2295082 73.5737705,79.7223028 73.5737705,76.6295082 L73.5737705,62.4606569 L73.5737705,62.4606569 L64.9438937,54.1591332 C64.4222552,53.6573421 63.7265663,53.3770492 63.0027562,53.3770492 Z"
                id="Fill-3"
                fill="#313131"
              ></path>
              <path
                d="M53.2598788,19.5784543 L64.9180328,31.2366083 L64.9180328,68.3007026 C64.9180328,69.8470999 63.6644301,71.1007026 62.1180328,71.1007026 L17.2262295,71.1007026 C15.6798322,71.1007026 14.4262295,69.8470999 14.4262295,68.3007026 L14.4262295,25.5784543 C14.4262295,22.2647458 17.112521,19.5784543 20.4262295,19.5784543 L53.2598788,19.5784543 Z"
                id="形状结合"
                fill={`url(#${createNewId("linearGradient-1")})`}
              ></path>
              <g id="矩形备份">
                <use
                  fill="black"
                  fillOpacity="1"
                  filter={`url(#${createNewId("filter-4")})`}
                  xlinkHref={`#${createNewId("path-3")}`}
                ></use>
                <path
                  stroke="#858585"
                  strokeWidth="1"
                  d="M43.4004684,37.5960187 C44.3669667,37.5960187 45.2419667,37.9877696 45.8753421,38.621145 C46.5087175,39.2545204 46.9004684,40.1295204 46.9004684,41.0960187 L46.9004684,41.0960187 L46.9004684,49.5831382 C46.9004684,50.5496365 46.5087175,51.4246365 45.8753421,52.0580119 C45.2419667,52.6913873 44.3669667,53.0831382 43.4004684,53.0831382 L43.4004684,53.0831382 L34.9133489,53.0831382 C33.9468506,53.0831382 33.0718506,52.6913873 32.4384752,52.0580119 C31.8050998,51.4246365 31.4133489,50.5496365 31.4133489,49.5831382 L31.4133489,49.5831382 L31.4133489,41.0960187 C31.4133489,40.1295204 31.8050998,39.2545204 32.4384752,38.621145 C33.0718506,37.9877696 33.9468506,37.5960187 34.9133489,37.5960187 L34.9133489,37.5960187 Z"
                  strokeLinejoin="round"
                  fill={`url(#${createNewId("linearGradient-2")})`}
                  fillRule="evenodd"
                ></path>
              </g>
              <g
                id="形状结合"
                transform="translate(59.088956, 25.407531) scale(-1, -1) translate(-59.088956, -25.407531) "
              >
                <use
                  fill="black"
                  fillOpacity="1"
                  filter={`url(#${createNewId("filter-7")})`}
                  xlinkHref={`#${createNewId("path-6")}`}
                ></use>
                <use
                  fill={`url(#${createNewId("linearGradient-5")})`}
                  fillRule="evenodd"
                  xlinkHref={`#${createNewId("path-6")}`}
                ></use>
              </g>
              <path
                d="M85.1360656,43.2786885 C85.5226649,43.2786885 85.8360656,43.5920892 85.8360656,43.9786885 L85.8355082,45.4416885 L87.3,45.442623 C87.6865993,45.442623 88,45.7560236 88,46.142623 L88,46.1852459 C88,46.5718452 87.6865993,46.8852459 87.3,46.8852459 L85.8355082,46.8846885 L85.8360656,48.3491803 C85.8360656,48.7357797 85.5226649,49.0491803 85.1360656,49.0491803 L85.0934426,49.0491803 C84.7068433,49.0491803 84.3934426,48.7357797 84.3934426,48.3491803 L84.3925082,46.8846885 L82.9295082,46.8852459 C82.5429089,46.8852459 82.2295082,46.5718452 82.2295082,46.1852459 L82.2295082,46.142623 C82.2295082,45.7560236 82.5429089,45.442623 82.9295082,45.442623 L84.3925082,45.4416885 L84.3934426,43.9786885 C84.3934426,43.5920892 84.7068433,43.2786885 85.0934426,43.2786885 L85.1360656,43.2786885 Z"
                id="形状结合"
                fill="#323233"
              ></path>
              <path
                d="M2.16393443,31.7377049 C2.46271142,31.7377049 2.70491803,31.9799115 2.70491803,32.2786885 L2.704,33.1797049 L3.62786885,33.1803279 C4.01446818,33.1803279 4.32786885,33.4937285 4.32786885,33.8803279 L4.32786885,33.9229508 C4.32786885,34.3095501 4.01446818,34.6229508 3.62786885,34.6229508 L2.704,34.6227049 L2.70491803,35.5245902 C2.70491803,35.8233672 2.46271142,36.0655738 2.16393443,36.0655738 C1.86515743,36.0655738 1.62295082,35.8233672 1.62295082,35.5245902 L1.622,34.6227049 L0.7,34.6229508 C0.313400675,34.6229508 1.58367065e-16,34.3095501 0,33.9229508 L0,33.8803279 C6.36775399e-17,33.4937285 0.313400675,33.1803279 0.7,33.1803279 L1.622,33.1797049 L1.62295082,32.2786885 C1.62295082,31.9799115 1.86515743,31.7377049 2.16393443,31.7377049 Z"
                id="形状结合备份-2"
                fill="#323233"
              ></path>
              <path
                d="M8.5704918,82.2292826 L8.39992361,82.2241726 C6.93295466,82.1360215 5.7704918,80.9184059 5.7704918,79.4292826 L5.7704918,79.4292826 L5.7704918,62.0328238 L18.5403984,62.0328238 L18.7183062,62.0265026 C22.6370926,61.9824786 26.9110314,68.1500392 38.9284814,68.4052546 L38.9284814,68.4052546 L38.9508197,68.402268 L38.9508197,68.4029405 L38.9731579,68.4054802 C50.1627105,68.6294222 54.4413911,62.3194865 59.130277,62.0416842 L59.3612409,62.0329405 L73.5737705,62.0329405 L73.5737705,79.4295082 C73.5737705,80.9186315 72.4113076,82.1362471 70.9443387,82.2243982 L70.7737705,82.2295082 L38.9508197,82.2289405 L8.5704918,82.2292826 Z"
                id="形状结合"
                fill="#555555"
              ></path>
              <path
                d="M21.6393443,3.45798016 C21.6393443,3.45798016 25.2647414,2.58521485 26.2931908,0 C27.7747015,2.12006603 28.538563,3.03684357 30.295082,3.43985748 C27.9033709,4.15239527 26.8645012,4.95266986 26.0462723,7.21311475 C25.1070761,4.54994361 24.2521493,4.20532501 21.6393443,3.45798016"
                id="Fill-1"
                fill="#323233"
              ></path>
              <path
                d="M64.9180328,10.4333714 C64.9180328,10.4333714 74.5857586,8.16418155 77.3282902,1.44262295 C81.2789854,6.95479463 83.3159494,9.33841623 88,10.3862524 C81.6221039,12.2388507 78.8517846,14.3195646 76.669841,20.1967213 C74.1653176,13.2724763 71.8855128,12.376468 64.9180328,10.4333714"
                id="Fill-1备份"
                fill="#424242"
                opacity="0.799999952"
              ></path>
            </g>
          </g>
        </g>
      </svg>
    ) : (
      <svg
        width="56px"
        height="53px"
        viewBox="0 0 56 53"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        <title>dark default empty image</title>
        <defs>
          <linearGradient
            x1="7.2497624%"
            y1="5.98667004%"
            x2="83.0501817%"
            y2="88.9150948%"
            id={createNewId("linearGradient-1")}
          >
            <stop stopColor="#595959" offset="0%"></stop>
            <stop stopColor="#484848" offset="100%"></stop>
          </linearGradient>
          <linearGradient
            x1="3.89238729%"
            y1="4.31113823%"
            x2="84.4129339%"
            y2="88.9150948%"
            id={createNewId("linearGradient-2")}
          >
            <stop stopColor="#646464" offset="0%"></stop>
            <stop stopColor="#4F4F4F" offset="100%"></stop>
          </linearGradient>
          <path
            d="M23.6721311,23.6065574 L26.1639344,23.6065574 C28.3730734,23.6065574 30.1639344,25.3974184 30.1639344,27.6065574 L30.1639344,30.0983607 C30.1639344,32.3074997 28.3730734,34.0983607 26.1639344,34.0983607 L23.6721311,34.0983607 C21.4629921,34.0983607 19.6721311,32.3074997 19.6721311,30.0983607 L19.6721311,27.6065574 C19.6721311,25.3974184 21.4629921,23.6065574 23.6721311,23.6065574 Z"
            id={createNewId("path-3")}
          ></path>
          <filter
            x="-57.2%"
            y="-47.7%"
            width="233.4%"
            height="233.4%"
            filterUnits="objectBoundingBox"
            id={createNewId("filter-4")}
          >
            <feOffset
              dx="1"
              dy="2"
              in="SourceAlpha"
              result="shadowOffsetOuter1"
            ></feOffset>
            <feGaussianBlur
              stdDeviation="2"
              in="shadowOffsetOuter1"
              result="shadowBlurOuter1"
            ></feGaussianBlur>
            <feComposite
              in="shadowBlurOuter1"
              in2="SourceAlpha"
              operator="out"
              result="shadowBlurOuter1"
            ></feComposite>
            <feColorMatrix
              values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.22 0"
              type="matrix"
              in="shadowBlurOuter1"
            ></feColorMatrix>
          </filter>
          <linearGradient
            x1="41.822656%"
            y1="24.7954546%"
            x2="8.8126561%"
            y2="86.4269134%"
            id={createNewId("linearGradient-5")}
          >
            <stop stopColor="#848484" offset="0%"></stop>
            <stop stopColor="#686868" offset="100%"></stop>
          </linearGradient>
          <path
            d="M37.3114754,12.4590164 C39.5206144,12.4590164 41.3114754,14.2498774 41.3114754,16.4590164 L41.3114754,19.8778416 L33.8926502,12.4590164 L37.3114754,12.4590164 Z"
            id={createNewId("path-6")}
          ></path>
          <filter
            x="-94.4%"
            y="-121.3%"
            width="288.7%"
            height="288.7%"
            filterUnits="objectBoundingBox"
            id={createNewId("filter-7")}
          >
            <feOffset
              dx="0"
              dy="-2"
              in="SourceAlpha"
              result="shadowOffsetOuter1"
            ></feOffset>
            <feGaussianBlur
              stdDeviation="2"
              in="shadowOffsetOuter1"
              result="shadowBlurOuter1"
            ></feGaussianBlur>
            <feColorMatrix
              values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.25 0"
              type="matrix"
              in="shadowBlurOuter1"
            ></feColorMatrix>
          </filter>
        </defs>
        <g
          id="其他"
          stroke="none"
          strokeWidth="1"
          fill="none"
          fillRule="evenodd"
        >
          <g id="空状态" transform="translate(-873.000000, -283.000000)">
            <g id="编组-8" transform="translate(726.000000, 100.000000)">
              <g
                id="插图/空表格--白色背景备份"
                transform="translate(147.000000, 183.000000)"
              >
                <path
                  d="M39.6824378,33.9672131 L10.8093655,33.9672131 C10.0855554,33.9672131 9.38986655,34.247506 8.86822799,34.7492971 L3.67213115,39.7476907 L3.67213115,39.7476907 L3.67213115,46.7278689 C3.67213115,49.8206635 6.17933655,52.3278689 9.27213115,52.3278689 L41.2196721,52.3278689 C44.3124667,52.3278689 46.8196721,49.8206635 46.8196721,46.7278689 L46.8196721,39.7476907 L46.8196721,39.7476907 L41.6235753,34.7492971 C41.1019367,34.247506 40.4062478,33.9672131 39.6824378,33.9672131 Z"
                  id={createNewId("Fill-3")}
                  fill="#3E3E3E"
                ></path>
                <path
                  d="M33.8926502,12.4590164 L41.3114754,19.8778416 L41.3114754,42.4459016 C41.3114754,43.9922989 40.0578727,45.2459016 38.5114754,45.2459016 L11.9803279,45.2459016 C10.4339306,45.2459016 9.18032787,43.9922989 9.18032787,42.4459016 L9.18032787,18.4590164 C9.18032787,15.1453079 11.8666194,12.4590164 15.1803279,12.4590164 L33.8926502,12.4590164 Z"
                  id="形状结合"
                  fill={`url(#${createNewId("linearGradient-1")})`}
                ></path>
                <g id="矩形备份">
                  <use
                    fill="black"
                    fillOpacity="1"
                    filter={`url(#${createNewId("filter-4")})`}
                    xlinkHref={`#${createNewId("path-3")}`}
                  ></use>
                  <path
                    stroke="#919191"
                    strokeWidth="1"
                    d="M26.1639344,24.1065574 C27.1304327,24.1065574 28.0054327,24.4983082 28.6388082,25.1316836 C29.2721836,25.7650591 29.6639344,26.6400591 29.6639344,27.6065574 L29.6639344,27.6065574 L29.6639344,30.0983607 C29.6639344,31.064859 29.2721836,31.939859 28.6388082,32.5732344 C28.0054327,33.2066098 27.1304327,33.5983607 26.1639344,33.5983607 L26.1639344,33.5983607 L23.6721311,33.5983607 C22.7056328,33.5983607 21.8306328,33.2066098 21.1972574,32.5732344 C20.563882,31.939859 20.1721311,31.064859 20.1721311,30.0983607 L20.1721311,30.0983607 L20.1721311,27.6065574 C20.1721311,26.6400591 20.563882,25.7650591 21.1972574,25.1316836 C21.8306328,24.4983082 22.7056328,24.1065574 23.6721311,24.1065574 L23.6721311,24.1065574 Z"
                    strokeLinejoin="round"
                    fill={`url(#${createNewId("linearGradient-2")})`}
                    fillRule="evenodd"
                  ></path>
                </g>
                <g
                  id="形状结合"
                  transform="translate(37.602063, 16.168429) scale(-1, -1) translate(-37.602063, -16.168429) "
                >
                  <use
                    fill="black"
                    fillOpacity="1"
                    filter={`url(#${createNewId("filter-7")})`}
                    xlinkHref={`#${createNewId("path-6")}`}
                  ></use>
                  <use
                    fill={`url(#${createNewId("linearGradient-5")})`}
                    fillRule="evenodd"
                    xlinkHref={`#${createNewId("path-6")}`}
                  ></use>
                </g>
                <path
                  d="M54.1639344,27.5409836 C54.4174422,27.5409836 54.6229508,27.7464922 54.6229508,28 L54.6228689,28.9179836 L55.5409836,28.9180328 C55.7944914,28.9180328 56,29.1235414 56,29.3770492 C56,29.6305569 55.7944914,29.8360656 55.5409836,29.8360656 L54.6228689,29.8359836 L54.6229508,30.7540984 C54.6229508,31.0076061 54.4174422,31.2131148 54.1639344,31.2131148 C53.9104267,31.2131148 53.704918,31.0076061 53.704918,30.7540984 L53.7048689,29.8359836 L52.7868852,29.8360656 C52.5333775,29.8360656 52.3278689,29.6305569 52.3278689,29.3770492 C52.3278689,29.1235414 52.5333775,28.9180328 52.7868852,28.9180328 L53.7048689,28.9179836 L53.704918,28 C53.704918,27.7464922 53.9104267,27.5409836 54.1639344,27.5409836 Z"
                  id="形状结合"
                  fill="#646465"
                  opacity="0.299999982"
                ></path>
                <path
                  d="M1.37704918,20.1967213 C1.56718,20.1967213 1.72131148,20.3508528 1.72131148,20.5409836 L1.721,21.1147213 L2.29508197,21.1147541 C2.54858972,21.1147541 2.75409836,21.3202627 2.75409836,21.5737705 C2.75409836,21.8272782 2.54858972,22.0327869 2.29508197,22.0327869 L1.721,22.0327213 L1.72131148,22.6065574 C1.72131148,22.7966882 1.56718,22.9508197 1.37704918,22.9508197 C1.18691836,22.9508197 1.03278689,22.7966882 1.03278689,22.6065574 L1.032,22.0327213 L0.459016393,22.0327869 C0.205508639,22.0327869 3.1045746e-17,21.8272782 0,21.5737705 C-3.1045746e-17,21.3202627 0.205508639,21.1147541 0.459016393,21.1147541 L1.032,21.1147213 L1.03278689,20.5409836 C1.03278689,20.3508528 1.18691836,20.1967213 1.37704918,20.1967213 Z"
                  id="形状结合备份-2"
                  fill="#646465"
                  opacity="0.299999982"
                ></path>
                <path
                  d="M24.7868852,43.5295076 L24.8011005,43.5307601 C31.8876782,43.6725873 34.6183834,39.6961587 37.5855745,39.48387 L37.7753351,39.4755076 L46.8196721,39.4755076 L46.8196721,49.5278689 C46.8196721,51.0169922 45.6572093,52.2346078 44.1902403,52.3227588 L44.0196721,52.3278689 L24.7868852,52.3275076 L24.7868852,52.3272615 L6.47213115,52.3277253 L6.30156296,52.3226152 C4.83459401,52.2344642 3.67213115,51.0168486 3.67213115,49.5277253 L3.67213115,49.5277253 L3.67213115,39.4754333 L11.7984354,39.4754333 L11.941603,39.4712638 C14.4272721,39.4747517 17.1558091,43.3688567 24.77267,43.5306166 L24.77267,43.5306166 L24.7868852,43.5292615 L24.7868852,43.5295076 Z"
                  id="形状结合"
                  fill="#616161"
                ></path>
                <path
                  d="M13.7704918,2.20053283 C13.7704918,2.20053283 16.0775627,1.64513672 16.7320305,0 C17.67481,1.34913293 18.1609037,1.93253682 19.2786885,2.18900021 C17.7566906,2.64243336 17.0955917,3.151699 16.5749006,4.59016393 C15.9772302,2.89541866 15.4331859,2.67611591 13.7704918,2.20053283"
                  id="Fill-1"
                  fill="#646465"
                  opacity="0.5"
                ></path>
                <path
                  d="M41.3114754,6.63941814 C41.3114754,6.63941814 47.4636646,5.19538826 49.2089119,0.918032787 C51.7229907,4.4257784 53.0192405,5.94262851 56,6.60943334 C51.9413388,7.78835951 50.1784084,9.11245019 48.7898988,12.852459 C47.1961112,8.44612131 45.7453263,7.87593416 41.3114754,6.63941814"
                  id="Fill-1备份"
                  fill="#646465"
                  opacity="0.697637649"
                ></path>
              </g>
            </g>
          </g>
        </g>
      </svg>
    );
  } else {
    return isBig ? (
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
}
