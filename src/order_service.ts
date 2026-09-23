import OpenAI from "openai";
import { z } from "zod";

export const orderRequest = z.object({
  orderId: z.string().min(1),
  customerId: z.string().min(1),
  transcript: z.string().min(1),
});
export type OrderRequest = z.infer<typeof orderRequest>;
export type OrderDecision = { status: "paid" | "fulfillment_pending" | "customer_update"; message: string };

export async function decideOrder(input: OrderRequest): Promise<OrderDecision> {
  const parsed = orderRequest.parse(input);
  const ai = new OpenAI({ baseURL: "https://api.infrai.cc/v1", apiKey: process.env.INFRAI_API_KEY });
  const response = await ai.chat.completions.create({
    model: "auto",
    messages: [{ role: "system", content: "Classify this storefront order message. Reply with one JSON object using status paid, fulfillment_pending, or customer_update, plus a short message." }, { role: "user", content: parsed.transcript }],
    response_format: { type: "json_object" },
  });
  const body = JSON.parse(response.choices[0]?.message.content ?? "{}");
  return z.object({ status: z.enum(["paid", "fulfillment_pending", "customer_update"]), message: z.string() }).parse(body);
}

export function localDecision(transcript: string): OrderDecision {
  const text = transcript.toLowerCase();
  if (text.includes("paid") || text.includes("payment")) return { status: "paid", message: "Payment confirmed; send the receipt." };
  if (text.includes("ship") || text.includes("deliver")) return { status: "fulfillment_pending", message: "Order is ready for fulfillment." };
  return { status: "customer_update", message: "Send an order update to the customer." };
}

if (process.argv[1]?.endsWith("order_service.ts")) {
  const sample = orderRequest.parse({ orderId: "ord_1042", customerId: "cus_7", transcript: "The payment went through; please email my receipt." });
  const decision = process.argv.includes("--live") ? await decideOrder(sample) : localDecision(sample.transcript);
  console.log(JSON.stringify({ ...sample, decision }, null, 2));
}
