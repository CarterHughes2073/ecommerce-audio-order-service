import assert from "node:assert/strict";
import { localDecision } from "../src/order_service.js";

const result = localDecision("Payment went through for my basket");
assert.deepEqual(result, { status: "paid", message: "Payment confirmed; send the receipt." });
console.log("order decision test passed");
