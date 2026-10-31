import MCR from "monocart-coverage-reports";
import { coverageOptions } from "./coverage.js";

// Clears the coverage of earlier runs, and returns the global teardown that writes the reports to coverage/
export default function coverageSetup() {
  MCR(coverageOptions).cleanCache();
  return async () => {
    await MCR(coverageOptions).generate();
  };
}
