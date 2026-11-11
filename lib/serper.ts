export async function serperSearch(query: string): Promise<string> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) throw new Error("SERPER_API_KEY not set");

  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num: 5 }),
  });

  if (!res.ok) throw new Error(`Serper error: ${res.status}`);
  const data = await res.json();

  const snippets: string[] = [];
  for (const r of data.organic ?? []) {
    if (r.snippet) snippets.push(`${r.title}: ${r.snippet}`);
  }
  if (data.answerBox?.snippet) snippets.unshift(data.answerBox.snippet);
  return snippets.slice(0, 5).join("\n");
}
