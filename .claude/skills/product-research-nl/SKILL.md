---
name: product-research-nl
description: "Find and score products to sell in this Medusa store for the Netherlands/Belgium with Meta ads as the main traffic source. Use when the user wants product ideas, a 'winning product', to compare candidates, or to decide which product gets its own store. Produces a scored shortlist with break-even math, validation steps and a store brief for the winner."
---

# Product research for NL/BE + Meta ads

The goal is not "a trending product". The goal is a product that can make a profit on the
**first** order while paying for a Meta ad sale. Everything below serves that.

## Context of this stack (use it, don't re-ask)

- Market: NL/BE (DE possible), EUR, prices **including VAT** (21% NL/BE, 19% DE).
- Store: Medusa 2 + Next.js storefront in this repo; Dutch customer texts; one product = can get
  its own storefront/sales channel later.
- Payments: Mollie (iDEAL about €0.32 per payment; cards are a % fee). Check mollie.com/pricing.
- Traffic: Meta ads (Facebook/Instagram). Visuals and ad videos: Higgsfield.
- Shipping in the store: €4,95 standard (configurable in the admin).

## Step 1 — Ask once (multiple choice, allow shorthand like "1b 2a 3c")

Only ask what the conversation hasn't answered yet:
1. Test budget for ads: a) €300 b) €500–1000 c) more
2. Interest/niche: a) none, surprise me b) pets c) home/comfort d) sport/outdoor e) other
3. Fulfilment: a) dropship from an EU warehouse (preferred) b) China shipping is OK c) own stock

## Step 2 — Generate 8–12 candidates

Sources, in this order (search the web; mark anything unverified with ⚠️):
- **Season + local angle first.** NL-specific angles beat generic lists: dark winter mornings,
  cycling in rain/cold, small/old houses (draughts, energy costs), dog walking in the dark,
  padel/pickleball growth, Sinterklaas (5 Dec) + Christmas gifting, January self-improvement.
- Meta Ads Library (facebook.com/ads/library, country NL): products with ads that have run
  30+ days = someone is profitable. Many advertisers = proven but crowded.
- Google Trends with region Netherlands: rising or stable for 12+ months, not a one-week spike.
- Supplier catalogues with EU stock (CJ EU warehouse, BigBuy, Spocket, others): confirm the
  warehouse country and the delivery time to NL yourself.
- Generic "winning products" blog lists only as idea input; they are mostly US-centric and
  often written by suppliers.

## Step 3 — Score every candidate (0–2 per criterion, max 20)

| # | Criterion | 2 points | 0 points |
|---|---|---|---|
| 1 | Margin | landed cost ≤ 25% of selling price | > 40% |
| 2 | Price point | €39–89 (pays for a Meta sale) | < €25 |
| 3 | Shows in 3 seconds | the video demo is the pitch ("wow" or clear before/after) | needs explaining |
| 4 | Problem solved | real pain/desire, NL angle | "nice to have" |
| 5 | Not in shops | hard to find at Action/Bol/Kruidvat for less | €9 at Action |
| 6 | Delivery | EU stock, ≤ 5 days to NL | 10+ days from China |
| 7 | Return/size risk | one size, robust | clothing sizes, fragile |
| 8 | Compliance | simple (no battery/medical/food) | lithium, medical claims, kids' toys, cosmetics |
| 9 | Brandable | can carry a beautiful, distinct store | generic gadget |
| 10 | Upsell/bundle | 2-pack, accessory or refill | single item only |

Hard rejects regardless of score: medical/health claims you can't prove, weapons, anything
needing a licence, trademark/brand copies, "as seen on TV" lookalikes of a brand's design.

## Step 4 — Break-even math for the top 3 (show the table)

```
price_ex_vat     = selling_price / 1.21
landed_cost      = product + shipping to customer (+ packaging)
fees             = payment fee (~€0.32 iDEAL, ~1.8–2.9% cards) + refunds/returns allowance (3–5%)
contribution     = price_ex_vat − landed_cost − fees
break_even_CPA   = contribution          (max ad cost per sale before losing money)
break_even_ROAS  = selling_price / contribution
```

Benchmarks for NL Meta ads (directional, sources disagree, ⚠️): cost per purchase for e-commerce
roughly **€30–45**, CPM €8–15 with Q4 spikes. A product is only worth testing if
`break_even_CPA ≥ €25` — better €30+. If not: raise the price, bundle, or drop the product.
Note: €4,95 shipping that the customer pays counts as income too; free shipping counts as cost.

## Step 5 — Validation before money goes to ads

1. Meta Ads Library: count active NL advertisers + longest-running ad for the product.
2. Google Trends NL: 12-month curve; note the season.
3. Order **one sample** to a Dutch address: real delivery time, quality, packaging, photos.
4. Compliance check: CE marking, **GPSR** (EU General Product Safety Regulation: an EU-based
   responsible person, safety info and manufacturer details on the product page),
   for electrical items WEEE registration in NL (Stichting OPEN) ⚠️ verify who the producer is.
5. Price check: same item on Bol.com/Amazon.nl/Action. If it's much cheaper there, the store
   must win on brand/bundle/story, or skip it.

## Step 6 — Test plan

- 3 products max per test round, each with 3–5 creatives (Higgsfield video + static).
- €20–30/day per product, 3–5 days. Kill when spend ≥ 1.5× break_even_CPA without a sale.
  Keep when CPA ≤ break_even_CPA. Scale winners slowly (+20–30% budget per 2–3 days).
- Track with the funnel already in this repo (PostHog: `product_viewed` → `order_completed`,
  server-side revenue). Add the Meta Pixel/CAPI via the `meta-ads-integration` skill.

## Output format

1. One-paragraph summary: which product to test first and why.
2. Scored table of all candidates (score + one-line reason).
3. Break-even table for the top 3.
4. Validation checklist with what's still unverified (⚠️).
5. **Store brief** for the #1 product: store name ideas (3), target customer, the one problem,
   hero promise in Dutch, colour/type direction (hand to the `frontend-design` skill), 3 ad
   angles for Meta, Higgsfield shot list (hero photo, lifestyle photos, 15s demo video).
6. Next steps.

Save research to `docs/product-research/YYYY-MM-<topic>.md` so later sessions can build on it.
