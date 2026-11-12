surfaces: ios, android, macos, web
agent: Claude Code, Claude Opus 5.5
task: build a multi-screen forms + list app with a PDF export, custom form components, dark theme and animated filter cards

### Rough

- **`if` around a `tablist` before onboarding.** Wrapping the tablist in `if` to hide the tabs made iOS draw the other tab's panel over the landing screen. contract-for-agents.md says to use `display=none` instead, but the compiler gave no warning. ~20 min. A lint for "`if` around tablist" would have caught it.
- **Sideways scroll with custom inputs (iOS).** A route column with a native nav bar, holding a `scroll` of `appearance="none"` inputs, scrolled about 70pt sideways. `agent check` reported no horizontal overflow, and `box-sizing="border-box"` didn't help. Setting `overflow-x="hidden"` on the scroll fixed it. ~25 min. It would help if `check` caught the overflow, or if the docs explained why the content is wider than the screen.
- **`enterkeyhint="next"` skipped a field.** The submit action also called `focus()` on the next field, and Exact already moves focus for `next`, so focus jumped two fields. Making submit a no-op action fixed it. ~15 min. The docs for `enterkeyhint` could say "next already advances; don't also focus".
- **A section `header` holds only one text.** I tried to put a stats box in an inset-grouped list's header and the compiler refused it. Pinning the box above the list as a sibling then gave a "stays put" warning, fought the large title, and made the layout jump on iOS when the box changed height. Replacing the list with a custom `scroll` + column fixed it. ~1 h across several tries. It would help to have a recipe for "a summary card above a grouped list that scrolls with it".
- **A computed `border-radius` was rejected.** Only the four per-corner properties take a computed value. The error was clear, but the shorthand silently not working with bindings was surprising. ~5 min.
- **No computed handler in `if`.** `press=(cond ? a : b)` isn't allowed, so the choice goes through one action that takes an argument (`tapStat(key)`). This was fine once I knew it; a hint naming that pattern in the error would have helped. ~10 min.
- **An unknown colour token.** I guessed `-exact-secondary-system-grouped-background` and it doesn't exist. `contract vocab` lists the real ones, but the error didn't suggest the nearest name. ~5 min.
- **Android `select` never opens.** The host README lists its menu as not built, but there's no compile-time warning. A `column popover="auto" role="menu"` opened by a button's `popovertarget` works on both platforms (UIMenu / Material dropdown) and replaced it. ~30 min. A warning when a `select` targets Android would have helped.
- **No way to tell Android from iOS.** The request was a custom segmented control on Android only, keeping the native one on iOS. There's no supported platform query. I tried a hack based on an install-storage global, which was wrong under real storage, so I reverted it. ~40 min. A documented platform fact, or a per-host style, would cover this.
- **Android bars ignore `color-scheme`.** `color-scheme="dark"` on the root darkens the content, but the host's top bar and bottom tab bar follow the device's night mode only. Nothing in the app could fix it; I switched the emulator to night mode. ~20 min.
- **macOS came up light.** `color-scheme="dark"` on the root `main` gave dark custom surfaces, but the window, toolbar, tab bar and native controls stayed light, so text and controls were hard to see. The fix was `"userInterfaceStyle": "dark"` in app.json, which I found by searching the schema. ~15 min. The `color-scheme` vocab entry, or a first-run note on `mac`, could point to `userInterfaceStyle` for a whole-app scheme.
- **`mac --run` closing silently.** A second `bun exact.mjs mac --run` built and launched the app, which then quit right away with exit 0 and nothing in the log. Opening the built `.app` with `open` worked. Separately, `agent macos` ends the copy of the app the person had open. Both cost ~10 min of "where did the app go". A log line saying why it exited would help.
- **Mac layout leftovers (not fixed).** On the Mac host, a screen's large title sits flush against the left window edge, and the first custom pressable card shows a blue focus ring at launch.
- **Animations on expand/collapse.** I combined `animation` keyframes (enter), `-exact-exit-animation` and `-exact-layout-transition` on items in a list that grows and shrinks. The first version played its enter animation again on press and collapsed abruptly. It took several drives with `screenshot … over 300 every 50` to settle on: layout transition on the items and the footnote, enter animation only on newly shown items. ~45 min. A recipe for an "expanding chooser list" would help.

### Lean in

- **Frame-by-frame screenshots.** `agent … "clock data" "tap X" "screenshot f over 300 every 50"` made it possible to debug transitions without watching by eye. It was the most useful tool of the session.
- **Native menus from one tag.** A `popover role="menu"` turning into UIMenu on iOS and a Material dropdown on Android, with no platform code, was great.
- **Components.** `slot`, `provide`/`inject` and required props made a reusable TextField/Button set quick to build and to roll out across every form.
- **Tamber tokens.** `light-dark()`, `scheme=fixed` for hero colours, and SF Symbol + SVG icon pairs in one declaration were pleasant to use.
- **The Mac app for free.** The same app ran on macOS with no code changes; only the appearance key was needed.
- **JSON diagnostics.** `contract build --json` diagnostics were precise and fast to act on.

### Needed

- share sheet: provided
- PDF generation: by hand (a TypeScript module that draws the page)
- network (HTTP to a public registry): provided
- local persistence: provided
- dark appearance: provided, rough (Android bars, macOS; see Rough)
- dropdown menu: provided via popover menu; `select` missing on Android
- platform detection: missing
- custom text inputs/buttons: provided (`appearance="none"`, `:active`/`:disabled`, press-scale)
- layout/enter/exit animations: provided, rough (see Rough)
  https://lnkd.in/p/eSJckcjE
### Checkpoints

- web dev loop: smooth
- editing app.contract / app.ts: rough (see the `if`/tablist, section header and handler entries)
- iOS build: smooth
- Android build: smooth; host rough (select, bars)
- macOS build: rough (appearance, `--run` closing silently)
- driving the app (`exact.mjs agent`): smooth
