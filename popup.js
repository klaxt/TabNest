// Get all tabs and display them
let allTabs = [];

document.addEventListener('DOMContentLoaded', function() {
  loadTabs();
  setupEventListeners();
});

function setupEventListeners() {
  // Search functionality
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', function() {
    filterTabs(this.value);
  });

  // Close all tabs button
  const closeAllBtn = document.getElementById('closeAllBtn');
  closeAllBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to close all tabs?')) {
      closeAllTabs();
    }
  });
}

function loadTabs() {
  // Query all tabs in all windows
  browser.tabs.query({}, function(tabs) {
    allTabs = tabs;
    displayTabs(tabs);
    updateTabCount(tabs.length);
  });
}

function displayTabs(tabs) {
  const tabList = document.getElementById('tabList');
  tabList.innerHTML = '';

  if (tabs.length === 0) {
    tabList.innerHTML = '<div class="no-tabs">No tabs found</div>';
    return;
  }

  // Group tabs by window
  const windowGroups = {};
  tabs.forEach(tab => {
    if (!windowGroups[tab.windowId]) {
      windowGroups[tab.windowId] = [];
    }
    windowGroups[tab.windowId].push(tab);
  });

  // Display tabs grouped by window
  Object.keys(windowGroups).forEach((windowId, index) => {
    const windowTabs = windowGroups[windowId];

    // Add window header if there's more than one window
    if (Object.keys(windowGroups).length > 1) {
      const windowHeader = document.createElement('div');
      windowHeader.className = 'window-header';
      windowHeader.textContent = `Window ${index + 1} (${windowTabs.length} tabs)`;
      tabList.appendChild(windowHeader);
    }

    // Add each tab
    windowTabs.forEach(tab => {
      const tabItem = createTabElement(tab);
      tabList.appendChild(tabItem);
    });
  });
}

function createTabElement(tab) {
  const tabItem = document.createElement('div');
  tabItem.className = 'tab-item';
  if (tab.active) {
    tabItem.classList.add('active');
  }

  // Favicon
  const favicon = document.createElement('img');
  favicon.className = 'favicon';
  favicon.src = tab.favIconUrl || 'icons/icon-16.png';
  favicon.onerror = function() {
    this.src = 'icons/icon-16.png';
  };

  // Tab info container
  const tabInfo = document.createElement('div');
  tabInfo.className = 'tab-info';

  // Tab title
  const title = document.createElement('div');
  title.className = 'tab-title';
  title.textContent = tab.title || 'Untitled';
  title.title = tab.title;

  // Tab URL
  const url = document.createElement('div');
  url.className = 'tab-url';
  url.textContent = tab.url;
  url.title = tab.url;

  tabInfo.appendChild(title);
  tabInfo.appendChild(url);

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-btn';
  closeBtn.innerHTML = '&times;';
  closeBtn.title = 'Close tab';
  closeBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    closeTab(tab.id);
  });

  // Click to switch to tab
  tabItem.addEventListener('click', function() {
    switchToTab(tab.id);
  });

  tabItem.appendChild(favicon);
  tabItem.appendChild(tabInfo);
  tabItem.appendChild(closeBtn);

  return tabItem;
}

function filterTabs(searchTerm) {
  if (!searchTerm) {
    displayTabs(allTabs);
    return;
  }

  const filtered = allTabs.filter(tab => {
    const title = (tab.title || '').toLowerCase();
    const url = (tab.url || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return title.includes(term) || url.includes(term);
  });

  displayTabs(filtered);
}

function switchToTab(tabId) {
  browser.tabs.update(tabId, { active: true }, function(tab) {
    // Also focus the window containing the tab
    browser.windows.update(tab.windowId, { focused: true });
    // Close the popup
    window.close();
  });
}

function closeTab(tabId) {
  browser.tabs.remove(tabId, function() {
    // Reload the tab list
    loadTabs();
  });
}

function closeAllTabs() {
  // Get all tab IDs except the current one
  const tabIds = allTabs
    .filter(tab => !tab.active)
    .map(tab => tab.id);

  if (tabIds.length > 0) {
    browser.tabs.remove(tabIds, function() {
      loadTabs();
    });
  }
}

function updateTabCount(count) {
  const tabCount = document.getElementById('tabCount');
  tabCount.textContent = count;
}
