const THEME_KEY = 'etler-hub-theme';
const DISCORD_INVITE_URL = 'https://discord.com/api/v10/invites/sDwYt2YUWt?with_counts=true';

function applyTheme(theme) {
  const nextTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = nextTheme;
  const isLight = nextTheme === 'light';
  document.getElementById('theme-label').textContent = isLight ? 'Dark' : 'Light';
  document.getElementById('theme-glyph').textContent = isLight ? '☀' : '☾';
  document.getElementById('theme-toggle').setAttribute('aria-label', `Switch to ${isLight ? 'dark' : 'light'} mode`);
  document.getElementById('theme-toggle').setAttribute('title', `Switch to ${isLight ? 'dark' : 'light'} mode`);
  document.querySelector('meta[name="theme-color"]').setAttribute('content', isLight ? '#f4f7fb' : '#080d16');
}

function flash(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(flash.timer);
  flash.timer = window.setTimeout(() => toast.classList.remove('show'), 1800);
}

async function copyFreeScript() {
  const value = document.getElementById('free-loadstring').textContent;
  try {
    await navigator.clipboard.writeText(value);
    document.getElementById('copy-state').textContent = 'COPIED';
    flash('Loadstring copied to clipboard');
  } catch {
    const range = document.createRange();
    range.selectNodeContents(document.getElementById('free-loadstring'));
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    flash('Select and copy the loadstring');
  }
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
    if (stats.name) document.getElementById('discord-name').textContent = stats.name;
    if (Number.isFinite(stats.online)) document.getElementById('discord-online').textContent = stats.online.toLocaleString();
    if (Number.isFinite(stats.members)) document.getElementById('discord-members').textContent = stats.members.toLocaleString();
  } catch (error) {
    if (attempt < 2) {
      window.setTimeout(() => loadDiscordStats(attempt + 1), 600);
      return;
    }
    console.warn('Discord member counts unavailable', error);
  }
}

applyTheme(document.documentElement.dataset.theme);
document.getElementById('theme-toggle').addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  applyTheme(nextTheme);
  localStorage.setItem(THEME_KEY, nextTheme);
});
document.getElementById('copy-free-script').addEventListener('click', copyFreeScript);
loadDiscordStats();
