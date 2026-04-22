let allTabs = [];
let windowNumberMap = {};
let groupOrder = [];
let groupNames = {};
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
  const closeAllConfirm = document.getElementById('closeAllConfirm');
  const closeAllConfirmBtn = document.getElementById('closeAllConfirmBtn');
  const closeAllCancelBtn = document.getElementById('closeAllCancelBtn');

  closeAllBtn.addEventListener('click', () => {
    closeAllBtn.classList.add('hidden');
    closeAllConfirm.classList.remove('hidden');
  });

  closeAllCancelBtn.addEventListener('click', () => {
    closeAllConfirm.classList.add('hidden');
    closeAllBtn.classList.remove('hidden');
  });

  closeAllConfirmBtn.addEventListener('click', () => {
    closeAllTabs();
    closeAllConfirm.classList.add('hidden');
    closeAllBtn.classList.remove('hidden');
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
    browser.storage.local.get(['collapsedWindows', 'groupOrder', 'groupNames', ...tabKeys], function(result) {
      collapsedWindows.clear();
      (result.collapsedWindows || []).forEach(id => collapsedWindows.add(String(id)));
      groupOrder = result.groupOrder || [];
      groupNames = result.groupNames || {};

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

  windowGroup.addEventListener('dragstart', handleDragStart);
  windowGroup.addEventListener('dragover', handleDragOver);
  windowGroup.addEventListener('dragleave', handleDragLeave);
  windowGroup.addEventListener('drop', handleDrop);
  windowGroup.addEventListener('dragend', handleDragEnd);

  const windowHeader = document.createElement('div');
  windowHeader.className = 'window-header';

  // Drag handle — 3-line SVG
  const dragHandle = document.createElement('span');
  dragHandle.className = 'drag-handle';
  dragHandle.title = 'Drag to reorder';
  dragHandle.innerHTML = `<svg width="12" height="10" viewBox="0 0 12 10" fill="none">
    <rect y="0" width="12" height="1.5" rx="0.75" fill="currentColor"/>
    <rect y="4" width="12" height="1.5" rx="0.75" fill="currentColor"/>
    <rect y="8" width="12" height="1.5" rx="0.75" fill="currentColor"/>
  </svg>`;

  const labelEl = document.createElement('span');
  labelEl.className = 'window-label';
  labelEl.textContent = groupNames[key] || label;

  const countBadge = document.createElement('span');
  countBadge.className = 'window-tab-count';
  countBadge.textContent = `${tabs.length} tab${tabs.length !== 1 ? 's' : ''}`;

  // Chevron — right-pointing SVG, rotates 90° when open
  const chevron = document.createElement('span');
  chevron.className = 'window-chevron';
  chevron.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M4 2.5L7.5 6L4 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  chevron.style.transition = 'transform 0.2s ease';
  chevron.style.transform = isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)';

  windowHeader.appendChild(dragHandle);
  windowHeader.appendChild(labelEl);
  windowHeader.appendChild(countBadge);
  windowHeader.appendChild(chevron);

  let toggleTimer = null;
  windowHeader.addEventListener('click', e => {
    if (e.target.closest('.drag-handle')) return;
    if (key !== 'pinned' && e.target.closest('.window-label')) {
      clearTimeout(toggleTimer);
      toggleTimer = setTimeout(() => toggleWindow(windowId), 220);
    } else {
      toggleWindow(windowId);
    }
  });

  if (key !== 'pinned') {
    labelEl.title = 'Double-click to rename';
    labelEl.addEventListener('dblclick', e => {
      e.stopPropagation();
      clearTimeout(toggleTimer);
      startRename(labelEl, key, label);
    });
  }

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

// --- Rename ---

function startRename(labelEl, key, defaultLabel) {
  const current = groupNames[key] || defaultLabel;

  const input = document.createElement('input');
  input.className = 'rename-input';
  input.value = current;
  input.setAttribute('size', Math.max(current.length, 10));

  labelEl.replaceWith(input);
  input.select();

  function commit() {
    const name = input.value.trim();
    if (name && name !== defaultLabel) {
      groupNames[key] = name;
    } else {
      delete groupNames[key];
    }
    browser.storage.local.set({ groupNames });
    input.replaceWith(labelEl);
    labelEl.textContent = groupNames[key] || defaultLabel;
  }

  function cancel() {
    input.replaceWith(labelEl);
  }

  input.addEventListener('blur', commit);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { input.removeEventListener('blur', commit); cancel(); }
  });
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
    const isNowCollapsed = collapsedWindows.has(key);
    windowGroup.querySelector('.window-tabs').classList.toggle('collapsed', isNowCollapsed);
    windowGroup.querySelector('.window-chevron').style.transform = isNowCollapsed ? 'rotate(0deg)' : 'rotate(90deg)';
  }
}

// --- Favicon / letter icon ---

const LETTER_COLORS = [
  '#1d1d1f', '#5E6AD2', '#FF6B6B', '#34C759',
  '#FF9500', '#007AFF', '#FF2D55', '#AF52DE',
  '#00C7BE', '#D97757',
];

function domainHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

function createFaviconEl(tab, domain) {
  const wrap = document.createElement('div');
  wrap.className = 'favicon-wrap';

  const candidates = [];
  if (tab.favIconUrl) candidates.push(tab.favIconUrl);
  if (domain) candidates.push(`https://${domain}/favicon.ico`);

  function tryNext() {
    if (candidates.length === 0) {
      wrap.appendChild(makeLetterIcon(domain));
      return;
    }
    const img = document.createElement('img');
    img.className = 'favicon';
    img.src = candidates.shift();
    img.onerror = () => {
      if (wrap.contains(img)) wrap.removeChild(img);
      tryNext();
    };
    wrap.appendChild(img);
  }

  tryNext();
  return wrap;
}

function makeLetterIcon(domain) {
  const letter = domain ? domain[0].toUpperCase() : '?';
  const color = LETTER_COLORS[domainHash(domain) % LETTER_COLORS.length];
  const el = document.createElement('div');
  el.className = 'favicon-letter';
  el.textContent = letter;
  el.style.background = color;
  return el;
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

  let domainStr = '';
  try { domainStr = new URL(tab.url).hostname.replace(/^www\./, ''); } catch {}

  const tabInfo = document.createElement('div');
  tabInfo.className = 'tab-info';

  const title = document.createElement('div');
  title.className = 'tab-title';
  title.textContent = tab.title || 'Untitled';
  title.title = tab.title;

  // Domain + elapsed on one line
  const tabMeta = document.createElement('div');
  tabMeta.className = 'tab-meta';

  const domain = document.createElement('div');
  domain.className = 'tab-url';
  domain.textContent = domainStr || tab.url;
  domain.title = tab.url;

  const openedAt = timestamps[`tab_${tab.id}`];
  const elapsed = document.createElement('span');
  elapsed.className = 'tab-elapsed';
  elapsed.textContent = openedAt ? formatElapsed(Date.now() - openedAt) : '';

  tabMeta.appendChild(domain);
  tabMeta.appendChild(elapsed);

  tabInfo.appendChild(title);
  tabInfo.appendChild(tabMeta);

  // Close button — hidden until hover (CSS handles opacity)
  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-btn';
  closeBtn.title = 'Close tab';
  closeBtn.innerHTML = `<svg width="8" height="8" viewBox="0 0 8 8" fill="none">
    <path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="#86868b" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`;
  closeBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    closeTab(tab.id);
  });

  tabItem.addEventListener('click', function() { switchToTab(tab.id); });

  tabItem.appendChild(createFaviconEl(tab, domainStr));
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
