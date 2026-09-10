const DISCORD_INVITE_URL = 'https://discord.com/api/v10/invites/sDwYt2YUWt?with_counts=true';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.pathname !== '/api/discord-stats') {
      return new Response('Not found', { status: 404 });
    }

    try {
      const response = await fetch(DISCORD_INVITE_URL);
      if (!response.ok) return Response.json({ error: 'Discord is unavailable' }, { status: 502 });
      const invite = await response.json();
      const profile = invite.profile || {};
      return Response.json({
        name: profile.name || invite.guild?.name || 'Etler Hub',
        online: invite.approximate_presence_count ?? null,
        members: invite.approximate_member_count ?? null,
      }, { headers: { 'cache-control': 'public, max-age=60' } });
    } catch {
      return Response.json({ error: 'Discord is unavailable' }, { status: 502 });
    }
  },
};
