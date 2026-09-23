export default function handler(req, res) {
  // If requested from Vercel, redirect to GitHub Releases where the binary is hosted
  const githubReleaseUrl = 'https://github.com/KaranDarade/Agent-Board/releases';
  res.writeHead(302, { Location: githubReleaseUrl });
  res.end();
}
