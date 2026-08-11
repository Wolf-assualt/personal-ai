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
function quickMessage(message) {
    if (!input) return;

    input.value = message;

    sendMessage();
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
        : `
            <span class="ai-avatar">
                <span class="ai-avatar-core"></span>
            </span>
          `;


    // AI MESSAGE
    if (type === "ai") {

        messageDiv.innerHTML = `
            <div class="avatar">
                ${avatar}
            </div>

            <div class="bubble">

                <div class="message-text">
                    ${escapeHTML(text).replace(/\n/g, "<br>")}
                </div>

                <button
                    class="copy-button"
                    type="button"
                    onclick="copyMessage(this)"
                    title="Copy response"
                >
                    📋
                </button>

            </div>
        `;

    }


    // USER MESSAGE
    else {

        messageDiv.innerHTML = `
            <div class="avatar">
                ${avatar}
            </div>

            <div class="bubble">
                ${escapeHTML(text).replace(/\n/g, "<br>")}
            </div>
        `;

    }


    chat.appendChild(messageDiv);

    chat.scrollTop = chat.scrollHeight;
}

// ========================================
// COPY AI MESSAGE
// ========================================

function copyMessage(button) {

    const messageText =
        button
            .parentElement
            .querySelector(".message-text")
            .innerText;

    navigator.clipboard.writeText(messageText)
        .then(() => {

            const original =
                button.textContent;

            button.textContent = "✓";

            button.classList.add("copied");

            setTimeout(() => {

                button.textContent =
                    original;

                button.classList.remove("copied");

            }, 1500);

        })
        .catch(error => {

            console.error(
                "Copy failed:",
                error
            );

        });
}

// ========================================
// TYPING INDICATOR
// ========================================

// ========================================
// YUVA THINKING INDICATOR
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
    <span class="ai-avatar">
        <span class="ai-avatar-core"></span>
    </span>
    </div>

        <div class="bubble thinking-bubble">

            <div class="thinking-content">

                <span class="thinking-text">
                    YUVA is thinking
                </span>

                <span class="thinking-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </span>

            </div>

        </div>
    `;

    chat.appendChild(messageDiv);

    chat.scrollTop =
        chat.scrollHeight;

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
// YUVA AI — ADVANCED VOICE SYSTEM
// ========================================

const SpeechRecognitionAPI =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let recognition = null;

let isListening = false;
let isSpeaking = false;

let voices = [];

const micButton =
    document.getElementById("micButton");

const voiceStatus =
    document.getElementById("voiceStatus");

const voiceStatusText =
    document.getElementById("voiceStatusText");

const voicePanel =
    document.getElementById("voicePanel");

const voiceSelect =
    document.getElementById("voiceSelect");

const stopSpeakingButton =
    document.getElementById("stopSpeakingButton");


// ========================================
// VOICE STATUS UI
// ========================================

function setVoiceStatus(
    text,
    state = "",
    visible = true
) {

    if (!voiceStatus) return;

    if (voiceStatusText) {
        voiceStatusText.textContent = text;
    }

    voiceStatus.classList.remove(
        "listening",
        "speaking",
        "active"
    );

    if (state) {
        voiceStatus.classList.add(state);
        voiceStatus.classList.add("active");
    }

    if (visible) {
        voiceStatus.classList.add("visible");
    } else {
        voiceStatus.classList.remove("visible");
    }
}


// ========================================
// SPEECH RECOGNITION
// ========================================

if (SpeechRecognitionAPI) {

    recognition =
        new SpeechRecognitionAPI();

    recognition.continuous = false;

    recognition.interimResults = true;

    /*
     * Indian English is generally more
     * comfortable for your usage.
     */

    recognition.lang = "en-IN";


    recognition.onstart = function () {

        isListening = true;

        /*
         * Stop YUVA speaking when user
         * starts talking.
         */

        if (
            "speechSynthesis" in window &&
            speechSynthesis.speaking
        ) {
            speechSynthesis.cancel();

            isSpeaking = false;
        }


        if (micButton) {

            micButton.classList.add(
                "listening"
            );

            micButton.classList.remove(
                "speaking"
            );

            micButton.textContent = "🔴";
        }


        setVoiceStatus(
            "Listening...",
            "listening",
            true
        );
    };


    recognition.onresult =
        function (event) {

            let transcript = "";

            let isFinal = false;


            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {

                transcript +=
                    event.results[i][0]
                        .transcript;

                if (
                    event.results[i].isFinal
                ) {
                    isFinal = true;
                }
            }


            /*
             * Show speech live in
             * the message box.
             */

            if (input) {
                input.value =
                    transcript.trim();
            }


            /*
             * Automatically send after
             * the user finishes speaking.
             */

            if (
                isFinal &&
                input &&
                input.value.trim()
            ) {

                setVoiceStatus(
                    "Sending...",
                    "listening",
                    true
                );

                sendMessage();
            }
        };


    recognition.onerror =
        function (event) {

            console.error(
                "Speech recognition error:",
                event.error
            );


            isListening = false;


            if (micButton) {

                micButton.classList.remove(
                    "listening"
                );

                micButton.textContent = "🎤";
            }


            if (
                event.error ===
                "not-allowed"
            ) {

                setVoiceStatus(
                    "Microphone permission denied",
                    "",
                    true
                );

            } else if (
                event.error ===
                "no-speech"
            ) {

                setVoiceStatus(
                    "No speech detected",
                    "",
                    true
                );

            } else {

                setVoiceStatus(
                    "Voice input unavailable",
                    "",
                    true
                );
            }


            setTimeout(
                () => {

                    if (!isSpeaking) {

                        setVoiceStatus(
                            "Ready",
                            "",
                            false
                        );
                    }

                },
                2200
            );
        };


    recognition.onend =
        function () {

            isListening = false;


            if (micButton) {

                micButton.classList.remove(
                    "listening"
                );

                /*
                 * If YUVA isn't speaking,
                 * return to microphone icon.
                 */

                if (!isSpeaking) {
                    micButton.textContent =
                        "🎤";
                }
            }


            if (!isSpeaking) {

                setVoiceStatus(
                    "Ready",
                    "",
                    false
                );
            }
        };
}


// ========================================
// START / STOP LISTENING
// ========================================

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

        return;
    }


    /*
     * Stop YUVA if currently speaking.
     */

    stopSpeaking();


    try {

        recognition.start();

    } catch (error) {

        console.log(
            "Recognition could not start:",
            error
        );
    }
}


// ========================================
// VOICE OUTPUT
// ========================================

let voiceOutputEnabled =
    localStorage.getItem(
        "yuva_voice_output"
    ) === "true";


function updateVoiceToggleUI() {

    const voiceToggle =
        document.getElementById(
            "voiceToggle"
        );

    if (!voiceToggle) return;


    voiceToggle.textContent =
        voiceOutputEnabled
            ? "🔊 Voice: On"
            : "🔊 Voice: Off";


    /*
     * Show voice settings only
     * when voice output is enabled.
     */

    if (voicePanel) {

        voicePanel.classList.toggle(
            "visible",
            voiceOutputEnabled
        );
    }
}


function toggleVoiceOutput() {

    voiceOutputEnabled =
        !voiceOutputEnabled;


    localStorage.setItem(
        "yuva_voice_output",
        voiceOutputEnabled
    );


    updateVoiceToggleUI();


    if (!voiceOutputEnabled) {

        stopSpeaking();

        setVoiceStatus(
            "Voice output disabled",
            "",
            true
        );

        setTimeout(
            () => {

                if (!isListening) {

                    setVoiceStatus(
                        "Ready",
                        "",
                        false
                    );
                }

            },
            1500
        );
    }
}


// ========================================
// LOAD AVAILABLE VOICES
// ========================================

function loadVoices() {

    if (
        !("speechSynthesis" in window)
    ) {
        return;
    }


    voices =
        window.speechSynthesis
            .getVoices();


    if (!voiceSelect) return;


    const savedVoice =
        localStorage.getItem(
            "yuva_selected_voice"
        );


    voiceSelect.innerHTML = "";


    const defaultOption =
        document.createElement(
            "option"
        );

    defaultOption.value = "";

    defaultOption.textContent =
        "✨ Default Voice";

    voiceSelect.appendChild(
        defaultOption
    );


    voices.forEach(
        (voice, index) => {

            const option =
                document.createElement(
                    "option"
                );

            option.value = index;


            option.textContent =
                `${voice.name} • ${voice.lang}`;


            voiceSelect.appendChild(
                option
            );
        }
    );


    if (
        savedVoice !== null &&
        voices[savedVoice]
    ) {

        voiceSelect.value =
            savedVoice;
    }
}


if (
    "speechSynthesis" in window
) {

    loadVoices();


    /*
     * Chrome loads voices
     * asynchronously.
     */

    window.speechSynthesis
        .onvoiceschanged =
        loadVoices;
}


// ========================================
// SAVE SELECTED VOICE
// ========================================

if (voiceSelect) {

    voiceSelect.addEventListener(
        "change",
        function () {

            localStorage.setItem(
                "yuva_selected_voice",
                voiceSelect.value
            );


            /*
             * Small confirmation.
             */

            setVoiceStatus(
                "Voice selected",
                "",
                true
            );


            setTimeout(
                () => {

                    if (!isSpeaking) {

                        setVoiceStatus(
                            "Ready",
                            "",
                            false
                        );
                    }

                },
                1200
            );
        }
    );
}


// ========================================
// SPEAK YUVA REPLY
// ========================================

function speakReply(text) {

    if (!voiceOutputEnabled) {
        return;
    }


    if (
        !("speechSynthesis" in window)
    ) {
        return;
    }


    /*
     * Cancel anything currently
     * being spoken.
     */

    window.speechSynthesis.cancel();


    /*
     * Clean markdown before speaking.
     */

    const cleanText =
        text
            .replace(
                /```[\s\S]*?```/g,
                ""
            )
            .replace(
                /[*_#>`]/g,
                ""
            )
            .replace(
                /\[([^\]]+)\]\([^)]+\)/g,
                "$1"
            )
            .trim();


    if (!cleanText) return;


    const utterance =
        new SpeechSynthesisUtterance(
            cleanText
        );


    /*
     * Selected voice.
     */

    const selectedVoice =
        voiceSelect
            ? voiceSelect.value
            : "";


    if (
        selectedVoice !== "" &&
        voices[selectedVoice]
    ) {

        utterance.voice =
            voices[selectedVoice];
    }


    /*
     * Natural speech settings.
     */

    utterance.rate = 1;

    utterance.pitch = 1;

    utterance.volume = 1;


    /*
     * Use selected voice language
     * if available.
     */

    if (
        utterance.voice &&
        utterance.voice.lang
    ) {

        utterance.lang =
            utterance.voice.lang;

    } else {

        utterance.lang =
            "en-IN";
    }


    utterance.onstart =
        function () {

            isSpeaking = true;


            if (micButton) {

                micButton.classList.add(
                    "speaking"
                );

                micButton.classList.remove(
                    "listening"
                );

                micButton.textContent =
                    "🔊";
            }


            setVoiceStatus(
                "YUVA is speaking...",
                "speaking",
                true
            );
        };


    utterance.onend =
        function () {

            isSpeaking = false;


            if (micButton) {

                micButton.classList.remove(
                    "speaking"
                );

                micButton.textContent =
                    "🎤";
            }


            setVoiceStatus(
                "Ready",
                "",
                false
            );
        };


    utterance.onerror =
        function (event) {

            console.error(
                "Speech synthesis error:",
                event
            );


            isSpeaking = false;


            if (micButton) {

                micButton.classList.remove(
                    "speaking"
                );

                micButton.textContent =
                    "🎤";
            }


            setVoiceStatus(
                "Ready",
                "",
                false
            );
        };


    window.speechSynthesis.speak(
        utterance
    );
}


// ========================================
// STOP YUVA SPEAKING
// ========================================

function stopSpeaking() {

    if (
        "speechSynthesis" in window
    ) {

        window.speechSynthesis.cancel();
    }


    isSpeaking = false;


    if (micButton) {

        micButton.classList.remove(
            "speaking"
        );

        if (!isListening) {
            micButton.textContent =
                "🎤";
        }
    }


    setVoiceStatus(
        "Ready",
        "",
        false
    );
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