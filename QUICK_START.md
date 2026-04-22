# Quick Start Guide

Get your Safari TabNest extension up and running in minutes!

## Fastest Way to Install (For Development/Testing)

### Option 1: Direct Load (Simplest - No Xcode Required)

1. **Enable Safari Developer Mode**
   ```
   Safari → Preferences → Advanced → Check "Show Develop menu in menu bar"
   ```

2. **Allow Unsigned Extensions**
   ```
   Safari → Develop → Allow Unsigned Extensions
   ```

3. **Load Your Extension**
   ```
   Safari → Develop → Add temporary extensions...
   Navigate to and select the "/workspace/tabnest" folder
   Click "Select"
   ```

4. **Enable in Safari**
   ```
   Safari → Preferences → Extensions → Enable "TabNest"
   ```

**Note**: With this method, you'll need to reload the extension each time Safari restarts.

---

### Option 2: Build with Xcode (For Production Use)

1. **Convert to Safari App Extension**
   ```bash
   cd /workspace
   xcrun safari-web-extension-converter tabnest --app-name "TabNest"
   ```

2. **Open in Xcode**
   ```bash
   open "TabNest/TabNest.xcodeproj"
   ```

3. **Build and Run**
   - Select your development team in project settings
   - Press ⌘R to build and run
   - The app will launch automatically

4. **Enable in Safari**
   ```
   Safari → Preferences → Extensions → Enable "TabNest"
   ```

---

## Quick Test

After installation:

1. Click the TabNest icon in Safari's toolbar
2. You should see a dropdown listing all your open tabs
3. Try clicking a tab to switch to it
4. Try searching for a tab by typing in the search box
5. Try closing a tab using the × button

---

## Common Issues

**Icon doesn't appear?**
- Check Safari → Preferences → Extensions
- Make sure "TabNest" is checked

**"browser is not defined" error?**
- This extension only works in Safari
- Make sure you're testing in Safari, not Chrome or Firefox

**Need to reload after changes?**
- Safari → Develop → Reload Extension
- Or rebuild in Xcode if using App Extension

---

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Customize the icon in the `icons/` folder
- Modify colors in `popup.css`
- Add new features in `popup.js`

Enjoy managing your tabs!
