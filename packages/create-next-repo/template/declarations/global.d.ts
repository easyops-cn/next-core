declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "*.css" {
  const css: string;
  export default css;
}

declare module "*.less" {
  const lessValue: string;
  export default lessValue;
}

declare module "*.html" {
  const html: string;
  export default html;
}

declare module "*.md" {
  const content: string;
  export default content;
}

interface SvgrComponent
  extends React.StatelessComponent<React.SVGAttributes<SVGElement>> {}

declare module "*.svg" {
  const url: string;
  export default url;
  export const ReactComponent: SvgrComponent;
}

declare module "*.png" {
  const url: string;
  export default url;
}

declare namespace JSX {
  interface IntrinsicElements {
    slot: any;
  }
}

declare module "*.worker.ts" {
  class WebpackWorker extends Worker {
    constructor();
  }

  export default WebpackWorker;
}
