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

async function fetchDiscordStats() {
  const backendResponse = await fetch('/api/discord-stats');
  if (backendResponse.ok) return backendResponse.json();

  const inviteResponse = await fetch(DISCORD_INVITE_URL, { headers: { accept: 'application/json' } });
  if (!inviteResponse.ok) throw new Error(`Discord request failed: ${inviteResponse.status}`);
  const invite = await inviteResponse.json();
  const profile = invite.profile || {};
  return {
    online: invite.approximate_presence_count ?? profile.online_count ?? null,
    members: invite.approximate_member_count ?? profile.member_count ?? null,
  };
}

async function loadDiscordStats(attempt = 0) {
  try {
    const stats = await fetchDiscordStats();
    if (Number.isFinite(stats.online)) document.getElementById('home-discord-online').textContent = stats.online.toLocaleString();
    if (Number.isFinite(stats.members)) document.getElementById('home-discord-members').textContent = stats.members.toLocaleString();
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
loadDiscordStats();
