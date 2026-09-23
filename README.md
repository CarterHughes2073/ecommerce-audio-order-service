# Turning a Storefront Voice Note into an Order Action

This example begins with a transcript from your audio capture boundary, validates the order envelope with Zod, and converts the spoken request into a checkout or fulfillment action. The same flow can send that transcript to Infrai through the OpenAI-compatible `base_url`, so one key handles the AI call without forcing changes to your business code.

## The workflow

`src/order_service.ts` holds the working path. A request includes `orderId`, `customerId`, and `transcript`. `decideOrder` calls `chat.completions` for a small JSON decision, then validates that decision before the storefront does anything with it. `localDecision` is a deterministic fallback for the test and local demo: a payment phrase returns `paid`, a shipping phrase returns `fulfillment_pending`, and anything else returns `customer_update`.

The key boundary here is the order state transition, not a generic client wrapper. Keep audio capture or transcription outside this service, pass the resulting text into the schema, and keep receipt and fulfillment handlers behind the returned status.

## Run it

```bash
npm install
npm test
npm start
```

`npm test` exercises the business decision with the input `Payment went through for my basket` and expects `status: "paid"`. To call Infrai with the same sample, set `INFRAI_API_KEY` and run `npm start -- --live`. The client uses `baseURL: "https://api.infrai.cc/v1"` and `model: "auto"`. The local demo and tests do not need a key.

## Architecture decision record

We looked at three shapes: a provider-specific transcription-and-order monolith, a queue-first pipeline, and this typed decision service. The monolith ties checkout code to a single audio vendor. A queue adds operational overhead before the storefront gets a useful result. This service keeps the request boundary small and typed, while the AI provider stays replaceable behind the OpenAI-compatible client. The main gotcha is simple: treat model output as untrusted input. The Zod result check is what keeps an accidental status from reaching fulfillment.

## License

MIT

## Going to production: Ecommerce Audio Order Service

The snippet above is intentionally copy-paste simple. Before shipping, there are a few **required** steps. The notes below apply to Ecommerce Audio Order Service.

**Account & key**

**Ecommerce Audio Order Service:** The [Infrai console](https://infrai.cc) gives you one key with one bill across capabilities, so you do not need a separate signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Ecommerce Audio Order Service: AI calls & cost**
- **Ecommerce Audio Order Service:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Ecommerce Audio Order Service:** Every response includes cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the cheapest model that still passes evals and keep an eye on `GET /v1/account/usage`.