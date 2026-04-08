/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");

// Paste your deployed Cloudflare Worker URL here.
const WORKER_URL = "https://08-prj-loreal-chatbot.darguello89.workers.dev";

/*
  System prompt:
  Keep the chatbot focused only on L'Oreal products, routines, and recommendations.
*/
const SYSTEM_PROMPT =
  "You are a L'Oreal Beauty Advisor chatbot. You must only answer questions related to L'Oreal products, L'Oreal ingredients, L'Oreal beauty routines, product usage, and L'Oreal recommendations. If a question is not about L'Oreal or beauty-related guidance, politely refuse. Use this refusal style: 'Sorry, I can only help with L'Oreal products, routines, and beauty recommendations. Please ask a L'Oreal-related question.' Keep all answers clear, practical, and friendly.";

// Store chat history so each new API call includes prior context.
const messages = [{ role: "system", content: SYSTEM_PROMPT }];

// Add a chat message to the UI.
function appendMessage(role, text) {
  const messageEl = document.createElement("p");
  messageEl.classList.add("msg", role === "user" ? "user" : "ai");

  const speaker = role === "user" ? "You" : "L'Oreal Advisor";
  messageEl.textContent = `${speaker}: ${text}`;

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
  userInput.value = "";

  // Add user message to API conversation history.
  messages.push({ role: "user", content: userText });

  // Prevent multiple submissions while waiting for the API response.
  sendBtn.disabled = true;

  try {
    if (WORKER_URL === "PASTE_YOUR_CLOUDFLARE_WORKER_URL_HERE") {
      throw new Error("Cloudflare Worker URL is not set");
    }

    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages,
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
