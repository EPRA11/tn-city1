bash

cat /home/claude/tncity-simple/api/auth-callback.js
Output

import https from 'https';

function post(url, params) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(params).toString();
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname, path: u.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }
    }, (r) => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>resolve(JSON.parse(d))); });
    req.on('error', reject); req.write(body); req.end();
  });
}

function get(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname, path: u.pathname, method: 'GET',
      headers: { Authorization: token }
    }, (r) => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>resolve(JSON.parse(d))); });
    req.on('error', reject); req.end();
  });
}

export default async function handler(req, res) {
  const { code, error } = req.query;
  if (error || !code) return res.redirect('/?error=denied');

  try {
    // تبادل الكود بـ token
    const token = await post('https://discord.com/api/v10/oauth2/token', {
      client_id:     '1480416371614552145',
      client_secret: process.env.DISCORD_CLIENT_SECRET, // ← الـ Secret السري هنا فقط
      grant_type:    'authorization_code',
      code,
      redirect_uri:  process.env.DISCORD_REDIRECT_URI
    });

    if (token.error) return res.redirect('/?error=auth_failed');

    const auth = `${token.token_type} ${token.access_token}`;

    // بيانات المستخدم
    const user = await get('https://discord.com/api/v10/users/@me', auth);

    // عضوية السيرفر
    let isMember = true;
    try {
      const guilds = await get('https://discord.com/api/v10/users/@me/guilds', auth);
      isMember = guilds.some(g => g.id === process.env.DISCORD_GUILD_ID);
    } catch(e) {}

    // الأفاتار
    const avatar = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator||'0')%5}.png`;

    // حفظ بيانات المستخدم في كوكي
    const userData = {
      id: user.id,
      username: user.username,
      displayName: user.global_name || user.username,
      avatar,
      isMember,
      loginAt: new Date().toISOString()
    };

    res.setHeader('Set-Cookie', `tncity_user=${Buffer.from(JSON.stringify(userData)).toString('base64')}; Path=/; Max-Age=86400; SameSite=Lax`);
    res.redirect('/dashboard.html');

  } catch(e) {
    console.error(e.message);
    res.redirect('/?error=auth_failed');
  }
}
Done
انسخ هذا المحتوى كامل وحطه في الملف ✅

بعد ما تخلص الـ 4 ملفات لازم يصير هيك على GitHub:

📁 api/
   ├── auth-callback.js  ✅
   ├── auth-discord.js   ✅
   ├── auth-logout.js    ✅
   └── me.js             ✅
📄 index.html
📄 logo.webp
📄 vercel.json
أرسل صورة بعد ما تخلص وأتأكد ✅



