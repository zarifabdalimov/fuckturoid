# Fuckturoid

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

- `app/app.contract`: the root: all state, data, actions, routes and the tab bar
- `app/model.contract`: shapes (Client, Company, Reply) and pure functions (IČO checksum…)
- `app/screens/*.contract`: one file per screen; each takes its data and actions as props
- `app/app.ts`: the data module: ARES lookup and the clients file

## Features

- **Your details:** name, IČO, DIČ and address, kept on the device. A valid IČO fills the
  rest from [ARES](https://ares.gov.cz).
- **Clients:** a searchable list kept in a file on the device; add or edit in a sheet with
  the same ARES autofill, refused on a duplicate IČO; swipe or Delete (which asks) removes one.
- **Invoices:** numbered per year (2026-0001), a client and your details copied in when
  saved, lines with quantity × price in Kč, due in 7/14/30 days; Paid and Overdue badges,
  a Paid switch, edit, and delete (which asks).
- **Log Out** (in Your details): asks, then erases your details, clients and invoices and
  returns to the landing screen.
