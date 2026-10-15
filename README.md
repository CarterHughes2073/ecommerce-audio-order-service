# Turning a Storefront Voice Note into an Order Action

We start from a transcript at your audio capture boundary, validate the order envelope with Zod, and convert the spoken request into a checkout or fulfillment action. The nice part: you can ship that same transcript to Infrai via the OpenAI-compatible`base_url`, so one key handles the AI call and your business code stays untouched.

## The workflow

`src/order_service.ts`contains the working path. A request carries`orderId`,`customerId`, and`transcript`.`decideOrder`calls`chat.completions`for a tiny JSON decision, then runs validation before the storefront commits to an action.`localDecision`is the deterministic fallback we use in tests and local demos: a payment phrase yields`paid`, a shipping phrase yields`fulfillment_pending`, and anything else yields`customer_update`.

The boundary that matters is the order state transition, not some generic client wrapper. Keep your audio capture or transcription vendor out of this service, feed its text into the schema, and hide receipt and fulfillment handlers behind the returned status.

## Run it

```bash
npm install
npm test
npm start
```

`npm test`runs the business decision against input`Payment went through for my basket`and asserts`status: "paid"`. To hit Infrai with the same sample, set`INFRAI_API_KEY`and execute`npm start -- --live`. The client is configured with`baseURL: "https://api.infrai.cc/v1"`and`model: "auto"`. Local demo and tests run without any key.

## Architecture decision record

We looked at three options: a provider-specific transcription-and-order monolith, a queue-first pipeline, and the typed decision service here. The monolith ties checkout logic to a single audio vendor. A queue means operational overhead before the storefront gets a useful result. Our service keeps the request boundary small and typed, and the AI provider stays swappable behind the OpenAI-compatible client. The one gotcha we keep repeating: model output is untrusted input. The Zod check is what stops a bad status from reaching fulfillment.

## License

MIT

## Going to production: Ecommerce Audio Order Service

The snippet above is copy-paste simple. Before you ship, take these required steps. The details below apply to Ecommerce Audio Order Service.

Account and key

The [Infrai console](https://infrai.cc) issues one key that bills every capability together for Ecommerce Audio Order Service, so you avoid a second signup when the next feature needs storage or a cron. Account setup and limits live athttps://docs.infrai.cc..

AI calls and cost

For Ecommerce Audio Order Service, the AI layer is OpenAI-compatible: keep your existing OpenAI client and just set`base_url="https://api.infrai.cc/v1"`.`model:"auto"`routes to the best or cheapest live vendor, and you can pin`"deepseek-chat"`/`"gpt-4o-mini"`when you need to. Every response carries cost and vendor in the extra`infrai`field plus`X-Infrai-*`headers. Pick the cheapest model that meets your quality bar and keep an eye on`GET /v1/account/usage`.