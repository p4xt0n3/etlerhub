const state = {
  groups: [
    { stands: 'Standless', traits: 'All Hexed, All Mythic' },
  ],
};
const STORAGE_KEY = 'etler-hub-settings';
const THEME_KEY = 'etler-hub-theme';
const LOADER_FILE = '7fe22b5d56dfddd7a0c6f175b35f57c0.lua';
const DISCORD_INVITE_URL = 'https://discord.com/api/v10/invites/sDwYt2YUWt?with_counts=true';
const t = (key, variables) => window.i18n?.t(key, variables) ?? key;
const TRAIT_GROUPS = [
  {
    className: 'tier-one',
    traits: ['All Mythic', 'All Hexed', 'All Mythic Hexed'],
  },
  {
    className: 'tier-two',
    traits: ['Prime', 'Prime Hexed', 'Overflowing', 'Overflowing Hexed', 'Vampiric', 'Vampiric Hexed', 'Voided', 'Voided Hexed', 'Solar', 'Solar Hexed', 'Angelic', 'Angelic Hexed', 'Gambler', 'Gambler Hexed', 'Cursed', 'Cursed Hexed', 'Deferred', 'Deferred Hexed', 'True', 'True Hexed', 'Gluttonous', 'Gluttonous Hexed', 'Economic', 'Economic Hexed', 'Cultivation', 'Cultivation Hexed'],
  },
  {
    className: 'tier-three',
    traits: ['Godly', 'Godly Hexed', 'RCT', 'RCT Hexed', 'Ryoiki', 'Ryoiki Hexed', 'Temporal', 'Temporal Hexed', 'Spiritual', 'Spiritual Hexed'],
  },
];

const $ = (id) => document.getElementById(id);

function applyTheme(theme) {
  const nextTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = nextTheme;
  const isLight = nextTheme === 'light';
  $('theme-label').textContent = t(isLight ? 'theme.dark' : 'theme.light');
  $('theme-glyph').textContent = isLight ? '☀' : '☾';
  $('theme-toggle').setAttribute('aria-label', t(isLight ? 'theme.switchToDark' : 'theme.switchToLight'));
  $('theme-toggle').setAttribute('title', t(isLight ? 'theme.switchToDark' : 'theme.switchToLight'));
  document.querySelector('meta[name="theme-color"]').setAttribute('content', isLight ? '#f4f7fb' : '#080d16');
}

function bindTheme() {
  applyTheme(document.documentElement.dataset.theme);
  $('theme-toggle').addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
  });
}

function checked(id) {
  return $(id).checked;
}

function luaString(value) {
  return JSON.stringify(value || '');
}

function luaList(value) {
  const values = Array.isArray(value) ? value : String(value || '').split(',');
  return `{ ${values.map((item) => luaString(item.trim())).filter((item) => item !== '""').join(', ')} }`;
}

function bool(id) {
  return checked(id) ? 'true' : 'false';
}

function currentGroups() {
  return [...document.querySelectorAll('.priority-row')].map((row) => ({
    stands: row.querySelector('[data-field="stands"]').value,
    traits: [...row.querySelectorAll('[data-trait]:checked')].map((input) => input.value).join(', '),
  }));
}

function traitValues(value) {
  return new Set(String(value || '').split(',').map((trait) => trait.trim()).filter(Boolean).map((trait) => trait === 'Any Hexed' ? 'All Hexed' : trait));
}

function traitPickerMarkup(selected, index) {
  const options = TRAIT_GROUPS.map((group) => group.traits.map((trait) => `
    <label class="trait-option ${group.className}">
      <input type="checkbox" data-trait value="${escapeAttribute(trait)}" ${selected.has(trait) ? 'checked' : ''} />
      <span>${trait}</span>
    </label>
  `).join('')).join('');
  const summary = selected.size ? [...selected].slice(0, 2).join(', ') + (selected.size > 2 ? ` +${selected.size - 2}` : '') : t('trait.select');
  return `<div class="trait-picker" data-field="traits" data-picker-index="${index}">
    <button class="trait-trigger" type="button" aria-haspopup="listbox" aria-expanded="false"><span class="trait-summary ${selected.size ? '' : 'placeholder'}">${summary}</span><span class="trait-chevron">⌄</span></button>
    <div class="trait-menu" role="listbox" aria-label="${t('trait.choices')}" data-i18n-attr="aria-label:trait.choices">
      <div class="trait-menu-heading">${t('trait.heading')}</div>
      <div class="trait-options">${options}</div>
    </div>
  </div>`;
}

function renderGroups() {
  const container = $('priority-groups');
  container.innerHTML = state.groups.map((group, index) => `
    <div class="priority-row" data-index="${index}">
      <span class="group-index">${String(index + 1).padStart(2, '0')}</span>
      <input data-field="stands" type="text" value="${escapeAttribute(group.stands)}" placeholder="${t('trait.standsPlaceholder')}" aria-label="${t('trait.standsPlaceholder')} ${index + 1}" />
      ${traitPickerMarkup(traitValues(group.traits), index)}
      <button class="remove-group" type="button" aria-label="${t('trait.remove', { n: index + 1 })}">×</button>
    </div>
  `).join('');

  container.querySelectorAll('input').forEach((input) => input.addEventListener('input', updateConfig));
  container.querySelectorAll('.trait-picker').forEach((picker) => {
    const trigger = picker.querySelector('.trait-trigger');
    picker.querySelector('.trait-menu').addEventListener('click', (event) => event.stopPropagation());
    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      document.querySelectorAll('.trait-picker.open').forEach((other) => {
        if (other !== picker) {
          other.classList.remove('open');
          other.querySelector('.trait-trigger').setAttribute('aria-expanded', 'false');
        }
      });
      picker.classList.toggle('open');
      trigger.setAttribute('aria-expanded', picker.classList.contains('open') ? 'true' : 'false');
    });
    picker.querySelectorAll('[data-trait]').forEach((input) => input.addEventListener('change', () => {
      const selected = [...picker.querySelectorAll('[data-trait]:checked')].map((item) => item.value);
      const summary = picker.querySelector('.trait-summary');
      summary.textContent = selected.length ? selected.slice(0, 2).join(', ') + (selected.length > 2 ? ` +${selected.length - 2}` : '') : t('trait.select');
      summary.classList.toggle('placeholder', !selected.length);
      updateConfig();
    }));
  });
  container.querySelectorAll('.remove-group').forEach((button) => button.addEventListener('click', () => {
    const index = Number(button.closest('.priority-row').dataset.index);
    state.groups = currentGroups();
    state.groups.splice(index, 1);
    if (!state.groups.length) state.groups.push({ stands: '', traits: '' });
    renderGroups();
    updateConfig();
  }));
}

function escapeAttribute(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function getRarities() {
  return [...document.querySelectorAll('.rarity-list input:checked')].map((input) => input.value);
}

function makeLua() {
  const groups = currentGroups();
  const groupsLua = groups.map((group) => `    { Stands = ${luaList(group.stands)}, Wanted_Traits = ${luaList(group.traits)} },`).join('\n');
  const floor = Math.max(0, Number($('floor-cap').value) || 0);
  const fps = Math.max(1, Number($('fps-cap').value) || 60);
  const skills = luaList($('skill-keys').value);
  const key = $('script-key').value || 'YOUR KEY HERE';
  const webhook = $('webhook').value.trim();
  const skinWebhook = webhook;
  const skins = checked('skins-enabled') ? `  Skins_Settings = {
    Recycle = ${bool('recycle')},
    Keep_Rarities = ${luaList(getRarities())},
    Keep_Premium = ${bool('keep-premium')},
    Keep_Unusuals = ${bool('keep-unusuals')},
    Forge_Unusuals = ${bool('forge-unusuals')},
    Buy_Crates = ${bool('buy-crates')},
    WebHook = ${luaString(skinWebhook)},
  },

` : '';

  return `getgenv().Config = {

  Stands_Swap_Priority = {
${groupsLua}
  },

  Floor_Cap = ${floor},
  WebHook = ${luaString(webhook)},

  ItemsToKeep = ${luaList($('items-to-keep').value)},

  Optimization = { Fps_Cap = ${fps}, Eco_Mode = ${bool('eco-mode')}, Stop_Rendering = ${bool('stop-rendering')}, Debug_Mode = ${bool('debug-mode')} },

  Farming = { Auto_Chest = ${bool('auto-chest')}, Auto_Ascend = ${bool('auto-ascend')} },

  Combat = { Auto_Summon_Stand = ${bool('auto-summon')}, Auto_Buso_Haki = ${bool('auto-buso')}, Auto_Skills = ${bool('auto-skills')}, Skill_Keys = ${skills} },

${skins} 
}

script_key = ${luaString(key)};loadstring(game:HttpGet("https://api.luarmor.net/files/v4/loaders/${LOADER_FILE}"))()`;
}

function updateConfig() {
  state.groups = currentGroups();
  $('code-output').textContent = makeLua();
  $('config-state').textContent = t($('script-key').value ? 'config.ready' : 'config.unsaved');
  persistSettings();
}

function persistSettings() {
  const settings = { groups: state.groups };
  ['floor-cap', 'items-to-keep', 'auto-chest', 'auto-ascend', 'fps-cap', 'eco-mode', 'stop-rendering', 'debug-mode', 'auto-summon', 'auto-buso', 'auto-skills', 'skill-keys', 'skins-enabled', 'recycle', 'keep-premium', 'keep-unusuals', 'forge-unusuals', 'buy-crates'].forEach((id) => {
    const input = $(id);
    settings[id] = input.type === 'checkbox' ? input.checked : input.value;
  });
  settings.rarities = getRarities();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function restoreSettings() {
  try {
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!settings) return;
    if (Array.isArray(settings.groups) && settings.groups.length) state.groups = settings.groups;
    ['floor-cap', 'items-to-keep', 'auto-chest', 'auto-ascend', 'fps-cap', 'eco-mode', 'stop-rendering', 'debug-mode', 'auto-summon', 'auto-buso', 'auto-skills', 'skill-keys', 'skins-enabled', 'recycle', 'keep-premium', 'keep-unusuals', 'forge-unusuals', 'buy-crates'].forEach((id) => {
      const input = $(id);
      if (settings[id] === undefined) return;
      if (input.type === 'checkbox') input.checked = settings[id];
      else input.value = settings[id];
    });
    const savedRarities = new Set(settings.rarities || []);
    document.querySelectorAll('.rarity-list input').forEach((input) => { input.checked = savedRarities.has(input.value); });
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function flash(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(flash.timer);
  flash.timer = window.setTimeout(() => toast.classList.remove('show'), 1800);
}

async function copyConfig() {
  try {
    await navigator.clipboard.writeText(makeLua());
    flash(t('toast.configCopied'));
  } catch {
    const range = document.createRange();
    range.selectNodeContents($('code-output'));
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    flash(t('toast.selectConfig'));
  }
}

function downloadConfig() {
  const blob = new Blob([makeLua()], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'etler-config.lua';
  link.click();
  URL.revokeObjectURL(url);
  flash(t('toast.downloaded'));
}

function syncSkinOptions() {
  const enabled = checked('skins-enabled');
  $('skin-options').style.opacity = enabled ? '1' : '.38';
  $('skin-options').style.pointerEvents = enabled ? 'auto' : 'none';
}

async function fetchDiscordStats() {
  const backendResponse = await fetch('/api/discord-stats');
  if (backendResponse.ok) return backendResponse.json();

  const inviteResponse = await fetch(DISCORD_INVITE_URL, { headers: { accept: 'application/json' } });
  if (!inviteResponse.ok) throw new Error(`Discord request failed: ${inviteResponse.status}`);
  const invite = await inviteResponse.json();
  const profile = invite.profile || {};
  return {
    name: profile.name || invite.guild?.name || 'Etler Hub',
    online: invite.approximate_presence_count ?? profile.online_count ?? null,
    members: invite.approximate_member_count ?? profile.member_count ?? null,
  };
}

async function loadDiscordStats(attempt = 0) {
  try {
    const stats = await fetchDiscordStats();
    if (stats.name) $('discord-name').textContent = stats.name;
    if (Number.isFinite(stats.online)) $('discord-online').textContent = stats.online.toLocaleString();
    if (Number.isFinite(stats.members)) $('discord-members').textContent = stats.members.toLocaleString();
  } catch (error) {
    if (attempt < 2) {
      window.setTimeout(() => loadDiscordStats(attempt + 1), 600);
      return;
    }
    console.warn('Discord member counts unavailable', error);
  }
}

function bindGuide() {
  const trigger = $('quick-guide-trigger');
  const modal = $('guide-modal');
  if (!trigger || !modal) return;
  const dialog = modal.querySelector('.guide-dialog');
  const close = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    trigger.focus();
  };
  const open = () => {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    dialog.focus();
  };
  trigger.addEventListener('click', open);
  modal.querySelectorAll('[data-guide-close]').forEach((element) => element.addEventListener('click', close));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) close();
  });
}

function bindInputs() {
  document.querySelectorAll('input').forEach((input) => {
    if (!input.closest('#priority-groups')) input.addEventListener('input', updateConfig);
    if (input.type === 'checkbox' && !input.closest('#priority-groups')) input.addEventListener('change', updateConfig);
  });

  $('toggle-key').addEventListener('click', () => {
    const input = $('script-key');
    const visible = input.type === 'text';
    input.type = visible ? 'password' : 'text';
    $('toggle-key').textContent = t(visible ? 'config.showKey' : 'config.hideKey');
    $('toggle-key').setAttribute('aria-label', t(visible ? 'config.showKey' : 'config.hideKey'));
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.trait-picker.open').forEach((picker) => {
      picker.classList.remove('open');
      picker.querySelector('.trait-trigger').setAttribute('aria-expanded', 'false');
    });
  });
  $('add-group').addEventListener('click', () => {
    state.groups = currentGroups();
    state.groups.push({ stands: '', traits: '' });
    renderGroups();
    const rows = document.querySelectorAll('.priority-row');
    rows[rows.length - 1].querySelector('input').focus();
    updateConfig();
  });
  $('copy-config').addEventListener('click', copyConfig);
  $('download-config').addEventListener('click', downloadConfig);
  $('skins-enabled').addEventListener('change', () => {
    syncSkinOptions();
    updateConfig();
  });
}

bindTheme();
window.addEventListener('languagechange', () => {
  applyTheme(document.documentElement.dataset.theme);
  renderGroups();
  updateConfig();
});
restoreSettings();
renderGroups();
bindInputs();
bindGuide();
syncSkinOptions();
updateConfig();
loadDiscordStats();
