# Safari Tab Manager Extension

A Safari extension that helps you manage your browser tabs with an easy-to-use dropdown interface. Click the extension button to see all your open tabs, search through them, switch between tabs, and close tabs you no longer need.

## Features

- **View All Tabs**: See all open tabs across all Safari windows in a clean, organized list
- **Search Functionality**: Quickly find tabs by searching their titles or URLs
- **Quick Switch**: Click any tab to switch to it instantly
- **Close Tabs**: Close individual tabs or all tabs at once
- **Window Grouping**: Tabs are organized by window when you have multiple windows open
- **Active Tab Highlighting**: The currently active tab is highlighted for easy identification
- **Tab Count**: See the total number of open tabs at a glance

## Project Structure

```
safari-tab-manager/
├── manifest.json       # Extension configuration
├── popup.html          # Popup interface HTML
├── popup.js            # Tab management JavaScript
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
   xcrun safari-web-extension-converter safari-tab-manager --app-name "Tab Manager"
   ```

   This command will:
   - Create an Xcode project
   - Convert your web extension to a Safari App Extension
   - Create a macOS app wrapper

3. The converter will create a new directory called "Tab Manager" with an Xcode project inside.

### Step 2: Build in Xcode

1. Open the generated Xcode project:
   ```bash
   open "Tab Manager/Tab Manager.xcodeproj"
   ```

2. In Xcode:
   - Select your development team in the project settings (Signing & Capabilities)
   - Select the "Tab Manager" scheme from the scheme selector
   - Build the project: Product → Build (⌘B)

3. Run the app to install the extension: Product → Run (⌘R)

   A small menu bar app will launch. This is the wrapper app for your extension.

### Step 3: Enable the Extension in Safari

1. Open Safari → Preferences (⌘,)
2. Go to the "Extensions" tab
3. Find "Tab Manager" in the list and check the box to enable it
4. Click "Allow" if Safari asks for permission to access tabs

## Installing the Extension (Without Building)

If you want to load the extension directly for development without creating an app:

1. Open Safari and enable developer mode:
   - Safari → Preferences → Advanced
   - Check "Show Develop menu in menu bar"

2. Load the unsigned extension:
   - Safari → Develop → Allow Unsigned Extensions
   - Safari → Develop → Add temporary extensions...
   - Navigate to and select the `/workspace/safari-tab-manager` folder
   - Click "Select"

**Note**: Temporary extensions must be reloaded each time you restart Safari.

## Using the Extension

1. Look for the Tab Manager icon in Safari's toolbar (next to the address bar)
2. Click the icon to open the tab management popup
3. Features available in the popup:
   - **Search**: Type in the search box to filter tabs by title or URL
   - **Switch to Tab**: Click any tab to switch to it
   - **Close Tab**: Click the "×" button on any tab to close it
   - **Close All Tabs**: Click "Close All Tabs" at the bottom to close all tabs (except the active one)

## Development

### Testing Changes

1. Make changes to the source files (manifest.json, popup.html, popup.js, popup.css)
2. In Safari, go to Develop → Reload Extension
3. Or, if using Xcode, rebuild and rerun the app

### Debugging

1. Open Safari → Develop → Web Extension Background Content
2. Select your extension to open the Web Inspector
3. Console logs and errors will appear here

## Customization

### Changing the Icon

Replace the icon files in the `icons/` directory with your own:
- Edit `icons/icon.svg` with your design
- Regenerate PNG files using ImageMagick:
  ```bash
  cd icons
  convert -background none icon.svg -resize 16x16 icon-16.png
  convert -background none icon.svg -resize 32x32 icon-32.png
  convert -background none icon.svg -resize 48x48 icon-48.png
  convert -background none icon.svg -resize 128x128 icon-128.png
  ```

### Modifying Colors

Edit `popup.css` to change the color scheme:
- Header gradient: Line 20 (`.header`)
- Active tab highlight: Line 129 (`.tab-item.active`)
- Close button hover: Line 172 (`.close-btn:hover`)

### Adding Features

You can extend the extension by:
- Adding more tab management features in `popup.js`
- Creating additional UI elements in `popup.html`
- Implementing keyboard shortcuts in the manifest
- Adding background scripts for automatic tab management

## Browser Compatibility

This extension is specifically designed for Safari using the Web Extensions API. While the code uses standard Web Extensions APIs, it would need the following changes for other browsers:

- **Chrome/Edge**: Change `browser` to `chrome` in popup.js
- **Firefox**: Use as-is (supports `browser` API)

## Permissions

The extension requires the following permissions:
- `tabs`: To query, access, and manage browser tabs

These permissions are declared in `manifest.json`.

## Troubleshooting

### Extension doesn't appear in Safari
- Make sure you've enabled the extension in Safari → Preferences → Extensions
- If using unsigned extension, ensure "Allow Unsigned Extensions" is enabled

### Tabs don't load
- Check that you've granted the extension permission to access tabs
- Open Web Inspector to check for JavaScript errors

### Extension crashes on launch
- Verify all file paths in manifest.json are correct
- Ensure all icon files exist in the icons/ directory

### "browser is not defined" error
- Safari uses the `browser` namespace (Web Extensions standard)
- Make sure you're testing in Safari, not another browser

## License

This project is open source. Feel free to modify and distribute.

## Contributing

Contributions are welcome! Some ideas for enhancements:
- Tab grouping and organization features
- Tab session saving and restoration
- Tab deduplication
- Keyboard shortcuts
- Dark mode support
- Tab history and analytics
