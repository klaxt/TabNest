# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

TabNest is a browser extension (Manifest V2, Web Extensions API) for managing tabs. It targets Safari but uses the standard `browser.*` namespace, making it compatible with Firefox as-is and Chrome/Edge with `browser` → `chrome` substitution.

## Development workflow

There is no build step. Load the extension directly:

1. Safari → Develop → Allow Unsigned Extensions
2. Safari → Develop → Add temporary extensions… → select `/workspace`
3. After any change: Safari → Develop → Reload Extension

To regenerate PNG icons after editing `icons/icon.svg`:
```bash
for size in 16 32 48 128; do
  convert -background none icons/icon.svg -resize ${size}x${size} icons/icon-${size}.png
done
```

## Architecture

| File | Role |
|------|------|
| `background.js` | Persistent event page. Listens to `tabs.onCreated` / `tabs.onRemoved` and writes `tab_<id>: timestamp` to `browser.storage.local`. Seeds timestamps for existing tabs on install/startup. |
| `popup.js` | All UI logic. Runs inside the browser action popup — ephemeral, recreated on every open. |
| `popup.html` / `popup.css` | Popup markup and styles. Fixed width 400px, max-height 600px. |

### State in `popup.js`

Three module-level variables hold in-memory state for the lifetime of a popup session:

- `allTabs` — deduplicated full tab list (Firefox returns pinned tabs once per window)
- `windowNumberMap` — stable `windowId → display number` mapping, built by sorting windowIds numerically so the lowest ID (oldest window) is always Window 1
- `groupOrder`, `collapsedWindows`, `groupNames` — loaded from `browser.storage.local` on open, written back on every user action

### Data flow

```
loadTabs()
  └─ browser.tabs.query({})
       └─ deduplicate → build windowNumberMap
            └─ storage.local.get([collapsedWindows, groupOrder, groupNames, tab_*timestamps])
                 └─ displayTabs(allTabs, timestamps)
```

`filterTabs()` re-fetches timestamps from storage but reuses the in-memory `collapsedWindows`, `groupOrder`, and `groupNames` — so collapse/order state is not reset on search.

### Group rendering

`displayTabs()` separates pinned vs unpinned tabs, applies saved `groupOrder`, then calls `buildWindowGroup()` for each group. Groups are rendered as:

```
.window-group[data-window-id]
  .window-header  (drag handle · label · count badge · chevron)
  .window-tabs    (tab items; add class "collapsed" to hide)
```

The pinned group always uses key `"pinned"`. Window groups use the numeric `windowId` as the key (stored as string in dataset/storage).

### Commit convention

After verifying a feature works in the browser, commit with:
```
<short description>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```
