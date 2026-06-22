const ENDPOINT = "https://api.pdfcrowd.com/convert/24.04/";

export async function htmlToPdfBuffer(html: string): Promise<Buffer> {
  const username = process.env.PDFCROWD_USERNAME;
  const apiKey = process.env.PDFCROWD_API_KEY;
  if (!username || !apiKey) throw new Error("PDFCROWD_USERNAME / PDFCROWD_API_KEY are not set");

  const form = new FormData();
  form.append("text", html);
  form.append("content_viewport_width", "balanced");

  const auth = Buffer.from(`${username}:${apiKey}`).toString("base64");
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}` },
    body: form,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PDFCrowd error (${response.status}): ${errorText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}