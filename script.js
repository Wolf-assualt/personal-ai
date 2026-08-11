const input = document.getElementById("userInput");
const chat = document.getElementById("chat");

let creatorToken = localStorage.getItem("yuva_creator_token");
let currentRole = localStorage.getItem("yuva_role");
let currentName = localStorage.getItem("yuva_name");

// ========================================
// CREATOR / FAMILY / FRIEND LOGIN
// ========================================

async function creatorLogin() {
    const passwordInput = document.getElementById("creatorPassword");
    const message = document.getElementById("loginMessage");

    const password = passwordInput.value.trim();

    if (!password) {
        message.textContent = "Please enter your password.";
        return;
    }

    message.textContent = "Checking...";

    try {
        const response = await fetch("/login", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            message.textContent =
                data.message || "Incorrect password.";
            return;
        }

        // Save authentication information
        creatorToken = data.token;
        currentRole = data.role;
        currentName = data.name;

        localStorage.setItem(
            "yuva_creator_token",
            creatorToken
        );

        localStorage.setItem(
            "yuva_role",
            currentRole
        );

        localStorage.setItem(
            "yuva_name",
            currentName
        );

        // Show the main application
        document.getElementById("loginScreen").style.display =
            "none";

        document.getElementById("app").style.display =
            "flex";

        updateRoleUI();

        // Greeting
        addMessage(data.greeting, "ai");

        passwordInput.value = "";

    } catch (error) {
        console.error("Login error:", error);

        message.textContent =
            "Unable to connect to YUVA AI.";
    }
}

// ========================================
// GUEST LOGIN
// ========================================

function continueAsGuest() {
    creatorToken = null;
    currentRole = "guest";
    currentName = "Guest";

    localStorage.removeItem("yuva_creator_token");
    localStorage.removeItem("yuva_role");
    localStorage.removeItem("yuva_name");

    document.getElementById("loginScreen").style.display =
        "none";

    document.getElementById("app").style.display =
        "flex";

    updateRoleUI();

    addMessage(
        "Hi! 👋 Welcome to YUVA AI. How can I help you?",
        "ai"
    );
}

// ========================================
// UPDATE ROLE DISPLAY
// ========================================

function updateRoleUI() {
    const status = document.getElementById("status");

    if (!status) return;

    if (currentRole === "creator") {
        status.textContent =
            "👑 Creator Mode • Yuva";
    }

    else if (currentRole === "partner") {
        status.textContent =
            "❤️ Creator's GF/Wife";
    }

    else if (currentRole === "brother") {
        status.textContent =
            "👦 Vishwa • Yuva's Brother";
    }

    else if (currentRole === "friend") {
        status.textContent =
            "🤝 Creator's Friend";
    }

    else {
        status.textContent =
            "Personal AI Assistant";
    }
}

// ========================================
// SEND MESSAGE
// ========================================

async function sendMessage() {
    const message = input.value.trim();

    if (!message) return;

    addMessage(message, "user");

    input.value = "";

    const typingId = addTypingMessage();

    try {
        const response = await fetch("/chat", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: message,
                token: creatorToken
            })
        });

        const data = await response.json();

        removeTypingMessage(typingId);

        if (!response.ok || !data.success) {
            addMessage(
                data.message ||
                "Something went wrong.",
                "ai"
            );

            return;
        }

        addMessage(data.reply, "ai");

        speakReply(data.reply);

    } catch (error) {
        console.error("Chat error:", error);

        removeTypingMessage(typingId);

        addMessage(
            "I couldn't connect to YUVA AI right now. 🧠❌",
            "ai"
        );
    }
}

// ========================================
// ENTER KEY
// ========================================

input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
});

// ========================================
// ADD MESSAGE
// ========================================

function addMessage(text, type) {
    const messageDiv = document.createElement("div");

    messageDiv.className =
        type === "user"
            ? "message user"
            : "message ai";

    const avatar =
        type === "user"
            ? "👤"
            : "🤖";

    messageDiv.innerHTML = `
        <div class="avatar">
            ${avatar}
        </div>

        <div class="bubble">
            ${escapeHTML(text).replace(/\n/g, "<br>")}
        </div>
    `;

    chat.appendChild(messageDiv);

    chat.scrollTop = chat.scrollHeight;
}

// ========================================
// TYPING INDICATOR
// ========================================

function addTypingMessage() {
    const id =
        "typing-" +
        Date.now();

    const messageDiv =
        document.createElement("div");

    messageDiv.id = id;

    messageDiv.className =
        "message ai";

    messageDiv.innerHTML = `
        <div class="avatar">
            🤖
        </div>

        <div class="bubble">
            <span>Thinking...</span>
        </div>
    `;

    chat.appendChild(messageDiv);

    chat.scrollTop = chat.scrollHeight;

    return id;
}

function removeTypingMessage(id) {
    const element =
        document.getElementById(id);

    if (element) {
        element.remove();
    }
}

// ========================================
// HTML SAFETY
// ========================================

function escapeHTML(text) {
    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}

// ========================================
// VOICE INPUT (Speech-to-Text)
// ========================================

const SpeechRecognitionAPI =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let recognition = null;
let isListening = false;

if (SpeechRecognitionAPI) {
    recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = function () {
        isListening = true;

        const micButton = document.getElementById("micButton");

        if (micButton) {
            micButton.classList.add("listening");
            micButton.textContent = "⏺️";
        }
    };

    recognition.onresult = function (event) {
        const transcript =
            event.results[0][0].transcript;

        input.value = transcript;
    };

    recognition.onerror = function (error) {
        console.error("Speech recognition error:", error);
    };

    recognition.onend = function () {
        isListening = false;

        const micButton = document.getElementById("micButton");

        if (micButton) {
            micButton.classList.remove("listening");
            micButton.textContent = "🎤";
        }
    };
}

function toggleVoiceInput() {
    if (!recognition) {
        addMessage(
            "Voice input isn't supported in this browser. Try Chrome or Edge.",
            "ai"
        );
        return;
    }

    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

// ========================================
// VOICE OUTPUT (Text-to-Speech)
// ========================================

let voiceOutputEnabled =
    localStorage.getItem("yuva_voice_output") === "true";

function updateVoiceToggleUI() {
    const voiceToggle = document.getElementById("voiceToggle");

    if (!voiceToggle) return;

    voiceToggle.textContent = voiceOutputEnabled
        ? "🔊 Voice: On"
        : "🔊 Voice: Off";
}

function toggleVoiceOutput() {
    voiceOutputEnabled = !voiceOutputEnabled;

    localStorage.setItem(
        "yuva_voice_output",
        voiceOutputEnabled
    );

    updateVoiceToggleUI();

    // Stop mid-speech if turning off
    if (!voiceOutputEnabled) {
        window.speechSynthesis.cancel();
    }
}

function speakReply(text) {
    if (!voiceOutputEnabled) return;

    if (!("speechSynthesis" in window)) return;

    // Cancel anything currently being spoken first
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.lang = "en-US";

    window.speechSynthesis.speak(utterance);
}

// ========================================
// CLEAR MEMORY (New Chat)
// ========================================

async function clearMemory() {
    try {
        await fetch("/clear-memory", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                token: creatorToken
            })
        });
    } catch (error) {
        console.error("Clear memory error:", error);
    }

    // Wipe the visible chat window too
    chat.innerHTML = "";

    addMessage(
        "Memory cleared. Starting fresh! 🧠✨",
        "ai"
    );
}

// ========================================
// LOGOUT
// ========================================

async function creatorLogout() {
    try {
        if (creatorToken) {
            await fetch("/logout", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    token: creatorToken
                })
            });
        }
    } catch (error) {
        console.error("Logout error:", error);
    }

    creatorToken = null;
    currentRole = null;
    currentName = null;

    localStorage.removeItem(
        "yuva_creator_token"
    );

    localStorage.removeItem(
        "yuva_role"
    );

    localStorage.removeItem(
        "yuva_name"
    );

    location.reload();
}

// ========================================
// CHECK EXISTING SESSION
// ========================================

async function checkExistingSession() {
    if (!creatorToken) {
        return;
    }

    try {
        const response = await fetch(
            "/verify-creator",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    token: creatorToken
                })
            }
        );

        const data = await response.json();

        if (
            data.success &&
            data.authenticated
        ) {
            currentRole = data.role;
            currentName = data.name;

            localStorage.setItem(
                "yuva_role",
                currentRole
            );

            localStorage.setItem(
                "yuva_name",
                currentName
            );

            document.getElementById(
                "loginScreen"
            ).style.display = "none";

            document.getElementById(
                "app"
            ).style.display = "flex";

            updateRoleUI();

        } else {
            creatorToken = null;

            localStorage.removeItem(
                "yuva_creator_token"
            );

            localStorage.removeItem(
                "yuva_role"
            );

            localStorage.removeItem(
                "yuva_name"
            );
        }

    } catch (error) {
        console.error(
            "Session check failed:",
            error
        );
    }
}

// ========================================
// INITIALIZE
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const app =
            document.getElementById("app");

        if (app) {
            app.style.display = "none";
        }

        checkExistingSession();

        updateVoiceToggleUI();
    }
);
// ========================================
// CURSOR / TOUCH GLOW
// ========================================

const cursorGlow =
    document.getElementById("cursorGlow");

if (cursorGlow) {

    document.addEventListener(
        "pointermove",
        function (event) {

            cursorGlow.style.left =
                event.clientX + "px";

            cursorGlow.style.top =
                event.clientY + "px";

            cursorGlow.style.opacity = "1";
        }
    );

    document.addEventListener(
        "pointerleave",
        function () {
            cursorGlow.style.opacity = "0";
        }
    );
}