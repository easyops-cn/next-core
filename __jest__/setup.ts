import { configure } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

configure({ adapter: new Adapter() });

// Ref https://github.com/facebook/jest/issues/2157#issuecomment-279171856
(global as any).flushPromises = () =>
  new Promise(resolve => setImmediate(resolve));
