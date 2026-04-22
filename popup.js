let allTabs = [];
let windowNumberMap = {};
const collapsedWindows = new Set();

document.addEventListener('DOMContentLoaded', function() {
  loadTabs();
  setupEventListeners();
});

function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', function() {
    filterTabs(this.value);
  });

  const closeAllBtn = document.getElementById('closeAllBtn');
  closeAllBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to close all tabs?')) {
      closeAllTabs();
    }
  });
}

function loadTabs() {
  browser.tabs.query({}, function(tabs) {
    // Deduplicate by ID — Firefox returns pinned tabs once per window
    const seen = new Set();
    allTabs = tabs.filter(tab => {
      if (seen.has(tab.id)) return false;
      seen.add(tab.id);
      return true;
    });

    // Build stable window numbers sorted by windowId (creation order)
    const windowIds = [...new Set(allTabs.filter(t => !t.pinned).map(t => t.windowId))].sort((a, b) => a - b);
    windowNumberMap = {};
    windowIds.forEach((id, i) => { windowNumberMap[id] = i + 1; });

    const keys = allTabs.map(tab => `tab_${tab.id}`);
    browser.storage.local.get(keys, function(timestamps) {
      displayTabs(allTabs, timestamps);
      updateTabCount(allTabs.length);
    });
  });
}

function displayTabs(tabs, timestamps = {}) {
  const tabList = document.getElementById('tabList');
  tabList.innerHTML = '';

  if (tabs.length === 0) {
    tabList.innerHTML = '<div class="no-tabs">No tabs found</div>';
    return;
  }

  const pinnedTabs = tabs.filter(tab => tab.pinned);
  const unpinnedTabs = tabs.filter(tab => !tab.pinned);

  if (pinnedTabs.length > 0) {
    tabList.appendChild(buildWindowGroup('pinned', 'Pinned Tabs', pinnedTabs, timestamps));
  }

  // Group unpinned tabs by window
  const windowGroups = {};
  unpinnedTabs.forEach(tab => {
    if (!windowGroups[tab.windowId]) windowGroups[tab.windowId] = [];
    windowGroups[tab.windowId].push(tab);
  });
  const windowOrder = Object.keys(windowGroups).sort((a, b) => windowNumberMap[a] - windowNumberMap[b]);

  windowOrder.forEach(windowId => {
    const label = `Window ${windowNumberMap[windowId] ?? windowId}`;
    tabList.appendChild(buildWindowGroup(windowId, label, windowGroups[windowId], timestamps));
  });
}

function buildWindowGroup(windowId, label, tabs, timestamps) {
  const key = String(windowId);
  const isCollapsed = collapsedWindows.has(key);

  const windowGroup = document.createElement('div');
  windowGroup.className = 'window-group';
  windowGroup.dataset.windowId = windowId;

  const windowHeader = document.createElement('div');
  windowHeader.className = 'window-header';

  const labelEl = document.createElement('span');
  labelEl.className = 'window-label';
  labelEl.textContent = label;

  const countBadge = document.createElement('span');
  countBadge.className = 'window-tab-count';
  countBadge.textContent = `${tabs.length} tab${tabs.length !== 1 ? 's' : ''}`;

  const chevron = document.createElement('span');
  chevron.className = 'window-chevron' + (isCollapsed ? ' collapsed' : '');

  windowHeader.appendChild(labelEl);
  windowHeader.appendChild(countBadge);
  windowHeader.appendChild(chevron);
  windowHeader.addEventListener('click', () => toggleWindow(windowId));

  const tabContainer = document.createElement('div');
  tabContainer.className = 'window-tabs' + (isCollapsed ? ' collapsed' : '');

  tabs.forEach(tab => tabContainer.appendChild(createTabElement(tab, timestamps)));

  windowGroup.appendChild(windowHeader);
  windowGroup.appendChild(tabContainer);

  return windowGroup;
}

function toggleWindow(windowId) {
  const key = String(windowId);
  if (collapsedWindows.has(key)) {
    collapsedWindows.delete(key);
  } else {
    collapsedWindows.add(key);
  }

  const windowGroup = document.querySelector(`[data-window-id="${windowId}"]`);
  if (windowGroup) {
    windowGroup.querySelector('.window-tabs').classList.toggle('collapsed');
    windowGroup.querySelector('.window-chevron').classList.toggle('collapsed');
  }
}

function formatElapsed(ms) {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function createTabElement(tab, timestamps = {}) {
  const tabItem = document.createElement('div');
  tabItem.className = 'tab-item';
  if (tab.active) {
    tabItem.classList.add('active');
  }

  const favicon = document.createElement('img');
  favicon.className = 'favicon';
  favicon.src = tab.favIconUrl || 'icons/icon-16.png';
  favicon.onerror = function() {
    this.src = 'icons/icon-16.png';
  };

  const tabInfo = document.createElement('div');
  tabInfo.className = 'tab-info';

  const title = document.createElement('div');
  title.className = 'tab-title';
  title.textContent = tab.title || 'Untitled';
  title.title = tab.title;

  const url = document.createElement('div');
  url.className = 'tab-url';
  url.textContent = tab.url;
  url.title = tab.url;

  const openedAt = timestamps[`tab_${tab.id}`];
  const elapsed = document.createElement('div');
  elapsed.className = 'tab-elapsed';
  elapsed.textContent = openedAt ? formatElapsed(Date.now() - openedAt) : '';

  tabInfo.appendChild(title);
  tabInfo.appendChild(url);
  tabInfo.appendChild(elapsed);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-btn';
  closeBtn.innerHTML = '&times;';
  closeBtn.title = 'Close tab';
  closeBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    closeTab(tab.id);
  });

  tabItem.addEventListener('click', function() {
    switchToTab(tab.id);
  });

  tabItem.appendChild(favicon);
  tabItem.appendChild(tabInfo);
  tabItem.appendChild(closeBtn);

  return tabItem;
}

function filterTabs(searchTerm) {
  const keys = allTabs.map(tab => `tab_${tab.id}`);
  browser.storage.local.get(keys, function(timestamps) {
    if (!searchTerm) {
      displayTabs(allTabs, timestamps);
      return;
    }

    const filtered = allTabs.filter(tab => {
      const title = (tab.title || '').toLowerCase();
      const url = (tab.url || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      return title.includes(term) || url.includes(term);
    });

    displayTabs(filtered, timestamps);
  });
}

function switchToTab(tabId) {
  browser.tabs.update(tabId, { active: true }, function(tab) {
    browser.windows.update(tab.windowId, { focused: true });
    window.close();
  });
}

function closeTab(tabId) {
  browser.tabs.remove(tabId, function() {
    loadTabs();
  });
}

function closeAllTabs() {
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
  document.getElementById('tabCount').textContent = count;
}
