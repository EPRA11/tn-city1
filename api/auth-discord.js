import https from 'https';

function post(url, params) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(params).toString();
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname, 
      path: u.pathname, 
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded', 
        'Content-Length': Buffer.byteLength(body) 
      }
    }, (r) => { 
      let d=''; 
      r.on('data', c => d += c); 
      r.on('end', () => {
        try { resolve(JSON.parse(d)); } catch(e) { reject(e); }
      }); 
    });
    req.on('error', reject); 
    req.write(body); 
    req.end();
  });
}

function get(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname, 
      path: u.pathname, 
      method: 'GET',
      headers: { Authorization: token }
    }, (r) => { 
      let d=''; 
      r.on('data', c => d += c); 
      r.on('end', () => {
        try { resolve(JSON.parse(d)); } catch(e) { reject(e); }
      }); 
    });
    req.on('error', reject); 
    req.end();
  });
}

export default async function handler(req, res) {
  const { code, error } = req.query;
  if (error || !code) return res.redirect('/?error=denied');

  try {
    // تبادل الكود بـ token باستخدام البيانات من Vercel
    const tokenData = await post('https://discord.com/api/v10/oauth2/token', {
      client_id:     '1480416371614552145',
      client_secret: process.env.DISCORD_CLIENT_SECRET, 
      grant_type:    'authorization_code',
      code:          code,
      redirect_uri:  process.env.DISCORD_REDIRECT_URI
    });

    if (tokenData.error) {
      console.error("Token Error:", tokenData);
      return res.redirect('/?error=auth_failed');
    }

    const auth = `${tokenData.token_type} ${tokenData.access_token}`;

    // جلب بيانات المستخدم (ID، الاسم، الأفاتار)
    const user = await get('https://discord.com/api/v10/users/@me', auth);

    // التحقق من عضوية السيرفر (إذا كنت وضعت GUILD_ID في Vercel)
    let isMember = true;
    if (process.env.DISCORD_GUILD_ID) {
      try {
        const guilds = await get('https://discord.com/api/v10/users/@me/guilds', auth);
        isMember = guilds.some(g => g.id === process.env.DISCORD_GUILD_ID);
      } catch(e) { isMember = false; }
    }

    // تجهيز رابط صورة الأفاتار
    const avatar = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator||'0')%5}.png`;

    // البيانات اللي بنحفظها في المتصفح (Cookie)
    const userData = {
      id: user.id,
      username: user.username,
      displayName: user.global_name || user.username,
      avatar,
      isMember,
      loginAt: new Date().toISOString()
    };

    // تشفير البيانات وحفظها في الكوكي (Base64)
    const cookieValue = Buffer.from(JSON.stringify(userData)).toString('base64');
    res.setHeader('Set-Cookie', `tncity_user=${cookieValue}; Path=/; Max-Age=86400; SameSite=Lax`);
    
    // التوجه لصفحة لوحة التحكم
    res.redirect('/dashboard.html');

  } catch(e) {
    console.error("Auth System Error:", e.message);
    res.redirect('/?error=server_error');
  }
}
