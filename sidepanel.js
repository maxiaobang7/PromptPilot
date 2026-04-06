// sidepanel.js — PromptPilot Side Panel Logic

(function () {
  'use strict';

  // ===== State =====
  let prompts = [];
  let activeCategory = 'all';
  let editingId = null;
  let fillingPrompt = null;

  // ===== Storage Helpers =====
  async function loadPrompts() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['prompts', 'autoSend'], (data) => {
        prompts = data.prompts || [];
        document.getElementById('autoSendToggle').checked = !!data.autoSend;
        resolve();
      });
    });
  }

  async function savePrompts() {
    return new Promise((resolve) => {
      chrome.storage.local.set({ prompts }, resolve);
    });
  }

  function saveAutoSend(val) {
    chrome.storage.local.set({ autoSend: val });
  }

  // ===== Variable Helpers =====
  function extractVars(text) {
    const matches = text.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];
    const seen = new Set();
    return matches
      .map(m => m.replace(/^\{\{|\}\}$/g, '').trim())
      .filter(v => {
        if (seen.has(v)) return false;
        seen.add(v);
        return true;
      });
  }

  function fillVars(template, values) {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const k = key.trim();
      return values[k] !== undefined && values[k] !== '' ? values[k] : match;
    });
  }

  function highlightVarsInPreview(text) {
    return text.replace(/\{\{([^}]+)\}\}/g, '<span class="var-highlight">{{$1}}</span>');
  }

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ===== UI Helpers =====
  function $(id) { return document.getElementById(id); }

  function showToast(msg, type = '') {
    const t = $('toast');
    t.textContent = msg;
    t.className = 'toast show' + (type ? ' ' + type : '');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.className = 'toast'; }, 2200);
  }

  function showModal(id) {
    $(id).classList.add('show');
  }

  function hideModal(id) {
    $(id).classList.remove('show');
  }

  // ===== Render =====
  function getCategories() {
    const cats = new Set();
    prompts.forEach(p => { if (p.category) cats.add(p.category); });
    return Array.from(cats).sort();
  }

  function renderCategories() {
    const container = $('categoryTabs');
    const cats = getCategories();
    container.innerHTML = '<button class="cat-tab' + (activeCategory === 'all' ? ' active' : '') + '" data-cat="all">全部</button>';
    cats.forEach(c => {
      container.innerHTML += '<button class="cat-tab' + (activeCategory === c ? ' active' : '') + '" data-cat="' + escHtml(c) + '">' + escHtml(c) + '</button>';
    });

    container.querySelectorAll('.cat-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        renderCategories();
        renderPromptList();
      });
    });
  }

  function renderPromptList() {
    const container = $('promptList');
    const search = $('searchInput').value.trim().toLowerCase();

    let filtered = prompts;
    if (activeCategory !== 'all') {
      filtered = filtered.filter(p => p.category === activeCategory);
    }
    if (search) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.content.toLowerCase().includes(search) ||
        (p.category || '').toLowerCase().includes(search)
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = '';
      $('emptyState') || container.insertAdjacentHTML('beforeend',
        `<div class="empty-state" id="emptyState">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <p>${search ? '没有找到匹配的提示词' : '还没有提示词'}</p>
          <span>${search ? '试试其他关键词' : '点击 <strong>+</strong> 创建你的第一条提示词'}</span>
        </div>`
      );
      return;
    }

    container.innerHTML = filtered.map(p => {
      const vars = extractVars(p.content);
      const preview = p.content.length > 100
        ? p.content.slice(0, 100) + '...'
        : p.content;

      return `
        <div class="prompt-card" data-id="${p.id}">
          <div class="card-header">
            <span class="card-title">${escHtml(p.name)}</span>
            <div class="card-actions">
              <button class="card-action-btn btn-edit" data-id="${p.id}" title="编辑">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="card-action-btn btn-copy" data-id="${p.id}" title="复制">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="card-preview">${highlightVarsInPreview(escHtml(preview))}</div>
          <div class="card-footer">
            ${p.category ? '<span class="card-category">' + escHtml(p.category) + '</span>' : '<span></span>'}
            ${vars.length > 0 ? '<span class="card-vars-count">' + vars.length + ' 个变量</span>' : ''}
          </div>
        </div>
      `;
    }).join('');

    // Bind click events
    container.querySelectorAll('.prompt-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking action buttons
        if (e.target.closest('.card-action-btn')) return;
        const id = card.dataset.id;
        handleUsePrompt(id);
      });
    });

    container.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(btn.dataset.id);
      });
    });

    container.querySelectorAll('.btn-copy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const p = prompts.find(p => p.id === btn.dataset.id);
        if (p) {
          navigator.clipboard.writeText(p.content).then(() => {
            showToast('已复制到剪贴板', 'success');
          });
        }
      });
    });
  }

  function escHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  // ===== Edit Modal =====
  function openEditModal(id = null) {
    editingId = id;
    const p = id ? prompts.find(p => p.id === id) : null;

    $('modalTitle').textContent = p ? '编辑提示词' : '新建提示词';
    $('editName').value = p ? p.name : '';
    $('editCategory').value = p ? (p.category || '') : '';
    $('editContent').value = p ? p.content : '';
    $('btnDeletePrompt').style.display = p ? 'inline-flex' : 'none';

    // Update category datalist
    const dl = $('categoryList');
    dl.innerHTML = getCategories().map(c => `<option value="${escHtml(c)}">`).join('');

    updateDetectedVars();
    updateDefaultVars(p);
    showModal('editModal');
    $('editName').focus();
  }

  function updateDetectedVars() {
    const vars = extractVars($('editContent').value);
    const container = $('detectedVars');
    if (vars.length === 0) {
      container.innerHTML = '';
      $('defaultVarsGroup').style.display = 'none';
      return;
    }
    container.innerHTML = vars.map(v => `
      <span class="var-tag-interactive" data-var="${escHtml(v)}">
        <span class="var-tag-name" title="点击重命名">{{${escHtml(v)}}}</span>
        <button class="var-tag-delete" data-var="${escHtml(v)}" title="删除此变量">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:10px;height:10px">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </span>
    `).join('');

    // Bind rename click
    container.querySelectorAll('.var-tag-name').forEach(tag => {
      tag.addEventListener('click', (e) => {
        e.stopPropagation();
        const varName = tag.closest('.var-tag-interactive').dataset.var;
        startRenameVar(varName, tag);
      });
    });

    // Bind delete click
    container.querySelectorAll('.var-tag-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const varName = btn.dataset.var;
        deleteVar(varName);
      });
    });

    $('defaultVarsGroup').style.display = 'block';
    updateDefaultVars();
  }

  function startRenameVar(oldName, tagEl) {
    const parentTag = tagEl.closest('.var-tag-interactive');
    const originalHtml = parentTag.innerHTML;

    parentTag.classList.add('editing');
    parentTag.innerHTML = `
      <input type="text" class="var-rename-input" value="${escHtml(oldName)}" data-old="${escHtml(oldName)}">
      <button class="var-rename-confirm" title="确认">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:11px;height:11px">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </button>
      <button class="var-rename-cancel" title="取消">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:11px;height:11px">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;

    const input = parentTag.querySelector('.var-rename-input');
    input.focus();
    input.select();

    const doRename = () => {
      const newName = input.value.trim();
      if (!newName || newName === oldName) {
        cancelRename();
        return;
      }
      renameVar(oldName, newName);
    };

    const cancelRename = () => {
      parentTag.classList.remove('editing');
      // Re-render to restore clean state
      updateDetectedVars();
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); doRename(); }
      if (e.key === 'Escape') { e.preventDefault(); cancelRename(); }
    });

    input.addEventListener('blur', (e) => {
      // Small delay to allow button clicks to fire first
      setTimeout(() => {
        if (parentTag.classList.contains('editing')) cancelRename();
      }, 150);
    });

    parentTag.querySelector('.var-rename-confirm').addEventListener('click', (e) => {
      e.stopPropagation();
      doRename();
    });

    parentTag.querySelector('.var-rename-cancel').addEventListener('click', (e) => {
      e.stopPropagation();
      cancelRename();
    });
  }

  function renameVar(oldName, newName) {
    const textarea = $('editContent');
    // Replace all {{oldName}} with {{newName}} in content
    const regex = new RegExp('\\{\\{\\s*' + escapeRegex(oldName) + '\\s*\\}\\}', 'g');
    textarea.value = textarea.value.replace(regex, '{{' + newName + '}}');
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    showToast(`已重命名：{{${oldName}}} → {{${newName}}}`, 'success');
  }

  function deleteVar(varName) {
    const textarea = $('editContent');
    const regex = new RegExp('\\{\\{\\s*' + escapeRegex(varName) + '\\s*\\}\\}', 'g');
    textarea.value = textarea.value.replace(regex, '');
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    showToast(`已删除变量 {{${varName}}}`, 'success');
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function updateDefaultVars(prompt = null) {
    const vars = extractVars($('editContent').value);
    const container = $('defaultVarsContainer');
    if (vars.length === 0) {
      container.innerHTML = '';
      return;
    }

    const existing = prompt ? (prompt.defaults || {}) : {};
    // Preserve currently typed values
    const currentDefaults = {};
    container.querySelectorAll('.default-var-row').forEach(row => {
      const label = row.querySelector('.default-var-label')?.textContent;
      const input = row.querySelector('input');
      if (label && input) currentDefaults[label] = input.value;
    });

    container.innerHTML = vars.map(v => {
      const val = currentDefaults[v] || existing[v] || '';
      return `
        <div class="default-var-row">
          <span class="default-var-label">${escHtml(v)}</span>
          <input type="text" data-var="${escHtml(v)}" value="${escHtml(val)}" placeholder="默认值（可选）">
        </div>
      `;
    }).join('');
  }

  function saveEdit() {
    const name = $('editName').value.trim();
    const content = $('editContent').value.trim();
    const category = $('editCategory').value.trim();

    if (!name) {
      showToast('请输入标题', 'error');
      $('editName').focus();
      return;
    }
    if (!content) {
      showToast('请输入提示词内容', 'error');
      $('editContent').focus();
      return;
    }

    // Gather defaults
    const defaults = {};
    $('defaultVarsContainer').querySelectorAll('.default-var-row input').forEach(input => {
      const v = input.dataset.var;
      if (v && input.value.trim()) defaults[v] = input.value.trim();
    });

    if (editingId) {
      const idx = prompts.findIndex(p => p.id === editingId);
      if (idx >= 0) {
        prompts[idx] = { ...prompts[idx], name, content, category, defaults, updatedAt: Date.now() };
      }
    } else {
      prompts.unshift({
        id: genId(),
        name,
        content,
        category,
        defaults,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }

    savePrompts();
    hideModal('editModal');
    renderCategories();
    renderPromptList();
    showToast(editingId ? '已更新' : '已创建', 'success');
    editingId = null;
  }

  function deletePrompt() {
    if (!editingId) return;
    if (!confirm('确定删除此提示词？')) return;
    prompts = prompts.filter(p => p.id !== editingId);
    savePrompts();
    hideModal('editModal');
    renderCategories();
    renderPromptList();
    showToast('已删除', 'success');
    editingId = null;
  }

  // ===== Use Prompt (fill) =====
  function handleUsePrompt(id) {
    const p = prompts.find(p => p.id === id);
    if (!p) return;

    const vars = extractVars(p.content);
    if (vars.length === 0) {
      // No variables — fill directly
      doFill(p.content);
    } else {
      // Open variable fill modal
      fillingPrompt = p;
      openVarModal(p, vars);
    }
  }

  function openVarModal(prompt, vars) {
    $('varModalTitle').textContent = prompt.name;
    const container = $('varFieldsContainer');
    const defaults = prompt.defaults || {};

    container.innerHTML = vars.map(v => `
      <div class="var-field">
        <label>{{${escHtml(v)}}}</label>
        <input type="text" data-var="${escHtml(v)}" value="${escHtml(defaults[v] || '')}" placeholder="输入 ${escHtml(v)}">
      </div>
    `).join('');

    updateVarPreview();
    showModal('varModal');

    // Live preview update
    container.querySelectorAll('input, textarea').forEach(input => {
      input.addEventListener('input', updateVarPreview);
    });

    // Focus first input
    const firstInput = container.querySelector('input');
    if (firstInput) firstInput.focus();
  }

  function updateVarPreview() {
    if (!fillingPrompt) return;
    const values = {};
    $('varFieldsContainer').querySelectorAll('[data-var]').forEach(input => {
      values[input.dataset.var] = input.value;
    });

    const filled = fillingPrompt.content.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const k = key.trim();
      const val = values[k];
      if (val !== undefined && val !== '') {
        return `<span class="var-filled">${escHtml(val)}</span>`;
      }
      return `<span class="var-empty">{{${escHtml(k)}}}</span>`;
    });

    $('varPreview').innerHTML = filled;
  }

  function confirmFillVars() {
    if (!fillingPrompt) return;
    const values = {};
    $('varFieldsContainer').querySelectorAll('[data-var]').forEach(input => {
      values[input.dataset.var] = input.value;
    });

    const finalText = fillVars(fillingPrompt.content, values);
    hideModal('varModal');
    doFill(finalText);
    fillingPrompt = null;
  }

  function doFill(text) {
    const autoSend = $('autoSendToggle').checked;

    chrome.runtime.sendMessage({
      type: 'FILL_PROMPT',
      text: text,
      autoSend: autoSend
    }, (response) => {
      if (chrome.runtime.lastError) {
        showToast('填充失败：无法连接页面', 'error');
        return;
      }
      if (response && response.success) {
        showToast(autoSend && response.sent ? '已填充并发送' : '已填充到输入框', 'success');
      } else {
        showToast('填充失败：' + (response?.error || '未知错误'), 'error');
      }
    });
  }

  // ===== Import / Export =====
  function exportData() {
    const data = JSON.stringify(prompts, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promptpilot-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('已导出 ' + prompts.length + ' 条提示词', 'success');
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data)) throw new Error('Invalid format');

        // Validate structure
        const valid = data.filter(p => p.name && p.content);
        if (valid.length === 0) throw new Error('No valid prompts found');

        // Merge — add IDs if missing
        valid.forEach(p => {
          if (!p.id) p.id = genId();
          if (!prompts.find(ep => ep.id === p.id)) {
            prompts.push(p);
          }
        });

        savePrompts();
        renderCategories();
        renderPromptList();
        hideModal('ioModal');
        showToast('已导入 ' + valid.length + ' 条提示词', 'success');
      } catch (err) {
        showToast('导入失败：文件格式不正确', 'error');
      }
    };
    reader.readAsText(file);
  }

  // ===== Site Detection =====
  function checkSite() {
    chrome.runtime.sendMessage({ type: 'CHECK_SITE' }, (response) => {
      const badge = $('siteBadge');
      const text = $('siteNameText');
      if (response && response.supported) {
        badge.classList.add('connected');
        text.textContent = response.siteName;
      } else {
        badge.classList.remove('connected');
        text.textContent = '未连接';
      }
    });
  }

  // ===== Variable Quick Insert =====
  let varInsertMode = false;
  let savedSelection = null;

  function updateInsertBtnState() {
    const textarea = $('editContent');
    const btn = $('btnWrapVar');
    const label = $('wrapVarLabel');

    if (!textarea || !btn) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const hasSelection = start !== end;

    btn.disabled = false;

    if (hasSelection) {
      const selectedText = textarea.value.substring(start, end).trim();
      btn.classList.add('has-selection');
      label.textContent = `将「${selectedText.length > 8 ? selectedText.slice(0, 8) + '…' : selectedText}」转为变量`;
    } else {
      btn.classList.remove('has-selection');
      label.textContent = '插入变量';
    }
  }

  function showVarNameInput() {
    const textarea = $('editContent');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const hasSelection = start !== end;
    const selectedText = hasSelection ? textarea.value.substring(start, end).trim() : '';

    savedSelection = { start, end, hasSelection, selectedText };
    varInsertMode = true;

    $('btnWrapVar').style.display = 'none';
    $('varNameGroup').style.display = 'flex';

    const nameInput = $('varNameInput');
    nameInput.value = selectedText;
    nameInput.focus();
    nameInput.select();
  }

  function hideVarNameInput() {
    varInsertMode = false;
    savedSelection = null;
    $('btnWrapVar').style.display = 'inline-flex';
    $('varNameGroup').style.display = 'none';
    $('varNameInput').value = '';
  }

  function confirmInsertVar() {
    const varName = $('varNameInput').value.trim();
    if (!varName) {
      showToast('请输入变量名', 'error');
      $('varNameInput').focus();
      return;
    }

    const textarea = $('editContent');
    const varTag = '{{' + varName + '}}';

    if (savedSelection) {
      const { start, end } = savedSelection;
      const before = textarea.value.substring(0, start);
      const after = textarea.value.substring(end);
      textarea.value = before + varTag + after;

      // Place cursor after inserted variable
      const newPos = start + varTag.length;
      textarea.setSelectionRange(newPos, newPos);
    } else {
      // Fallback: append at end
      textarea.value += varTag;
    }

    // Trigger input event to update detected vars
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.focus();

    hideVarNameInput();
    showToast('变量 {{' + varName + '}} 已插入', 'success');
  }

  // ===== Event Bindings =====
  function bindEvents() {
    $('btnAdd').addEventListener('click', () => openEditModal());
    $('btnCloseModal').addEventListener('click', () => hideModal('editModal'));
    $('btnCancelEdit').addEventListener('click', () => hideModal('editModal'));
    $('btnSavePrompt').addEventListener('click', saveEdit);
    $('btnDeletePrompt').addEventListener('click', deletePrompt);

    $('editContent').addEventListener('input', () => {
      updateDetectedVars();
      updateDefaultVars();
    });

    // Variable quick-insert: track selection changes
    $('editContent').addEventListener('mouseup', updateInsertBtnState);
    $('editContent').addEventListener('keyup', updateInsertBtnState);
    $('editContent').addEventListener('focus', updateInsertBtnState);

    $('btnWrapVar').addEventListener('click', showVarNameInput);
    $('btnConfirmVar').addEventListener('click', confirmInsertVar);
    $('btnCancelInsertVar').addEventListener('click', hideVarNameInput);

    $('varNameInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmInsertVar();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        hideVarNameInput();
      }
    });

    $('searchInput').addEventListener('input', renderPromptList);

    $('autoSendToggle').addEventListener('change', (e) => {
      saveAutoSend(e.target.checked);
    });

    // Variable modal
    $('btnCloseVarModal').addEventListener('click', () => { hideModal('varModal'); fillingPrompt = null; });
    $('btnCancelVar').addEventListener('click', () => { hideModal('varModal'); fillingPrompt = null; });
    $('btnFillPrompt').addEventListener('click', confirmFillVars);

    // Import/Export modal
    $('btnImportExport').addEventListener('click', () => showModal('ioModal'));
    $('btnCloseIOModal').addEventListener('click', () => hideModal('ioModal'));
    $('btnCloseIO').addEventListener('click', () => hideModal('ioModal'));
    $('btnExport').addEventListener('click', exportData);
    $('fileImport').addEventListener('change', (e) => {
      if (e.target.files[0]) importData(e.target.files[0]);
      e.target.value = '';
    });

    // Close modals on overlay click
    ['editModal', 'varModal', 'ioModal'].forEach(id => {
      $(id).addEventListener('click', (e) => {
        if (e.target === $(id)) {
          hideModal(id);
          if (id === 'varModal') fillingPrompt = null;
        }
      });
    });

    // Keyboard: Enter to fill in var modal
    $('varFieldsContainer')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        confirmFillVars();
      }
    });

    // Keyboard: Enter to save in edit modal
    $('editName').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        $('editContent').focus();
      }
    });
  }

  // ===== Init =====
  async function init() {
    await loadPrompts();
    bindEvents();
    renderCategories();
    renderPromptList();
    checkSite();

    // Re-check site periodically (tab might change)
    setInterval(checkSite, 3000);
  }

  init();
})();
