export default function handler(req, res) {
  res.setHeader('Set-Cookie', 'tncity_user=; Path=/; Max-Age=0; SameSite=Lax');
  res.redirect('/');
}
