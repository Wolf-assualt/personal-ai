const input = document.getElementById("userInput");
const chat = document.getElementById("chat");

let creatorToken = localStorage.getItem("yuva_creator_token");
let currentRole = localStorage.getItem("yuva_role");
let currentName = localStorage.getItem("yuva_name");

// ========================================
// CREATOR / FAMILY / FRIEND LOGIN
// ========================================

async function creatorLogin() {
    const passwordInput =
        document.getElementById("creatorPassword");

    const message =
        document.getElementById("loginMessage");

    const password =
        passwordInput.value.trim();

    if (!password) {
        message.textContent =
            "Please enter your password.";
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

        document.getElementById(
            "loginScreen"
        ).style.display = "none";

        document.getElementById(
            "app"
        ).style.display = "flex";

        updateRoleUI();

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

    document.getElementById(
        "loginScreen"
    ).style.display = "none";

    document.getElementById(
        "app"
    ).style.display = "flex";

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
    const status =
        document.getElementById("status");

    if (!status) return;

    if (currentRole === "creator") {
        status.textContent =
            "👑 Creator Mode • Yuva";

    } else if (currentRole === "partner") {
        status.textContent =
            "❤️ Creator's GF/Wife";

    } else if (currentRole === "brother") {
        status.textContent =
            "👦 Vishwa • Yuva's Brother";

    } else if (currentRole === "friend") {
        status.textContent =
            "🤝 Creator's Friend";

    } else {
        status.textContent =
            "Personal AI Assistant";
    }
}

// ========================================
// SEND MESSAGE
// ========================================

async function sendMessage() {
    const message =
        input.value.trim();

    if (!message) return;

    addMessage(message, "user");

    input.value = "";

    const typingId =
        addTypingMessage();

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

        const data =
            await response.json();

        removeTypingMessage(typingId);

        if (!response.ok || !data.success) {
            addMessage(
                data.message ||
                "Something went wrong.",
                "ai"
            );

            return;
        }

        addMessage(
            data.reply,
            "ai"
        );

        speakReply(
            data.reply
        );

    } catch (error) {
        console.error(
            "Chat error:",
            error
        );

        removeTypingMessage(
            typingId
        );

        addMessage(
            "I couldn't connect to YUVA AI right now. 🧠❌",
            "ai"
        );
    }
}

// ========================================
// QUICK MESSAGE
// ========================================

function quickMessage(message) {
    if (!input) return;

    input.value = message;

    sendMessage();
}

// ========================================
// ENTER KEY
// ========================================

input.addEventListener(
    "keydown",
    function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    }
);

// ========================================
// ADD MESSAGE
// ========================================

function addMessage(text, type) {
    const messageDiv =
        document.createElement("div");

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

    if (type === "ai") {
        messageDiv.innerHTML = `
            <div class="avatar">
                ${avatar}
            </div>

            <div class="bubble">

                <div class="message-text">
                    ${escapeHTML(text).replace(
                        /\n/g,
                        "<br>"
                    )}
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

    } else {
        messageDiv.innerHTML = `
            <div class="avatar">
                ${avatar}
            </div>

            <div class="bubble">
                ${escapeHTML(text).replace(
                    /\n/g,
                    "<br>"
                )}
            </div>
        `;
    }

    chat.appendChild(messageDiv);

    chat.scrollTop =
        chat.scrollHeight;
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

    navigator.clipboard
        .writeText(messageText)
        .then(() => {

            const original =
                button.textContent;

            button.textContent = "✓";

            button.classList.add(
                "copied"
            );

            setTimeout(() => {

                button.textContent =
                    original;

                button.classList.remove(
                    "copied"
                );

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
// VOICE STATUS
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

    recognition = new SpeechRecognitionAPI();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";


    recognition.onstart = function () {

        isListening = true;

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


    recognition.onresult = function (event) {

        let transcript = "";
        let isFinal = false;

        for (
            let i = event.resultIndex;
            i < event.results.length;
            i++
        ) {

            transcript +=
                event.results[i][0].transcript;

            if (
                event.results[i].isFinal
            ) {
                isFinal = true;
            }
        }

        if (input) {
            input.value =
                transcript.trim();
        }

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


    recognition.onerror = function (event) {

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

        if (event.error === "not-allowed") {

            setVoiceStatus(
                "Microphone permission denied",
                "",
                true
            );

        } else if (
            event.error === "no-speech"
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


    recognition.onend = function () {

        isListening = false;

        if (micButton) {

            micButton.classList.remove(
                "listening"
            );

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
// LOAD VOICES
// ========================================

function loadVoices() {

    if (
        !("speechSynthesis" in window)
    ) {
        return;
    }

    voices =
        window.speechSynthesis.getVoices();

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
// EXPRESSIVE SOUND DETECTION
// ========================================

function isExpressiveSound(word) {

    if (!word) return false;

    return (
        /^u+m{2,}$/i.test(word) ||
        /^a+h{2,}$/i.test(word) ||
        /^u+h{2,}$/i.test(word) ||
        /^yeah+h{2,}$/i.test(word) ||
        /^h+m{2,}$/i.test(word)
    );
}


// ========================================
// CONVERT LONG EXPRESSIONS
//
// IMPORTANT:
// We DO NOT send repeated H's to TTS.
//
// Example:
//
// ummmmm
//      ↓
// um + controlled pause
//
// This prevents:
//
// "umm hhhhhhhh"
//
// while keeping the expression long.
// ========================================

function createExpressiveSound(word) {

    const lower =
        word.toLowerCase();

    let base = "";
    let length = 0;

    if (
        /^u+m{2,}$/i.test(lower)
    ) {

        base = "umm";
        length =
            lower.length - 1;

    } else if (
        /^a+h{2,}$/i.test(lower)
    ) {

        base = "ah";
        length =
            lower.length - 1;

    } else if (
        /^u+h{2,}$/i.test(lower)
    ) {

        base = "uh";
        length =
            lower.length - 1;

    } else if (
        /^yeah+h{2,}$/i.test(lower)
    ) {

        base = "yeah";
        length =
            lower.length - 4;

    } else if (
        /^h+m{2,}$/i.test(lower)
    ) {

        base = "hmm";
        length =
            lower.length - 1;

    } else {

        return null;
    }


    /*
     * More repeated letters =
     * slightly longer pause.
     *
     * We never send the repeated
     * H/M characters themselves
     * to speech synthesis.
     */

    const pause =
        Math.min(
            1800,
            Math.max(
                250,
                length * 110
            )
        );

    return {
        text: base,
        pause: pause
    };
}


// ========================================
// CLEAN NORMAL TEXT
// ========================================

function cleanSpeechText(text) {

    if (!text) return "";

    let result = text;

    result =
        result.replace(
            /```[\s\S]*?```/g,
            ""
        );

    result =
        result.replace(
            /\[([^\]]+)\]\([^)]+\)/g,
            "$1"
        );

    result =
        result.replace(
            /[#>`_~]/g,
            ""
        );

    /*
     * IMPORTANT:
     * Do NOT shorten expressive words here.
     */

    result =
        result.replace(
            /\s{2,}/g,
            " "
        );

    return result.trim();
}


// ========================================
// PARSE STAGE DIRECTIONS
// ========================================

function parseSpeechPerformance(text) {

    const segments = [];

    let lastIndex = 0;

    const cueRegex =
        /\*([^*]+)\*/g;

    let match;

    while (
        (match = cueRegex.exec(text))
        !== null
    ) {

        const normalText =
            text.substring(
                lastIndex,
                match.index
            );

        if (normalText.trim()) {

            segments.push({
                type: "text",
                text: normalText
            });
        }

        const cue =
            match[1]
                .trim()
                .toLowerCase();


        if (cue.includes("laugh")) {

            segments.push({
                type: "laugh",
                soft:
                    cue.includes("soft")
            });

        } else if (
            cue.includes("whisper")
        ) {

            segments.push({
                type: "whisper"
            });

        } else if (
            cue.includes("pause") ||
            cue.includes("wait") ||
            cue.includes("silence")
        ) {

            segments.push({
                type: "pause"
            });

        } else if (
            cue.includes("sigh")
        ) {

            segments.push({
                type: "sigh"
            });

        } else {

            /*
             * Other actions such as:
             *
             * *smiles*
             * *leans closer*
             * *looks at you*
             *
             * are not spoken literally.
             */

            segments.push({
                type: "action"
            });
        }

        lastIndex =
            match.index +
            match[0].length;
    }

    const remaining =
        text.substring(
            lastIndex
        );

    if (remaining.trim()) {

        segments.push({
            type: "text",
            text: remaining
        });
    }

    return segments;
}


// ========================================
// SPEAK NORMAL TEXT WITH EXPRESSIONS
// ========================================

function speakTextWithExpressions(
    text,
    settings,
    done
) {

    const cleaned =
        cleanSpeechText(text);

    if (!cleaned) {

        done();
        return;
    }

    /*
     * Split words but keep spaces.
     */

    const parts =
        cleaned.split(
            /(\s+)/
        );

    let index = 0;

    function nextPart() {

        if (
            index >=
            parts.length
        ) {

            done();
            return;
        }

        const part =
            parts[index];

        index++;

        /*
         * Spaces don't need speech.
         */

        if (!part.trim()) {

            nextPart();
            return;
        }

        /*
         * Check for long expressive sound.
         */

        const expressive =
            isExpressiveSound(part)
                ? createExpressiveSound(part)
                : null;

        if (expressive) {

            /*
             * Speak the natural base sound.
             */

            const utterance =
                new SpeechSynthesisUtterance(
                    expressive.text
                );

            applyVoiceSettings(
                utterance,
                settings
            );

            utterance.onend =
                function () {

                    /*
                     * Real silence creates
                     * the feeling of the
                     * sound being held.
                     */

                    setTimeout(
                        nextPart,
                        expressive.pause
                    );
                };

            utterance.onerror =
                function () {

                    nextPart();
                };

            window.speechSynthesis.speak(
                utterance
            );

            return;
        }


        /*
         * Normal words are grouped together
         * until an expressive sound appears.
         */

        let normalText =
            part;

        while (
            index <
            parts.length
        ) {

            const next =
                parts[index];

            if (!next.trim()) {

                normalText += next;

                index++;

                continue;
            }

            if (
                isExpressiveSound(next)
            ) {
                break;
            }

            normalText += next;

            index++;
        }


        const utterance =
            new SpeechSynthesisUtterance(
                normalText
            );

        applyVoiceSettings(
            utterance,
            settings
        );

        utterance.onend =
            function () {

                nextPart();
            };

        utterance.onerror =
            function () {

                nextPart();
            };

        window.speechSynthesis.speak(
            utterance
        );
    }

    nextPart();
}


// ========================================
// APPLY VOICE SETTINGS
// ========================================

function applyVoiceSettings(
    utterance,
    settings = {}
) {

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

    utterance.rate =
        settings.rate ?? 1;

    utterance.pitch =
        settings.pitch ?? 1;

    utterance.volume =
        settings.volume ?? 1;

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
}


// ========================================
// SPEAK PERFORMANCE SEGMENT
// ========================================

function speakPerformanceSegment(
    segment,
    done
) {

    if (!segment) {

        done();
        return;
    }


    // ------------------------------------
    // NORMAL TEXT
    // ------------------------------------

    if (
        segment.type === "text"
    ) {

        speakTextWithExpressions(
            segment.text,
            {
                rate: 1,
                pitch: 1,
                volume: 1
            },
            done
        );

        return;
    }


    // ------------------------------------
    // PAUSE
    // ------------------------------------

    if (
        segment.type === "pause"
    ) {

        setTimeout(
            done,
            900
        );

        return;
    }


    // ------------------------------------
    // WHISPER
    // ------------------------------------

    if (
        segment.type === "whisper"
    ) {

        /*
         * Marker only.
         *
         * The browser TTS cannot create
         * a genuine whisper. The following
         * text will still be spoken normally
         * by the current system.
         */

        setTimeout(
            done,
            50
        );

        return;
    }


    // ------------------------------------
    // LAUGH
    // ------------------------------------

    if (
        segment.type === "laugh"
    ) {

        const laugh =
            segment.soft
                ? "heh heh..."
                : "ha ha ha...";

        const utterance =
            new SpeechSynthesisUtterance(
                laugh
            );

        applyVoiceSettings(
            utterance,
            {
                rate:
                    segment.soft
                        ? 0.8
                        : 1,
                pitch:
                    segment.soft
                        ? 1.1
                        : 1.2,
                volume:
                    segment.soft
                        ? 0.6
                        : 0.9
            }
        );

        utterance.onend =
            done;

        utterance.onerror =
            done;

        window.speechSynthesis.speak(
            utterance
        );

        return;
    }


    // ------------------------------------
    // SIGH
    // ------------------------------------

    if (
        segment.type === "sigh"
    ) {

        const utterance =
            new SpeechSynthesisUtterance(
                "haaah..."
            );

        applyVoiceSettings(
            utterance,
            {
                rate: 0.75,
                pitch: 0.8,
                volume: 0.7
            }
        );

        utterance.onend =
            done;

        utterance.onerror =
            done;

        window.speechSynthesis.speak(
            utterance
        );

        return;
    }


    // ------------------------------------
    // OTHER ACTIONS
    // ------------------------------------

    done();
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

    window.speechSynthesis.cancel();

    const segments =
        parseSpeechPerformance(
            text
        );

    if (!segments.length) {
        return;
    }

    let index = 0;

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


    function next() {

        if (
            index >=
            segments.length
        ) {

            finishSpeaking();

            return;
        }

        const segment =
            segments[index];

        index++;

        speakPerformanceSegment(
            segment,
            next
        );
    }

    next();
}


// ========================================
// FINISH SPEAKING
// ========================================

function finishSpeaking() {

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
// CLEAR MEMORY
// ========================================

async function clearMemory() {

    try {

        await fetch(
            "/clear-memory",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    token:
                        creatorToken
                })
            }
        );

    } catch (error) {

        console.error(
            "Clear memory error:",
            error
        );
    }

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

            await fetch(
                "/logout",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        token:
                            creatorToken
                    })
                }
            );
        }

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );
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

        const response =
            await fetch(
                "/verify-creator",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        token:
                            creatorToken
                    })
                }
            );

        const data =
            await response.json();

        if (
            data.success &&
            data.authenticated
        ) {

            currentRole =
                data.role;

            currentName =
                data.name;

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
            document.getElementById(
                "app"
            );

        if (app) {

            app.style.display =
                "none";
        }

        checkExistingSession();

        updateVoiceToggleUI();
    }
);

// ========================================
// CURSOR / TOUCH GLOW
// ========================================

const cursorGlow =
    document.getElementById(
        "cursorGlow"
    );

if (cursorGlow) {

    document.addEventListener(
        "pointermove",
        function (event) {

            cursorGlow.style.left =
                event.clientX + "px";

            cursorGlow.style.top =
                event.clientY + "px";

            cursorGlow.style.opacity =
                "1";
        }
    );

    document.addEventListener(
        "pointerleave",
        function () {

            cursorGlow.style.opacity =
                "0";
        }
    );
}