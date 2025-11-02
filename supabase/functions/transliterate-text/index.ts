import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, sourceLanguage, targetLanguage, mode } = await req.json();
    
    if (!text) {
      throw new Error('Text is required');
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    
    if (mode === "transliterate") {
      // Transliteration: Convert phonetic English to native script
      if (sourceLanguage === "auto") {
        systemPrompt = `You are an expert in Indian language transliteration. The user has typed text phonetically using English letters. Detect which Indian language they intended (Kannada, Hindi, Tamil, Telugu, Tulu, Malayalam, etc.) and convert it to the proper native script. Return ONLY the transliterated text in the native script without any explanation. If the text is already in a native script or is English, return it as-is.`;
      } else {
        systemPrompt = `You are an expert in ${sourceLanguage} transliteration. Convert the phonetically typed English text into proper ${sourceLanguage} script. Return ONLY the transliterated text in ${sourceLanguage} native script without any explanation.`;
      }
    } else if (mode === "translate") {
      // Translation: Translate from one language to another
      systemPrompt = `You are a professional translator. Translate the given text from ${sourceLanguage === "auto" ? "any language (auto-detect)" : sourceLanguage} to ${targetLanguage}. Return ONLY the translated text without any additional explanation or formatting.`;
    } else if (mode === "both") {
      // Both: Transliterate first, then translate
      systemPrompt = `You are an expert in Indian languages. First, if the text is typed phonetically in English, convert it to the proper native script (auto-detect the intended language: Kannada, Hindi, Tamil, Telugu, etc.). Then translate it to ${targetLanguage}. Return the result in this format:
Native Script: [transliterated text]
Translation: [translated text]`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: text
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Transliteration service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const convertedText = result.choices?.[0]?.message?.content || "";

    // Parse the result if mode is "both"
    let nativeScript = "";
    let translation = "";
    
    if (mode === "both" && convertedText.includes("Native Script:")) {
      const lines = convertedText.split("\n");
      for (const line of lines) {
        if (line.startsWith("Native Script:")) {
          nativeScript = line.replace("Native Script:", "").trim();
        } else if (line.startsWith("Translation:")) {
          translation = line.replace("Translation:", "").trim();
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        convertedText,
        nativeScript: nativeScript || null,
        translation: translation || null
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Transliteration error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
