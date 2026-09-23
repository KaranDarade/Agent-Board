export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    status: 'online',
    platform: 'vercel-edge',
    supabaseConnected: true,
    serverTime: Date.now()
  });
}
