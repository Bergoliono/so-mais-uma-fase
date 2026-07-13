export function GET() {
  const content =
    process.env.ADS_TXT_CONTENT?.trim() ||
    "# ads.txt será configurado quando AdSense/GAM estiver aprovado.\n";

  return new Response(`${content}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
