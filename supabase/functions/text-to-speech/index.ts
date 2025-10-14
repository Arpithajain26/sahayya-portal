const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, language = "english" } = await req.json();

    if (!text) {
      throw new Error("Text is required");
    }

    const languageMap: Record<string, string> = {
      english: "en",
      kannada: "kn",
      telugu: "te",
      hindi: "hi",
      tamil: "ta",
      malayalam: "ml",
      marathi: "mr",
      gujarati: "gu",
      punjabi: "pa",
      bengali: "bn",
      urdu: "ur",
    };

    const languageCode = languageMap[language.toLowerCase()] || "en";
    const encodedText = encodeURIComponent(text);
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${languageCode}&client=tw-ob&q=${encodedText}`;

    const audioResponse = await fetch(audioUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!audioResponse.ok) {
      throw new Error("Failed to generate audio");
    }

    const audioBlob = await audioResponse.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBlob)));

    return new Response(JSON.stringify({ audioContent: base64Audio }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Text-to-speech error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
