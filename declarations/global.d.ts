declare module "*.css" {
  const css: string;
  export default css;
}

declare module "*.less" {
  const lessValue: string;
  export default lessValue;
}

interface SvgrComponent
  extends React.StatelessComponent<React.SVGAttributes<SVGElement>> {}

declare module "*.svg" {
  const svgValue: SvgrComponent;
  export default svgValue;
}

declare module "*.png" {
  const value: any;
  export = value;
}
