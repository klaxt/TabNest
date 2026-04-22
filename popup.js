let allTabs = [];
let windowNumberMap = {};
let groupOrder = [];
const collapsedWindows = new Set();

let dragSrcId = null;

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

    const tabKeys = allTabs.map(tab => `tab_${tab.id}`);
    browser.storage.local.get(['collapsedWindows', 'groupOrder', ...tabKeys], function(result) {
      collapsedWindows.clear();
      (result.collapsedWindows || []).forEach(id => collapsedWindows.add(String(id)));
      groupOrder = result.groupOrder || [];

      const timestamps = {};
      tabKeys.forEach(k => { if (result[k]) timestamps[k] = result[k]; });

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

  const windowGroups = {};
  unpinnedTabs.forEach(tab => {
    if (!windowGroups[tab.windowId]) windowGroups[tab.windowId] = [];
    windowGroups[tab.windowId].push(tab);
  });

  // Build available keys in stable numeric order
  const available = [];
  if (pinnedTabs.length > 0) available.push('pinned');
  Object.keys(windowGroups)
    .sort((a, b) => windowNumberMap[a] - windowNumberMap[b])
    .forEach(id => available.push(String(id)));

  // Apply saved order, appending any new groups at the end
  const ordered = [
    ...groupOrder.filter(k => available.includes(String(k))),
    ...available.filter(k => !groupOrder.map(String).includes(String(k)))
  ];

  ordered.forEach(key => {
    const groupTabs = key === 'pinned' ? pinnedTabs : windowGroups[key];
    const label = key === 'pinned' ? 'Pinned Tabs' : `Window ${windowNumberMap[key]}`;
    tabList.appendChild(buildWindowGroup(key, label, groupTabs, timestamps));
  });
}

function buildWindowGroup(windowId, label, tabs, timestamps) {
  const key = String(windowId);
  const isCollapsed = collapsedWindows.has(key);

  const windowGroup = document.createElement('div');
  windowGroup.className = 'window-group';
  windowGroup.dataset.windowId = windowId;
  windowGroup.draggable = true;

  // Drag events
  windowGroup.addEventListener('dragstart', handleDragStart);
  windowGroup.addEventListener('dragover', handleDragOver);
  windowGroup.addEventListener('dragleave', handleDragLeave);
  windowGroup.addEventListener('drop', handleDrop);
  windowGroup.addEventListener('dragend', handleDragEnd);

  const windowHeader = document.createElement('div');
  windowHeader.className = 'window-header';

  const dragHandle = document.createElement('span');
  dragHandle.className = 'drag-handle';
  dragHandle.title = 'Drag to reorder';

  const labelEl = document.createElement('span');
  labelEl.className = 'window-label';
  labelEl.textContent = label;

  const countBadge = document.createElement('span');
  countBadge.className = 'window-tab-count';
  countBadge.textContent = `${tabs.length} tab${tabs.length !== 1 ? 's' : ''}`;

  const chevron = document.createElement('span');
  chevron.className = 'window-chevron' + (isCollapsed ? ' collapsed' : '');

  windowHeader.appendChild(dragHandle);
  windowHeader.appendChild(labelEl);
  windowHeader.appendChild(countBadge);
  windowHeader.appendChild(chevron);
  windowHeader.addEventListener('click', e => {
    if (!e.target.closest('.drag-handle')) toggleWindow(windowId);
  });

  const tabContainer = document.createElement('div');
  tabContainer.className = 'window-tabs' + (isCollapsed ? ' collapsed' : '');

  tabs.forEach(tab => tabContainer.appendChild(createTabElement(tab, timestamps)));

  windowGroup.appendChild(windowHeader);
  windowGroup.appendChild(tabContainer);

  return windowGroup;
}

// --- Drag and drop ---

function handleDragStart(e) {
  dragSrcId = this.dataset.windowId;
  e.dataTransfer.effectAllowed = 'move';
  // Delay so the drag image renders before the class is applied
  setTimeout(() => this.classList.add('dragging'), 0);
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  if (this.dataset.windowId !== dragSrcId) {
    this.classList.add('drag-over');
  }
}

function handleDragLeave() {
  this.classList.remove('drag-over');
}

function handleDrop(e) {
  e.stopPropagation();
  this.classList.remove('drag-over');
  const targetId = this.dataset.windowId;
  if (dragSrcId === targetId) return;

  const tabList = document.getElementById('tabList');
  const srcEl = tabList.querySelector(`[data-window-id="${dragSrcId}"]`);
  const tgtEl = tabList.querySelector(`[data-window-id="${targetId}"]`);
  if (!srcEl || !tgtEl) return;

  const children = [...tabList.children];
  const srcIdx = children.indexOf(srcEl);
  const tgtIdx = children.indexOf(tgtEl);

  if (srcIdx < tgtIdx) {
    tabList.insertBefore(srcEl, tgtEl.nextSibling);
  } else {
    tabList.insertBefore(srcEl, tgtEl);
  }

  saveGroupOrder();
}

function handleDragEnd() {
  this.classList.remove('dragging');
  document.querySelectorAll('.window-group').forEach(el => el.classList.remove('drag-over'));
}

function saveGroupOrder() {
  const tabList = document.getElementById('tabList');
  groupOrder = [...tabList.querySelectorAll('.window-group')].map(el => el.dataset.windowId);
  browser.storage.local.set({ groupOrder });
}

// --- Toggle collapse ---

function toggleWindow(windowId) {
  const key = String(windowId);
  if (collapsedWindows.has(key)) {
    collapsedWindows.delete(key);
  } else {
    collapsedWindows.add(key);
  }
  browser.storage.local.set({ collapsedWindows: [...collapsedWindows] });

  const windowGroup = document.querySelector(`[data-window-id="${windowId}"]`);
  if (windowGroup) {
    windowGroup.querySelector('.window-tabs').classList.toggle('collapsed');
    windowGroup.querySelector('.window-chevron').classList.toggle('collapsed');
  }
}

// --- Tab element ---

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
  if (tab.active) tabItem.classList.add('active');

  const favicon = document.createElement('img');
  favicon.className = 'favicon';
  favicon.src = tab.favIconUrl || 'icons/icon-16.png';
  favicon.onerror = function() { this.src = 'icons/icon-16.png'; };

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

  tabItem.addEventListener('click', function() { switchToTab(tab.id); });

  tabItem.appendChild(favicon);
  tabItem.appendChild(tabInfo);
  tabItem.appendChild(closeBtn);

  return tabItem;
}

// --- Filter ---

function filterTabs(searchTerm) {
  const tabKeys = allTabs.map(tab => `tab_${tab.id}`);
  browser.storage.local.get(tabKeys, function(result) {
    const timestamps = {};
    tabKeys.forEach(k => { if (result[k]) timestamps[k] = result[k]; });

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

// --- Tab actions ---

function switchToTab(tabId) {
  browser.tabs.update(tabId, { active: true }, function(tab) {
    browser.windows.update(tab.windowId, { focused: true });
    window.close();
  });
}

function closeTab(tabId) {
  browser.tabs.remove(tabId, function() { loadTabs(); });
}

function closeAllTabs() {
  const tabIds = allTabs.filter(tab => !tab.active).map(tab => tab.id);
  if (tabIds.length > 0) {
    browser.tabs.remove(tabIds, function() { loadTabs(); });
  }
}

function updateTabCount(count) {
  document.getElementById('tabCount').textContent = count;
}
