# TabNest

A browser extension that helps you manage your tabs with a clean, organized popup interface. Tabs are grouped by window, with support for pinned tabs, collapsible groups, drag-to-reorder, custom group names, and search.

## Features

- **Window Groups**: Tabs organized by window in collapsible groups — click a group header to expand or collapse it
- **Pinned Tabs Group**: Pinned tabs are separated into their own group at the top
- **Drag to Reorder**: Drag group headers to reorder them however you like
- **Rename Groups**: Double-click a group label to give it a custom name
- **Tab Age**: Each tab shows how long it has been open (e.g. `5m`, `2h 30m`, `3d`)
- **Search**: Filter tabs instantly by title or URL across all groups
- **Quick Switch**: Click any tab to focus it and bring its window to front
- **Close Tabs**: Close individual tabs or all non-active tabs at once
- **Persistent State**: Collapse state, group order, and custom names are remembered across sessions

## Project Structure

```
tabnest/
├── manifest.json       # Extension configuration
├── background.js       # Tracks tab open times
├── popup.html          # Popup interface HTML
├── popup.js            # Tab management logic
├── popup.css           # Styling
├── icons/              # Extension icons
│   ├── icon.svg        # Source SVG icon
│   ├── icon-16.png     # 16x16 icon
│   ├── icon-32.png     # 32x32 icon
│   ├── icon-48.png     # 48x48 icon
│   └── icon-128.png    # 128x128 icon
└── README.md           # This file
```

## Prerequisites

- macOS with Safari 14.0 or later
- Xcode (for converting the extension to Safari App Extension format)
- Safari Web Extension Converter tool (included with Xcode)

## Building the Extension

Safari extensions need to be bundled as Safari App Extensions using Xcode. Follow these steps:

### Step 1: Convert to Safari App Extension

1. Open Terminal and navigate to the parent directory of your extension:
   ```bash
   cd /workspace
   ```

2. Use the Safari Web Extension Converter (requires Xcode):
   ```bash
   xcrun safari-web-extension-converter tabnest --app-name "TabNest"
   ```

3. The converter will create a new directory called "TabNest" with an Xcode project inside.

### Step 2: Build in Xcode

1. Open the generated Xcode project:
   ```bash
   open "TabNest/TabNest.xcodeproj"
   ```

2. In Xcode:
   - Select your development team in the project settings (Signing & Capabilities)
   - Select the "TabNest" scheme from the scheme selector
   - Build the project: Product → Build (⌘B)

3. Run the app to install the extension: Product → Run (⌘R)

### Step 3: Enable the Extension in Safari

1. Open Safari → Preferences (⌘,)
2. Go to the "Extensions" tab
3. Find "TabNest" in the list and check the box to enable it
4. Click "Allow" if Safari asks for permission to access tabs

## Installing for Development (Without Xcode)

1. Open Safari and enable developer mode:
   - Safari → Preferences → Advanced
   - Check "Show Develop menu in menu bar"

2. Load the unsigned extension:
   - Safari → Develop → Allow Unsigned Extensions
   - Safari → Develop → Add temporary extensions...
   - Navigate to and select the `/workspace/tabnest` folder

**Note**: Temporary extensions must be reloaded each time you restart Safari.

## Using the Extension

1. Click the TabNest icon in Safari's toolbar to open the popup
2. Features available in the popup:
   - **Search**: Type to filter tabs by title or URL
   - **Collapse/Expand**: Click a group header to toggle it
   - **Rename Group**: Double-click a group label to rename it
   - **Reorder Groups**: Drag the grip handle on a group header
   - **Switch to Tab**: Click any tab row to switch to it
   - **Close Tab**: Click the × button on any tab
   - **Close All Tabs**: Click "Close All Tabs" at the bottom

## Development

### Testing Changes

1. Make changes to the source files
2. In Safari, go to Develop → Reload Extension

### Debugging

1. Open Safari → Develop → Web Extension Background Content
2. Select the TabNest extension to open Web Inspector

### Updating Icons

Edit `icons/icon.svg`, then regenerate the PNGs with ImageMagick:
```bash
for size in 16 32 48 128; do
  convert -background none icons/icon.svg -resize ${size}x${size} icons/icon-${size}.png
done
```

## Browser Compatibility

Built on the standard Web Extensions API. Tested on Safari/Firefox (`browser` namespace). For Chrome/Edge, replace `browser` with `chrome` in `popup.js` and `background.js`.

## Permissions

- `tabs`: Query and manage browser tabs
- `storage`: Persist collapse state, group order, custom names, and tab open times

## License

This project is open source. Feel free to modify and distribute.
