function seedExistingTabs() {
  browser.tabs.query({}, function(tabs) {
    const timestamps = {};
    tabs.forEach(tab => {
      const key = `tab_${tab.id}`;
      timestamps[key] = Date.now();
    });
    // Only set timestamps for tabs that don't already have one
    browser.storage.local.get(Object.keys(timestamps), function(existing) {
      const toSet = {};
      Object.keys(timestamps).forEach(key => {
        if (!(key in existing)) {
          toSet[key] = timestamps[key];
        }
      });
      if (Object.keys(toSet).length > 0) {
        browser.storage.local.set(toSet);
      }
    });
  });
}

browser.runtime.onInstalled.addListener(seedExistingTabs);
browser.runtime.onStartup.addListener(seedExistingTabs);

browser.tabs.onCreated.addListener(function(tab) {
  browser.storage.local.set({ [`tab_${tab.id}`]: Date.now() });
});

browser.tabs.onRemoved.addListener(function(tabId) {
  browser.storage.local.remove(`tab_${tabId}`);
});
