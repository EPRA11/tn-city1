export default function handler(req, res) {
  const cookie = req.headers.cookie;
  if (!cookie) return res.status(200).json({ loggedIn: false });

  const rawCookie = cookie.split(';').find(c => c.trim().startsWith('tncity_user='));
  if (!rawCookie) return res.status(200).json({ loggedIn: false });

  try {
    const base64Data = rawCookie.split('=')[1];
    const userData = JSON.parse(Buffer.from(base64Data, 'base64').toString());
    res.status(200).json({ ...userData, loggedIn: true });
  } catch (e) {
    res.status(200).json({ loggedIn: false });
  }
}
