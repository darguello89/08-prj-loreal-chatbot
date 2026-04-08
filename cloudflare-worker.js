// Cloudflare Worker for secure OpenAI calls
// Keep your OpenAI key in Cloudflare Secrets as OPENAI_API_KEY.

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    // Handle CORS preflight requests.
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed. Use POST." }),
        { status: 405, headers: corsHeaders },
      );
    }

    try {
      const apiKey = env.OPENAI_API_KEY;

      if (!apiKey) {
        return new Response(
          JSON.stringify({
            error: "Missing OPENAI_API_KEY secret in Cloudflare.",
          }),
          { status: 500, headers: corsHeaders },
        );
      }

      const userInput = await request.json();

      if (!userInput.messages || !Array.isArray(userInput.messages)) {
        return new Response(
          JSON.stringify({
            error: "Request body must include a messages array.",
          }),
          { status: 400, headers: corsHeaders },
        );
      }

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: userInput.messages,
            max_completion_tokens: 300,
          }),
        },
      );

      const data = await response.json();

      return new Response(JSON.stringify(data), { headers: corsHeaders });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Worker request failed",
          details: error instanceof Error ? error.message : "Unknown error",
        }),
        { status: 500, headers: corsHeaders },
      );
    }
  },
};
