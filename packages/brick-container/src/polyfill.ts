import "core-js/stable";
// Manually import some new polyfills since old babel doesn't support to load them automatically.
import "core-js/es/array/to-sorted";
import "core-js/es/array/to-reversed";
import "core-js/es/array/to-spliced";
import "regenerator-runtime/runtime";
import "./replaceChildren";
