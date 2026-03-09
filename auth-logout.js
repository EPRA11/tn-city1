export default function handler(req, res) {
  const params = new URLSearchParams({
    client_id:     '1480416371614552145',
    redirect_uri:  process.env.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope:         'identify guilds',
    prompt:        'none'
  });
  res.redirect(`https://discord.com/oauth2/authorize?${params}`);
}
