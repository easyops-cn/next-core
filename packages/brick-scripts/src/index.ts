import { create } from "./main";

// istanbul ignore next (nothing logic)
create().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
