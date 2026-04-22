// Get all tabs and display them
let allTabs = [];
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

  // Group tabs by window, preserving order
  const windowGroups = {};
  const windowOrder = [];
  tabs.forEach(tab => {
    if (!windowGroups[tab.windowId]) {
      windowGroups[tab.windowId] = [];
      windowOrder.push(tab.windowId);
    }
    windowGroups[tab.windowId].push(tab);
  });

  windowOrder.forEach((windowId, index) => {
    const windowTabs = windowGroups[windowId];
    const isCollapsed = collapsedWindows.has(String(windowId));

    const windowGroup = document.createElement('div');
    windowGroup.className = 'window-group';
    windowGroup.dataset.windowId = windowId;

    const windowHeader = document.createElement('div');
    windowHeader.className = 'window-header';

    const label = document.createElement('span');
    label.className = 'window-label';
    label.textContent = `Window ${index + 1}`;

    const countBadge = document.createElement('span');
    countBadge.className = 'window-tab-count';
    countBadge.textContent = `${windowTabs.length} tab${windowTabs.length !== 1 ? 's' : ''}`;

    const chevron = document.createElement('span');
    chevron.className = 'window-chevron' + (isCollapsed ? ' collapsed' : '');

    windowHeader.appendChild(label);
    windowHeader.appendChild(countBadge);
    windowHeader.appendChild(chevron);
    windowHeader.addEventListener('click', () => toggleWindow(windowId));

    const tabContainer = document.createElement('div');
    tabContainer.className = 'window-tabs' + (isCollapsed ? ' collapsed' : '');

    windowTabs.forEach(tab => {
      tabContainer.appendChild(createTabElement(tab));
    });

    windowGroup.appendChild(windowHeader);
    windowGroup.appendChild(tabContainer);
    tabList.appendChild(windowGroup);
  });
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

function createTabElement(tab) {
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

  tabInfo.appendChild(title);
  tabInfo.appendChild(url);

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
  const tabCount = document.getElementById('tabCount');
  tabCount.textContent = count;
}
