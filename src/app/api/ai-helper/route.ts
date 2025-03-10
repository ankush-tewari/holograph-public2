// /src/app/api/ai-helper/route.ts

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    if (!question) {
      return NextResponse.json({ error: "No question provided." }, { status: 400 });
    }

    const aiProvider = process.env.AI_PROVIDER || "chatgpt";
    let aiResponse = "AI is currently unavailable.";

    if (aiProvider === "chatgpt") {
      aiResponse = await fetchChatGPT(question);
    } else if (aiProvider === "claude") {
      aiResponse = await fetchClaude(question);
    } else if (aiProvider === "google") {
      aiResponse = await fetchGoogleAI(question);
    }

    return NextResponse.json({ answer: aiResponse });
  } catch (error) {
    console.error("❌ OpenAI API Error:", error);
    return NextResponse.json({ error: "Error processing request." }, { status: 500 });
  }
}

// ✅ Real ChatGPT API Integration
async function fetchChatGPT(question: string): Promise<string> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    console.error("❌ Missing OpenAI API Key");
    return "ChatGPT API key is missing.";
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an assistant specializing in US estate law." },
          { role: "user", content: question },
        ],
      }),
    });

        const data = await response.json();
        if (!data.choices || data.choices.length === 0) {
            console.error("❌ OpenAI API returned an unexpected response:", data);
            return "ChatGPT did not return a response.";
        }
        return data.choices?.[0]?.message?.content || "ChatGPT did not return a response.";
    } catch (error) {
        console.error("❌ OpenAI API Error:", error);
        return "Error communicating with ChatGPT.";
    }
}

// 🚧 Stubs for Claude and Google AI (To be implemented later)
async function fetchClaude(question: string): Promise<string> {
  return "Claude AI integration is not yet implemented.";
}

async function fetchGoogleAI(question: string): Promise<string> {
  return "Google AI integration is not yet implemented.";
}
