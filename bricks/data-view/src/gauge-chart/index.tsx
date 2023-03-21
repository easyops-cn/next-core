import React, { useMemo, useState } from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import variablesStyleText from "../data-view-variables.shadow.css";
import styleText from "./gauge-chart.shadow.css";
const { defineElement, property } = createDecorators();
interface GaugeChartProps {
  value: number;
  radius: number;
  strokeWidth?: number;
  description?: string | undefined;
  fontSize?: number;
}
/**
 * @id data-view.gauge-chart
 * @name data-view.gauge-chart
 * @docKind brick
 * @description 大屏仪表盘
 * @author astrid
 * @noInheritDoc
 */
@defineElement("data-view.gauge-chart", {
  styleTexts: [variablesStyleText, styleText],
})
class GaugeChart extends ReactNextElement implements GaugeChartProps {
  /**
   * @default -
   * @required false
   * @description 仪表盘半径
   */
  @property({ type: Number })
  accessor radius: number;

  /**
   * @default 20
   * @required false
   * @description 仪表盘的圆弧的宽度设置，这边会通过此变量去计算值终点圆点的大小;
   */
  @property({ type: Number })
  accessor strokeWidth: number;
  /**
   * @default -
   * @required false
   * @description 描述
   */
  @property()
  accessor description: string | undefined;

  /**
   * @default -
   * @required false
   * @description 值, 范围在[0-100]
   */
  @property({ type: Number })
  accessor value: number;

  /**
   * @default 35
   * @required false
   * @description 值的字体大小，默认35
   */
  @property({ type: Number })
  accessor fontSize: number;

  render() {
    return (
      <GaugeChartComponent
        value={this.value}
        radius={this.radius}
        strokeWidth={this.strokeWidth}
        description={this.description}
        fontSize={this.fontSize}
      />
    );
  }
}

function GaugeChartComponent(props: GaugeChartProps): React.ReactElement {
  const { value, radius, strokeWidth = 20, description, fontSize } = props;
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
    for (let i = 0; i < 8; i++) {
      const deg = i * (180 / 7);
      const location1 = calculateXy(deg, radius + 24); // 刻度线外端
      const location2 = calculateXy(deg, radius + 30); // 刻度线外端
      _path += `M${location1.x} ${-location1.y} L${
        location2.x
      } ${-location2.y} `;
    }
    return _path;
  }, [value, radius]);
  const transform = useMemo(() => {
    //例如半径为 150， 那么最外围的刻度线就是180,  求最小高度和宽度 width、height
    const width = (radius + 30) * 2;
    const height = radius + 30;
    return {
      x: width / 2,
      y: radius + 30,
      height,
      width,
    };
  }, [radius]);
  const innerStrokeRadius = radius - strokeWidth / 2;
  return (
    <div className="gaugeChartWrapper">
      <svg
        width={`${transform.width}px`}
        height={`${transform.height}px`}
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${transform.width} ${transform.height}`}
      >
        <defs>
          <linearGradient id="strokeGradient">
            <stop offset="0%" stopColor="var(--color-brand)" />
            <stop offset="100%" stopColor="var(--color-contrast-1)" />
          </linearGradient>
          <linearGradient id="wordGradient">
            <stop offset="0%" stopColor="#FFCF02" />
            <stop offset="100%" stopColor="#FF7352" />
          </linearGradient>
          <linearGradient id="innerStrokeGradient">
            <stop offset="0%" stopColor="var(--color-normal-text)" />
            <stop offset="100%" stopColor="rgb(var(--white-1-channel), 0%)" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="1" stdDeviation="4" floodColor="#2863ee" />
          </filter>
        </defs>
        {/* 底部进度 */}
        <path
          transform={`translate(${transform.x}, ${transform.y})`}
          d={`M-${radius} 0 A ${radius} ${radius}, 0, 0, 1, ${radius} 0`}
          strokeWidth={strokeWidth}
          stroke="var(--color-fill-bg-base-4)"
          fill="transparent"
        />
        {/* 底部进度白边 */}
        <path
          transform={`translate(${transform.x}, ${transform.y})`}
          d={`M-${innerStrokeRadius} 0 A ${innerStrokeRadius} ${innerStrokeRadius}, 0, 0, 1, ${innerStrokeRadius} 0`}
          strokeWidth="1.5"
          stroke="url(#innerStrokeGradient)"
          fill="transparent"
        />
        {/* 值 */}
        <path
          transform={`translate(${transform.x}, ${transform.y})`}
          d={`M-${radius} 0 A ${radius} ${radius}, 0, 0, 1, ${x} ${-y}`}
          strokeWidth={strokeWidth}
          stroke="url(#strokeGradient)"
          fill="transparent"
        />
        {/* 进度的圈 两个圆点比例大小 3:1 */}
        <circle
          transform={`translate(${transform.x}, ${transform.y})`}
          fill="#fff"
          cx={x}
          cy={-y}
          r={Math.round(strokeWidth + 4) / 2}
        />
        <circle
          transform={`translate(${transform.x}, ${transform.y})`}
          fill="#46E0DB"
          cx={x}
          cy={-y}
          r={Math.round(strokeWidth + 4) / 6}
        />
        {/* 内部刻度的 */}
        <path
          transform={`translate(${transform.x}, ${transform.y})`}
          d={path}
          stroke="#74757A"
        />
        {/* 值的文字展示 */}
        <text
          x="0"
          y="-30"
          transform={`translate(${transform.x}, ${transform.y})`}
          fontSize={fontSize ?? "var(--overview-data-font-size)"}
          textAnchor="middle"
          fontWeight="var(--font-weight-600)"
          fill="var(--color-normal-text)"
          filter="url(#shadow)"
        >
          {`${value}%`}
        </text>
        {/* 描述展示 */}
        <text
          x="0"
          y="-1"
          transform={`translate(${transform.x}, ${transform.y})`}
          fontSize="var(--normal-data-font-size)"
          textAnchor="middle"
          fill="var(--color-secondary-text)"
          opacity="0.55"
        >
          {description}
        </text>
      </svg>
      <slot />
    </div>
  );
}

export { GaugeChart };
