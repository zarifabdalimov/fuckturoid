# F*ckturoid

Invoicing for phones, a spin-off of Fakturoid, built with [Exact](https://github.com/expo/exact).

## Setup

```sh
git clone https://github.com/expo/exact exact
git -C exact checkout afe439172fec82ddfe299c49680742f43307651e   # the commit this app was built against
cd exact && bun scripts/exact.mjs setup && cd ..
```

Needs Rust (rustup), Bun 1.4.2, Xcode 27.1+, and Chrome for the web host.

## Develop

```sh
cd app
bun exact.mjs ios --run      # build and launch on the booted iOS Simulator
bun exact.mjs test ios       # run app.test.contract
bun exact.mjs web            # the web dev loop at http://127.0.0.1:8765/
```

## Layout

```
app/
  app.json            the manifest: name, bundle id, hosts
  app.contract        the root: all state, data, actions, routes and the tab bar
  app.ts              the data module: grants, and each source: load → rule → save
  app.test.contract   tests
  src/
    model/            the business logic
      model.contract  shapes (Client, Invoice…) and the rules screens need (IČO checksum, Kč…)
      clients.ts      one client per IČO, sorting, add/update/remove
      invoices.ts     numbering, due dates, totals, payment, export file name
      format.ts       how money and dates are written (twin of model.contract's kc, czDate)
      ids.ts
    screens/          one .contract per screen, each taking its data and actions as props
    modules/          services the model doesn't know about
      ares/           ARES lookup by IČO
      storage/        lists kept as JSON files in the app's storage
      pdf/            an invoice as a PDF (hand-written, no library or embedded font)
```

`app.contract`, `app.ts` and `app.test.contract` must sit beside `app.json`: that is how
Exact finds the app. A top-level `app/modules/` is Exact's, for native modules, so the
TypeScript modules live in `src/modules/`. Grants stay written out in `app.ts`: the build
reads them without running any code.

## Features

- **Your details:** name, IČO, DIČ and address, kept on the device. A valid IČO fills the
  rest from [ARES](https://ares.gov.cz).
- **Clients:** a searchable list kept in a file on the device; add or edit in a sheet with
  the same ARES autofill, refused on a duplicate IČO; swipe or Delete (which asks) removes one.
- **Invoices:** numbered per year (2026-0001), a client and your details copied in when
  saved, lines with quantity × price in Kč, due in 7/14/30 days; Paid and Overdue badges,
  a Paid switch, edit, and delete (which asks).
- **PDF export:** the Share button on an invoice makes a Czech A4 PDF (Faktura) and opens
  the share sheet: Save to Files, Mail, AirDrop, Print.
- **Log Out** (in Your details): asks, then erases your details, clients and invoices and
  returns to the landing screen.
