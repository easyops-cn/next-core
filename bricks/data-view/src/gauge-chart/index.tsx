import React, { useMemo, useState } from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";

const { defineElement, property } = createDecorators();

interface GaugeChartProps {
  value: number;
  radius: number;
}
/**
 * @id data-view.gauge-chart
 * @name data-view.gauge-chart
 * @docKind brick
 * @description 大屏仪表盘
 * @author astrid
 * @noInheritDoc
 */
@defineElement("data-view.gauge-chart")
class GaugeChart extends ReactNextElement implements GaugeChartProps {
  /**
   * @default -
   * @required false
   * @description 仪表盘半径
   */
  @property({ type: Number })
  accessor radius: number;

  /**
   * @default -
   * @required false
   * @description 值
   */
  @property({ type: Number })
  accessor value: number;
  render() {
    return <GaugeChartComponent value={this.value} radius={this.radius} />;
  }
}

function GaugeChartComponent(props: GaugeChartProps): React.ReactElement {
  const { value, radius } = props;
  // const radius = (chartWidth - 36)/2 ; // 半径
  const [x, setX] = useState<number>(-radius);
  const [y, setY] = useState<number>(0);
  function calculateXy(deg: number, r: number): { x: number; y: number } {
    if (deg === 0) {
      return { x: r, y: 0 };
    }
    if (deg === 180) {
      return { x: -r, y: 0 };
    }
    const tanQ = Math.tan((2 * Math.PI * deg) / 360), // 倾斜角度的正切值
      y = Math.abs(Math.sqrt(1 / (tanQ * tanQ + 1)) * r * tanQ), // y始终大于0，所以取绝对值。
      x = y / tanQ;
    return { x, y };
  }

  const path = useMemo(() => {
    const max = 100, // 总分
      angle = 180 - (value * 180) / max; // 角度
    let initAngle = 180;

    // 添加动效
    const timer = window.setInterval(() => {
      if (initAngle <= angle) {
        window.clearInterval(timer);
      }
      const location = calculateXy(initAngle, radius);
      setX(location.x);
      setY(location.y);
      initAngle -= 1;
    }, 10);

    let _path = "";
    for (let i = 0; i < 25; i++) {
      const deg = i * (180 / 24),
        // 整个半径是 124
        // 刻度线外端：弧形半径为100
        // 刻度线内端：长线弧形半径为88，长线弧形半径为80
        r = i % 4 === 0 ? radius - 40 : radius - 36;
      const location1 = calculateXy(deg, radius - 24); // 刻度线外端：弧形半径为100
      const location2 = calculateXy(deg, r);
      _path += `M${location1.x} ${-location1.y} L${
        location2.x
      } ${-location2.y} `;
    }
    return _path;
  }, [value, radius]);

  return (
    <div>
      <svg
        width={`${radius * 2}px`}
        height={`${(radius * 2) / 1.4}px`}
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 420 300"
      >
        <defs>
          <linearGradient id="strokeGradient">
            <stop offset="0%" stopColor="#025FD9" />
            <stop offset="100%" stopColor="#46E0DB" />
          </linearGradient>
          <linearGradient id="strokeGradient1">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="50%" stopColor="#BCE2E8" />
            <stop offset="100%" stopColor="#D6EEF2" />
          </linearGradient>
        </defs>
        {/* 底部进度 */}
        <path
          transform="translate(210, 158)"
          d={`M-${radius} 0 A ${radius} ${radius}, 0, 0, 1, ${radius} 0`}
          strokeWidth="18"
          stroke="url(#strokeGradient1)"
          fill="transparent"
        />
        {/* 值 */}
        <path
          transform="translate(210, 158)"
          d={`M-${radius} 0 A ${radius} ${radius}, 0, 0, 1, ${x} ${-y}`}
          strokeWidth="18"
          stroke="url(#strokeGradient)"
          fill="transparent"
        />
        {/* 进度的圈 */}
        <circle
          transform="translate(210, 158)"
          fill="#fff"
          cx={x}
          cy={-y}
          r="12"
        />
        <circle
          transform="translate(210, 158)"
          fill="#46E0DB"
          cx={x}
          cy={-y}
          r="4"
        />
        {/* 内部刻度的 */}
        <path transform="translate(210, 158)" d={path} stroke="#98E1DE" />
      </svg>
      <slot />
    </div>
  );
}

export { GaugeChart };
