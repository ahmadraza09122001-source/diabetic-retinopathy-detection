import { NextResponse } from "next/server";

// Server-side only (no NEXT_PUBLIC_ prefix) so the model API's real address is
// never sent to the browser. Defaults to the local Flask dev server; set this
// to your Hugging Face Space / ngrok URL for anything other than local dev.
const FLASK_API_URL = process.env.FLASK_API_URL || "http://127.0.0.1:5000/predict";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req) {
  let incomingForm;
  try {
    incomingForm = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data with an image file." }, { status: 400 });
  }

  const file = incomingForm.get("image");
  if (!file) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const forwardForm = new FormData();
  forwardForm.append("image", file);

  try {
    const modelRes = await fetch(FLASK_API_URL, {
      method: "POST",
      body: forwardForm,
      signal: AbortSignal.timeout(55_000),
    });

    const data = await modelRes.json();
    return NextResponse.json(data, { status: modelRes.status });
  } catch (err) {
    console.error("predict proxy error:", err);
    return NextResponse.json(
      { error: "Could not reach the model API. Is the Flask backend running?" },
      { status: 502 }
    );
  }
}
