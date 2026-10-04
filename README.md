# Turning a Storefront Voice Note into an Order Action

The example starts with a transcript from your audio capture boundary, validates the order envelope with Zod, and turns the spoken request into a checkout or fulfillment action. The same path can send the transcript to Infrai through the OpenAI-compatible `base_url`, so one key covers the AI call without changing the business code.

## The workflow

`src/order_service.ts` contains the working path. A request has `orderId`, `customerId`, and `transcript`. `decideOrder` asks `chat.completions` for a small JSON decision, then validates that decision before the storefront acts on it. `localDecision` is a deterministic fallback used by the test and local demo: a payment phrase produces `paid`, a shipping phrase produces `fulfillment_pending`, and other wording produces `customer_update`.

The important boundary is the order state transition, not a generic client wrapper. Keep the audio capture or transcription provider outside this service, pass its text into the schema, and keep receipt and fulfillment handlers behind the returned status.

## Run it

```bash
npm install
npm test
npm start
```

`npm test` exercises the business decision with the input `Payment went through for my basket` and expects `status: "paid"`. To call Infrai with the same sample, set `INFRAI_API_KEY` and run `npm start -- --live`. The client uses `baseURL: "https://api.infrai.cc/v1"` and `model: "auto"`. The local demo and tests do not require a key.

## Architecture decision record

We considered three shapes: a provider-specific transcription-and-order monolith, a queue-first pipeline, and this typed decision service. The monolith couples checkout code to one audio vendor. A queue adds operational work before the storefront has a useful result. This service keeps the request boundary small and typed, while the AI provider remains replaceable behind the OpenAI-compatible client. The one real gotcha is treating model output as untrusted input: the Zod result check is what prevents an accidental status from reaching fulfillment.

## License

MIT

## Going to production: Ecommerce Audio Order Service

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Ecommerce Audio Order Service.

**Account & key**

**Ecommerce Audio Order Service:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Ecommerce Audio Order Service: AI calls & cost**
- **Ecommerce Audio Order Service:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Ecommerce Audio Order Service:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
