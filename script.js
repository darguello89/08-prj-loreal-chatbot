/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");
const latestQuestion = document.getElementById("latestQuestion");

// Paste your deployed Cloudflare Worker URL here.
const WORKER_URL = "https://08-prj-loreal-chatbot.darguello89.workers.dev";

/*
  System prompt:
  Keep the chatbot focused only on L'Oreal products, routines, and recommendations.
*/
const SYSTEM_PROMPT =
  "You are a L'Oreal Beauty Advisor chatbot. You must only answer questions related to L'Oreal products, L'Oreal ingredients, L'Oreal beauty routines, product usage, and L'Oreal recommendations. If a question is not about L'Oreal or beauty-related guidance, politely refuse. Use this refusal style: 'Sorry, I can only help with L'Oreal products, routines, and beauty recommendations. Please ask a L'Oreal-related question.' Keep all answers clear, practical, and friendly.";

// Tracks conversation details to support natural multi-turn interactions.
const conversationState = {
  userName: "",
  pastQuestions: [],
};

// Store chat history so each new API call includes prior context.
const messages = [{ role: "system", content: SYSTEM_PROMPT }];

function detectUserName(text) {
  const patterns = [
    /\bmy name is\s+([a-zA-Z][a-zA-Z\-']*)/i,
    /\bi am\s+([a-zA-Z][a-zA-Z\-']*)/i,
    /\bi'm\s+([a-zA-Z][a-zA-Z\-']*)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return "";
}

function buildMemoryContext() {
  const namePart = conversationState.userName
    ? `User name: ${conversationState.userName}.`
    : "User name: unknown.";

  const recentQuestions = conversationState.pastQuestions.slice(-5);
  const questionPart = recentQuestions.length
    ? `Recent user questions: ${recentQuestions.join(" | ")}.`
    : "Recent user questions: none yet.";

  return `${namePart} ${questionPart}`;
}

// Add a chat message to the UI.
function appendMessage(role, text) {
  const messageEl = document.createElement("p");
  messageEl.classList.add("msg", role === "user" ? "user" : "ai");
  messageEl.textContent = text;

  chatWindow.appendChild(messageEl);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Initial assistant greeting.
appendMessage(
  "assistant",
  "Hello! Ask me about L'Oreal products, routines, and recommendations.",
);

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userText = userInput.value.trim();
  if (!userText) return;

  // Show the user's message in the chat and clear the input field.
  appendMessage("user", userText);
  latestQuestion.textContent = `Latest question: ${userText}`;
  userInput.value = "";

  // Update conversation memory (name + question history).
  const extractedName = detectUserName(userText);
  if (extractedName) {
    conversationState.userName = extractedName;
  }
  conversationState.pastQuestions.push(userText);

  // Add user message to API conversation history.
  messages.push({ role: "user", content: userText });

  // Prevent multiple submissions while waiting for the API response.
  sendBtn.disabled = true;

  try {
    if (WORKER_URL === "PASTE_YOUR_CLOUDFLARE_WORKER_URL_HERE") {
      throw new Error("Cloudflare Worker URL is not set");
    }

    const requestMessages = [
      ...messages,
      { role: "system", content: buildMemoryContext() },
    ];

    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: requestMessages,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Read the assistant reply using the required response path.
    const assistantReply = data.choices[0].message.content;

    // Save assistant reply to the history and display it in the chat.
    messages.push({ role: "assistant", content: assistantReply });
    appendMessage("assistant", assistantReply);
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    appendMessage(
      "assistant",
      "Sorry, I could not get a response right now. Please try again in a moment.",
    );
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
});
