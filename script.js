const input = document.getElementById("userInput");
const chat = document.getElementById("chat");

let creatorToken = localStorage.getItem("yuva_creator_token");
let currentRole = localStorage.getItem("yuva_role");
let currentName = localStorage.getItem("yuva_name");

// ============================================================
// YUVA SETTINGS
// ============================================================

let responseRevealEnabled = true;
let speakingMessage = null;

let voiceOutputEnabled =
    localStorage.getItem("yuva_voice_output") === "true";

let autoSpeakEnabled =
    localStorage.getItem("yuva_auto_speak") !== "false";

let voiceSettings = {
    rate:
        Number(localStorage.getItem("yuva_voice_rate")) || 1,

    pitch:
        Number(localStorage.getItem("yuva_voice_pitch")) || 1,

    volume:
        Number(localStorage.getItem("yuva_voice_volume")) || 1
};

// ============================================================
// CREATOR LOGIN
// ============================================================

async function creatorLogin() {

    const passwordInput =
        document.getElementById("creatorPassword");

    const message =
        document.getElementById("loginMessage");

    const password =
        passwordInput?.value.trim();

    if (!password) {
        if (message) {
            message.textContent =
                "Please enter your password.";
        }
        return;
    }

    if (message) {
        message.textContent = "Checking...";
    }

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

            if (message) {
                message.textContent =
                    data.message ||
                    "Incorrect password.";
            }

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

        const loginScreen =
            document.getElementById("loginScreen");

        const app =
            document.getElementById("app");

        if (loginScreen) {
            loginScreen.style.display = "none";
        }

        if (app) {
            app.style.display = "flex";
        }

        updateRoleUI();

        addMessage(
            data.greeting ||
            `Welcome back, ${currentName || "Yuva"}! 👑`,
            "ai"
        );

        if (passwordInput) {
            passwordInput.value = "";
        }

    } catch (error) {

        console.error("Login error:", error);

        if (message) {
            message.textContent =
                "Unable to connect to YUVA AI.";
        }
    }
}

// ============================================================
// GUEST LOGIN
// ============================================================

function continueAsGuest() {

    creatorToken = null;
    currentRole = "guest";
    currentName = "Guest";

    localStorage.removeItem("yuva_creator_token");
    localStorage.removeItem("yuva_role");
    localStorage.removeItem("yuva_name");

    const loginScreen =
        document.getElementById("loginScreen");

    const app =
        document.getElementById("app");

    if (loginScreen) {
        loginScreen.style.display = "none";
    }

    if (app) {
        app.style.display = "flex";
    }

    updateRoleUI();

    addMessage(
        "Hi! 👋 Welcome to YUVA AI. How can I help you?",
        "ai"
    );
}

// ============================================================
// ROLE UI
// ============================================================

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

// ============================================================
// SEND MESSAGE
// ============================================================

async function sendMessage() {

    const message =
        input ? input.value.trim() : "";

    if (!message) return;

    addMessage(message, "user");

    if (input) {
        input.value = "";
    }

    const typingId =
        addTypingMessage();

    try {

        const response =
            await fetch("/chat", {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
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

        // Auto speak is controlled ONLY
        // by the Voice Experience settings.
        if (autoSpeakEnabled) {
            speakReply(data.reply);
        }

    } catch (error) {

        console.error("Chat error:", error);

        removeTypingMessage(typingId);

        addMessage(
            "I couldn't connect to YUVA AI right now. 🧠❌",
            "ai"
        );
    }
}

// ============================================================
// QUICK MESSAGE
// ============================================================

function quickMessage(message) {

    if (!input) return;

    input.value = message;

    sendMessage();
}

// ============================================================
// ENTER KEY
// ============================================================

if (input) {

    input.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();
            }
        }
    );
}

// ============================================================
// ADD MESSAGE
// ============================================================

function addMessage(
    text,
    type,
    animate = true
) {

    if (!chat) return null;

    const messageDiv =
        document.createElement("div");

    messageDiv.className =
        type === "user"
            ? "message user"
            : "message ai";

    if (animate) {

        messageDiv.classList.add(
            "yuva-message-enter"
        );
    }

    const avatar =
        type === "user"
            ? "👤"
            :
            `
                <span class="ai-avatar">
                    <span class="ai-avatar-core"></span>
                </span>
            `;

    const safeText =
        escapeHTML(
            text == null
                ? ""
                : String(text)
        ).replace(/\n/g, "<br>");

    if (type === "ai") {

        messageDiv.innerHTML = `

            <div class="avatar">
                ${avatar}
            </div>

            <div class="bubble">

                <div class="message-text">
                    ${safeText}
                </div>

                <div class="message-actions">

                    <button
                        class="copy-button"
                        type="button"
                        onclick="copyMessage(this)"
                        title="Copy response"
                    >
                        📋
                    </button>

                    <button
                        class="speak-message-button"
                        type="button"
                        onclick="speakMessageButton(this)"
                        title="Speak this response"
                    >
                        🔊
                    </button>

                </div>

            </div>
        `;

    } else {

        messageDiv.innerHTML = `

            <div class="avatar">
                ${avatar}
            </div>

            <div class="bubble">
                ${safeText}
            </div>

        `;
    }

    chat.appendChild(messageDiv);

    requestAnimationFrame(() => {

        messageDiv.classList.add(
            "yuva-message-visible"
        );

    });

    chat.scrollTop =
        chat.scrollHeight;

    return messageDiv;
}

// ============================================================
// COPY MESSAGE
// ============================================================

function copyMessage(button) {

    if (!button) return;

    const bubble =
        button.parentElement?.parentElement;

    if (!bubble) return;

    const messageText =
        bubble.querySelector(".message-text");

    if (!messageText) return;

    const text =
        messageText.innerText;

    if (
        navigator.clipboard &&
        navigator.clipboard.writeText
    ) {

        navigator.clipboard
            .writeText(text)
            .then(() => {

                const original =
                    button.textContent;

                button.textContent = "✓";

                button.classList.add("copied");

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

    } else {

        const area =
            document.createElement("textarea");

        area.value = text;

        document.body.appendChild(area);

        area.select();

        try {
            document.execCommand("copy");
        } catch (error) {
            console.error(
                "Copy failed:",
                error
            );
        }

        area.remove();
    }
}

// ============================================================
// SPEAK INDIVIDUAL MESSAGE
// ============================================================

function speakMessageButton(button) {

    if (!button) return;

    const bubble =
        button.parentElement?.parentElement;

    if (!bubble) return;

    const messageText =
        bubble.querySelector(".message-text");

    if (!messageText) return;

    const text =
        messageText.innerText.trim();

    if (!text) return;

    speakReply(text, true);
}

// ============================================================
// THINKING INDICATOR
// ============================================================

function addTypingMessage() {

    if (!chat) return null;

    const id =
        "typing-" + Date.now();

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

    if (!id) return;

    const element =
        document.getElementById(id);

    if (element) {
        element.remove();
    }
}

// ============================================================
// HTML SAFETY
// ============================================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text == null
            ? ""
            : String(text);

    return div.innerHTML;
}

// ============================================================
// VOICE SYSTEM
// ============================================================

const SpeechRecognitionAPI =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let recognition = null;

let isListening = false;
let isSpeaking = false;

let voices = [];

let voicePerformanceMode = "normal";

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

// ============================================================
// VOICE STATUS
// ============================================================

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

// ============================================================
// SPEECH RECOGNITION
// ============================================================

if (SpeechRecognitionAPI) {

    recognition =
        new SpeechRecognitionAPI();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onstart = function() {

        isListening = true;

        if (
            "speechSynthesis" in window &&
            speechSynthesis.speaking
        ) {

            speechSynthesis.cancel();

            isSpeaking = false;
        }

        if (micButton) {

            micButton.classList.add("listening");

            micButton.classList.remove("speaking");

            micButton.textContent = "🔴";
        }

        setVoiceStatus(
            "Listening...",
            "listening",
            true
        );
    };

    recognition.onresult =
        function(event) {

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

    recognition.onerror =
        function(event) {

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
                event.error === "not-allowed"
            ) {

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

            setTimeout(() => {

                if (!isSpeaking) {

                    setVoiceStatus(
                        "Ready",
                        "",
                        false
                    );
                }

            }, 2200);
        };

    recognition.onend =
        function() {

            isListening = false;

            if (micButton) {

                micButton.classList.remove(
                    "listening"
                );

                if (!isSpeaking) {
                    micButton.textContent = "🎤";
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

// ============================================================
// TOGGLE MICROPHONE
// ============================================================

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

// ============================================================
// VOICE TOGGLE
// ============================================================

function updateVoiceToggleUI() {

    const voiceToggle =
        document.getElementById("voiceToggle");

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

        setTimeout(() => {

            if (!isListening) {

                setVoiceStatus(
                    "Ready",
                    "",
                    false
                );
            }

        }, 1500);
    }
}

// ============================================================
// LOAD VOICES
// ============================================================

function loadVoices() {

    if (!("speechSynthesis" in window)) {
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
        document.createElement("option");

    defaultOption.value = "";

    defaultOption.textContent =
        "✨ Default Voice";

    voiceSelect.appendChild(defaultOption);

    voices.forEach(
        (voice, index) => {

            const option =
                document.createElement("option");

            option.value = index;

            option.textContent =
                `${voice.name} • ${voice.lang}`;

            voiceSelect.appendChild(option);
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

if ("speechSynthesis" in window) {

    loadVoices();

    window.speechSynthesis.onvoiceschanged =
        loadVoices;
}

// ============================================================
// OLD VOICE SELECT
// ============================================================

if (voiceSelect) {

    voiceSelect.addEventListener(
        "change",
        function() {

            localStorage.setItem(
                "yuva_selected_voice",
                voiceSelect.value
            );

            setVoiceStatus(
                "Voice selected",
                "",
                true
            );

            setTimeout(() => {

                if (!isSpeaking) {

                    setVoiceStatus(
                        "Ready",
                        "",
                        false
                    );
                }

            }, 1200);
        }
    );
}

// ============================================================
// LONG SOUND DETECTION
// ============================================================

function detectLongSound(word) {

    if (!word) return null;

    const value =
        word
            .toLowerCase()
            .replace(/[.,!?;:]+$/g, "");

    if (/^u+m{2,}$/i.test(value)) {

        return {
            text: "umm",
            pause:
                Math.min(
                    2400,
                    Math.max(
                        500,
                        value.length * 115
                    )
                ),
            rate: 0.5,
            pitch: 0.9,
            volume: 0.9
        };
    }

    if (/^a+h{2,}$/i.test(value)) {

        return {
            text: "ah",
            pause:
                Math.min(
                    2400,
                    Math.max(
                        500,
                        value.length * 115
                    )
                ),
            rate: 0.5,
            pitch: 0.85,
            volume: 0.85
        };
    }

    if (/^u+h{2,}$/i.test(value)) {

        return {
            text: "uh",
            pause:
                Math.min(
                    2400,
                    Math.max(
                        500,
                        value.length * 115
                    )
                ),
            rate: 0.5,
            pitch: 0.85,
            volume: 0.85
        };
    }

    if (/^yeah+h{2,}$/i.test(value)) {

        return {
            text: "yeah",
            pause:
                Math.min(
                    2000,
                    Math.max(
                        450,
                        value.length * 90
                    )
                ),
            rate: 0.6,
            pitch: 1,
            volume: 0.9
        };
    }

    if (/^h+m{2,}$/i.test(value)) {

        return {
            text: "hmm",
            pause:
                Math.min(
                    2200,
                    Math.max(
                        500,
                        value.length * 110
                    )
                ),
            rate: 0.5,
            pitch: 0.85,
            volume: 0.85
        };
    }

    return null;
}

// ============================================================
// CLEAN SPEECH TEXT
// ============================================================

function cleanSpeechText(text) {

    if (!text) return "";

    let result = String(text);

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

    result =
        result.replace(
            /\s{2,}/g,
            " "
        );

    return result.trim();
}

// ============================================================
// PERFORMANCE CUE DETECTION
// ============================================================

function getPerformanceCue(cue) {

    if (!cue) return null;

    const value =
        cue
            .trim()
            .toLowerCase();

    if (
        value.includes("chuckle") ||
        value.includes("chuckles")
    ) {
        return {
            type: "chuckle"
        };
    }

    if (
        value.includes("laugh") ||
        value.includes("laughs") ||
        value.includes("laughing")
    ) {
        return {
            type: "laugh",
            soft:
                value.includes("soft") ||
                value.includes("quiet") ||
                value.includes("light") ||
                value.includes("gently")
        };
    }

    if (
        value.includes("giggle") ||
        value.includes("giggles") ||
        value.includes("giggling")
    ) {
        return {
            type: "giggle"
        };
    }

    if (
        value.includes("sigh") ||
        value.includes("sighs") ||
        value.includes("sighing")
    ) {
        return {
            type: "sigh"
        };
    }

    if (
        value.includes("whisper") ||
        value.includes("whispers") ||
        value.includes("whispering")
    ) {
        return {
            type: "whisper"
        };
    }

    if (
        value.includes("pause") ||
        value.includes("wait") ||
        value.includes("silence") ||
        value.includes("moment")
    ) {
        return {
            type: "pause"
        };
    }

    if (
        value.includes("breath") ||
        value.includes("inhale") ||
        value.includes("exhale")
    ) {
        return {
            type: "breath"
        };
    }

    if (
        value.includes("smile") ||
        value.includes("smiles") ||
        value.includes("smiling")
    ) {
        return {
            type: "action"
        };
    }

    if (
        value.includes("nod") ||
        value.includes("nods") ||
        value.includes("nodding")
    ) {
        return {
            type: "action"
        };
    }

    if (
        value.includes("leans") ||
        value.includes("lean") ||
        value.includes("shrugs") ||
        value.includes("shrug") ||
        value.includes("looks") ||
        value.includes("wink") ||
        value.includes("winks")
    ) {
        return {
            type: "action"
        };
    }

    return null;
}

// ============================================================
// PARSE PERFORMANCE CUES
// ============================================================

function parsePerformance(text) {

    const segments = [];

    if (!text) return segments;

    let lastIndex = 0;

    const regex =
        /(\*\*|\*)([\s\S]*?)\1/g;

    let match;

    while (
        (match = regex.exec(text)) !== null
    ) {

        const fullMatch =
            match[0];

        const cueText =
            match[2].trim();

        const cue =
            getPerformanceCue(cueText);

        if (!cue) {
            continue;
        }

        const normal =
            text.substring(
                lastIndex,
                match.index
            );

        if (normal) {

            segments.push({
                type: "text",
                text: normal
            });
        }

        segments.push(cue);

        lastIndex =
            match.index +
            fullMatch.length;
    }

    const remaining =
        text.substring(lastIndex);

    if (remaining) {

        segments.push({
            type: "text",
            text: remaining
        });
    }

    return segments;
}

// ============================================================
// APPLY VOICE SETTINGS
// ============================================================

function applyVoiceSettings(
    utterance,
    settings = {}
) {

    const selected =
        voiceSelect
            ? voiceSelect.value
            : "";

    if (
        selected !== "" &&
        voices[selected]
    ) {

        utterance.voice =
            voices[selected];
    }

    utterance.rate =
        settings.rate ??
        voiceSettings.rate ??
        1;

    utterance.pitch =
        settings.pitch ??
        voiceSettings.pitch ??
        1;

    utterance.volume =
        settings.volume ??
        voiceSettings.volume ??
        1;

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

// ============================================================
// SAFE SPEECH
// ============================================================

function speakUtterance(
    text,
    settings,
    done
) {

    if (!text) {

        done();
        return;
    }

    if (
        !("speechSynthesis" in window)
    ) {

        done();
        return;
    }

    const utterance =
        new SpeechSynthesisUtterance(
            text
        );

    applyVoiceSettings(
        utterance,
        settings
    );

    utterance.onend =
        function() {
            done();
        };

    utterance.onerror =
        function() {
            done();
        };

    window.speechSynthesis.speak(
        utterance
    );
}

// ============================================================
// LONG SOUND
// ============================================================

function speakLongSound(
    sound,
    done
) {

    speakUtterance(
        sound.text,
        {
            rate: sound.rate,
            pitch: sound.pitch,
            volume: sound.volume
        },
        function() {

            setTimeout(
                done,
                sound.pause
            );
        }
    );
}

// ============================================================
// SPEAK TEXT
// ============================================================

function speakText(
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

    const parts =
        cleaned.split(/(\s+)/);

    let index = 0;

    function next() {

        if (
            index >=
            parts.length
        ) {

            done();
            return;
        }

        const part =
            parts[index++];

        if (!part.trim()) {

            next();
            return;
        }

        const sound =
            detectLongSound(part);

        if (sound) {

            speakLongSound(
                sound,
                next
            );

            return;
        }

        let normal =
            part;

        while (
            index <
            parts.length
        ) {

            const nextPart =
                parts[index];

            if (!nextPart.trim()) {

                normal += nextPart;

                index++;

                continue;
            }

            if (
                detectLongSound(
                    nextPart
                )
            ) {

                break;
            }

            normal += nextPart;

            index++;
        }

        speakUtterance(
            normal,
            settings,
            next
        );
    }

    next();
}

// ============================================================
// PERFORMANCE SEGMENT
// ============================================================

function performSegment(
    segment,
    done
) {

    if (!segment) {

        done();
        return;
    }

    if (
        segment.type === "text"
    ) {

        let settings = {
            rate:
                voiceSettings.rate,
            pitch:
                voiceSettings.pitch,
            volume:
                voiceSettings.volume
        };

        if (
            voicePerformanceMode ===
            "whisper"
        ) {

            settings = {
                rate:
                    Math.min(
                        0.78,
                        voiceSettings.rate
                    ),

                pitch:
                    Math.min(
                        0.88,
                        voiceSettings.pitch
                    ),

                volume:
                    Math.min(
                        0.30,
                        voiceSettings.volume
                    )
            };
        }

        speakText(
            segment.text,
            settings,
            function() {

                voicePerformanceMode =
                    "normal";

                done();
            }
        );

        return;
    }

    if (
        segment.type === "action"
    ) {

        setTimeout(
            done,
            60
        );

        return;
    }

    if (
        segment.type === "pause"
    ) {

        setTimeout(
            done,
            1000
        );

        return;
    }

    if (
        segment.type === "chuckle"
    ) {

        speakUtterance(
            "heh heh",
            {
                rate: 0.72,
                pitch: 1.08,
                volume: 0.58
            },
            function() {

                setTimeout(
                    done,
                    180
                );
            }
        );

        return;
    }

    if (
        segment.type === "laugh"
    ) {

        speakUtterance(

            segment.soft
                ? "heh heh heh"
                : "ha ha ha",

            {
                rate:
                    segment.soft
                        ? 0.76
                        : 0.95,

                pitch:
                    segment.soft
                        ? 1.08
                        : 1.18,

                volume:
                    segment.soft
                        ? 0.58
                        : 0.88
            },

            function() {

                setTimeout(
                    done,
                    180
                );
            }
        );

        return;
    }

    if (
        segment.type === "giggle"
    ) {

        speakUtterance(
            "hee hee hee",
            {
                rate: 0.9,
                pitch: 1.25,
                volume: 0.62
            },
            function() {

                setTimeout(
                    done,
                    150
                );
            }
        );

        return;
    }

    if (
        segment.type === "sigh"
    ) {

        speakUtterance(
            "haaah...",
            {
                rate: 0.58,
                pitch: 0.72,
                volume: 0.52
            },
            function() {

                setTimeout(
                    done,
                    250
                );
            }
        );

        return;
    }

    if (
        segment.type === "breath"
    ) {

        speakUtterance(
            "haa...",
            {
                rate: 0.45,
                pitch: 0.68,
                volume: 0.28
            },
            function() {

                setTimeout(
                    done,
                    180
                );
            }
        );

        return;
    }

    if (
        segment.type === "whisper"
    ) {

        voicePerformanceMode =
            "whisper";

        setTimeout(
            done,
            80
        );

        return;
    }

    done();
}

// ============================================================
// SPEAK YUVA REPLY
// ============================================================

function speakReply(
    text,
    force = false
) {

    if (
        !voiceOutputEnabled &&
        !force
    ) {
        return;
    }

    if (
        !("speechSynthesis" in window)
    ) {
        return;
    }

    window.speechSynthesis.cancel();

    const segments =
        parsePerformance(text);

    if (!segments.length) {
        return;
    }

    voicePerformanceMode =
        "normal";

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

    let index = 0;

    function next() {

        if (
            index >=
            segments.length
        ) {

            finishSpeaking();
            return;
        }

        const segment =
            segments[index++];

        performSegment(
            segment,
            next
        );
    }

    next();
}

// ============================================================
// FINISH SPEAKING
// ============================================================

function finishSpeaking() {

    isSpeaking = false;

    voicePerformanceMode =
        "normal";

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

// ============================================================
// STOP SPEAKING
// ============================================================

function stopSpeaking() {

    if (
        "speechSynthesis" in window
    ) {

        window.speechSynthesis.cancel();
    }

    isSpeaking = false;

    voicePerformanceMode =
        "normal";

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

// ============================================================
// CLEAR MEMORY
// ============================================================

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

    if (chat) {
        chat.innerHTML = "";
    }

    addMessage(
        "Memory cleared. Starting fresh! 🧠✨",
        "ai"
    );
}

// ============================================================
// LOGOUT
// ============================================================

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

// ============================================================
// CHECK EXISTING SESSION
// ============================================================

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

            const loginScreen =
                document.getElementById(
                    "loginScreen"
                );

            const app =
                document.getElementById(
                    "app"
                );

            if (loginScreen) {

                loginScreen.style.display =
                    "none";
            }

            if (app) {

                app.style.display =
                    "flex";
            }

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

// ============================================================
// VOICE EXPERIENCE
// ============================================================

function buildVoiceExperiencePanel() {

    if (
        document.getElementById(
            "yuvaVoiceExperienceCard"
        )
    ) {
        return;
    }

    const style =
        document.createElement("style");

    style.id =
        "yuva-voice-experience-style";

    style.textContent = `

        /*
         * =====================================================
         * YUVA VOICE FAB
         *
         * IMPORTANT:
         * This is intentionally ABOVE the message composer.
         * It must NOT sit on top of the Send button.
         * =====================================================
         */

        .yuva-voice-fab {
            position: fixed;
            right: 22px;
            bottom: 92px;

            width: 56px;
            height: 56px;

            border: 1px solid rgba(255,255,255,.14);
            border-radius: 50%;

            background: rgba(20,20,30,.88);
            color: white;

            font-size: 23px;

            cursor: pointer;

            display: flex;
            align-items: center;
            justify-content: center;

            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);

            box-shadow:
                0 12px 35px rgba(0,0,0,.35);

            z-index: 9998;

            transition:
                transform .2s ease,
                box-shadow .2s ease;
        }

        .yuva-voice-fab:hover {
            transform:
                translateY(-3px)
                scale(1.04);

            box-shadow:
                0 18px 45px rgba(0,0,0,.45);
        }

        .yuva-voice-fab.active {
            transform: scale(1.08);

            box-shadow:
                0 0 0 6px rgba(150,120,255,.12),
                0 18px 45px rgba(0,0,0,.45);
        }

        /*
         * Voice settings card.
         * It opens ABOVE the voice button,
         * never over the message input.
         */

        .yuva-voice-card {
            position: fixed;

            right: 22px;
            bottom: 158px;

            width: 310px;

            padding: 17px;

            border:
                1px solid rgba(255,255,255,.12);

            border-radius: 18px;

            background:
                rgba(20,20,30,.94);

            color: white;

            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);

            box-shadow:
                0 20px 60px rgba(0,0,0,.38);

            z-index: 9997;

            transform:
                translateY(10px)
                scale(.97);

            opacity: 0;

            pointer-events: none;

            transition:
                opacity .2s ease,
                transform .2s ease;
        }

        .yuva-voice-card.open {
            opacity: 1;

            transform:
                translateY(0)
                scale(1);

            pointer-events: auto;
        }

        .yuva-voice-head {
            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 12px;

            margin-bottom: 14px;
        }

        .yuva-voice-title {
            font-weight: 700;
            font-size: 15px;
        }

        .yuva-voice-sub {
            font-size: 11px;
            opacity: .58;
            margin-top: 2px;
        }

        .yuva-voice-status {
            font-size: 11px;

            padding: 5px 8px;

            border-radius: 999px;

            background:
                rgba(255,255,255,.08);

            white-space: nowrap;
        }

        .yuva-voice-status.live {
            background:
                rgba(90,220,150,.13);

            color:
                #a8ffd0;
        }

        .yuva-voice-row {
            margin: 13px 0;
        }

        .yuva-voice-label {
            display: flex;
            justify-content: space-between;

            font-size: 12px;
            opacity: .82;

            margin-bottom: 7px;
        }

        .yuva-voice-range {
            width: 100%;
            cursor: pointer;
        }

        .yuva-voice-select {
            width: 100%;
            box-sizing: border-box;

            padding: 9px 10px;

            border:
                1px solid rgba(255,255,255,.12);

            border-radius: 11px;

            background:
                rgba(255,255,255,.06);

            color: inherit;

            outline: none;
        }

        .yuva-voice-select option {
            background: #17171f;
            color: #fff;
        }

        .yuva-voice-actions {
            display: grid;

            grid-template-columns:
                1fr 1fr;

            gap: 8px;

            margin-top: 14px;
        }

        .yuva-voice-btn {
            border:
                1px solid rgba(255,255,255,.11);

            border-radius: 11px;

            padding: 10px;

            background:
                rgba(255,255,255,.06);

            color: #fff;

            cursor: pointer;
        }

        .yuva-voice-btn:hover {
            background:
                rgba(255,255,255,.10);
        }

        .yuva-voice-btn.danger {
            background:
                rgba(255,80,100,.10);
        }

        .yuva-voice-switch {
            display: flex;

            align-items: center;
            justify-content: space-between;

            padding: 10px 0;

            font-size: 12px;
        }

        .yuva-switch {
            width: 42px;
            height: 24px;

            border-radius: 999px;
            border: 0;

            padding: 3px;

            background:
                rgba(255,255,255,.16);

            cursor: pointer;
        }

        .yuva-switch span {
            display: block;

            width: 18px;
            height: 18px;

            border-radius: 50%;

            background: #fff;

            transition:
                transform .18s ease;
        }

        .yuva-switch.on {
            background:
                rgba(100,220,160,.55);
        }

        .yuva-switch.on span {
            transform:
                translateX(18px);
        }

        /*
         * =====================================================
         * MOBILE
         * =====================================================
         *
         * Voice button is deliberately kept above the composer.
         * It no longer occupies the Send button area.
         */

        @media (max-width: 600px) {

            .yuva-voice-fab {
                right: 14px;

                /*
                 * Leave the bottom composer completely free.
                 */
                bottom: 92px;

                width: 52px;
                height: 52px;

                font-size: 21px;
            }

            .yuva-voice-card {
                right: 14px;

                /*
                 * Card opens above the voice FAB.
                 */
                bottom: 154px;

                width:
                    calc(100vw - 28px);

                max-height:
                    calc(100vh - 190px);

                overflow-y: auto;

                box-sizing: border-box;
            }

            .yuva-voice-actions {
                grid-template-columns:
                    1fr 1fr;
            }
        }

        /*
         * Very small phones.
         */
        @media (max-width: 380px) {

            .yuva-voice-fab {
                right: 12px;
                bottom: 88px;

                width: 50px;
                height: 50px;
            }

            .yuva-voice-card {
                right: 10px;
                bottom: 148px;

                width:
                    calc(100vw - 20px);
            }
        }
    `;

    document.head.appendChild(style);

    const fab =
        document.createElement("button");

    fab.type = "button";
    fab.className = "yuva-voice-fab";
    fab.id = "yuvaVoiceFab";
    fab.title = "Voice controls";
    fab.setAttribute(
        "aria-label",
        "Open YUVA voice controls"
    );
    fab.textContent = "🎙️";

    const card =
        document.createElement("div");

    card.className =
        "yuva-voice-card";

    card.id =
        "yuvaVoiceExperienceCard";

    card.innerHTML = `

        <div class="yuva-voice-head">

            <div>

                <div class="yuva-voice-title">
                    YUVA Voice
                </div>

                <div class="yuva-voice-sub">
                    Control how YUVA sounds
                </div>

            </div>

            <div
                class="yuva-voice-status"
                id="yuvaVoiceMiniStatus"
            >
                Ready
            </div>

        </div>

        <div class="yuva-voice-row">

            <div class="yuva-voice-label">
                <span>Voice</span>
            </div>

            <select
                class="yuva-voice-select"
                id="yuvaVoiceSelect"
            >
                <option value="">
                    ✨ Default Voice
                </option>
            </select>

        </div>

        <div class="yuva-voice-row">

            <div class="yuva-voice-label">

                <span>Speed</span>

                <span id="yuvaRateValue">
                    1.00×
                </span>

            </div>

            <input
                class="yuva-voice-range"
                id="yuvaRate"
                type="range"
                min="0.6"
                max="1.4"
                step="0.05"
            >

        </div>

        <div class="yuva-voice-row">

            <div class="yuva-voice-label">

                <span>Pitch</span>

                <span id="yuvaPitchValue">
                    1.00×
                </span>

            </div>

            <input
                class="yuva-voice-range"
                id="yuvaPitch"
                type="range"
                min="0.75"
                max="1.3"
                step="0.05"
            >

        </div>

        <div class="yuva-voice-row">

            <div class="yuva-voice-label">

                <span>Volume</span>

                <span id="yuvaVolumeValue">
                    100%
                </span>

            </div>

            <input
                class="yuva-voice-range"
                id="yuvaVolume"
                type="range"
                min="0.1"
                max="1"
                step="0.05"
            >

        </div>

        <div class="yuva-voice-switch">

            <span>
                Auto-speak replies
            </span>

            <button
                class="yuva-switch"
                id="yuvaAutoSpeak"
                type="button"
                aria-label="Toggle auto speak"
            >
                <span></span>
            </button>

        </div>

        <div class="yuva-voice-actions">

            <button
                class="yuva-voice-btn"
                id="yuvaTestVoice"
                type="button"
            >
                🔊 Test voice
            </button>

            <button
                class="yuva-voice-btn danger"
                id="yuvaStopVoice"
                type="button"
            >
                ⏹ Stop
            </button>

        </div>
    `;

    document.body.appendChild(card);
    document.body.appendChild(fab);

    const miniStatus =
        document.getElementById(
            "yuvaVoiceMiniStatus"
        );

    const rate =
        document.getElementById(
            "yuvaRate"
        );

    const pitch =
        document.getElementById(
            "yuvaPitch"
        );

    const volume =
        document.getElementById(
            "yuvaVolume"
        );

    const rateValue =
        document.getElementById(
            "yuvaRateValue"
        );

    const pitchValue =
        document.getElementById(
            "yuvaPitchValue"
        );

    const volumeValue =
        document.getElementById(
            "yuvaVolumeValue"
        );

    const autoSpeak =
        document.getElementById(
            "yuvaAutoSpeak"
        );

    const panelSelect =
        document.getElementById(
            "yuvaVoiceSelect"
        );

    rate.value =
        voiceSettings.rate;

    pitch.value =
        voiceSettings.pitch;

    volume.value =
        voiceSettings.volume;

    function syncSwitch() {

        autoSpeak.classList.toggle(
            "on",
            autoSpeakEnabled
        );
    }

    function syncLabels() {

        rateValue.textContent =
            `${Number(
                voiceSettings.rate
            ).toFixed(2)}×`;

        pitchValue.textContent =
            `${Number(
                voiceSettings.pitch
            ).toFixed(2)}×`;

        volumeValue.textContent =
            `${Math.round(
                Number(
                    voiceSettings.volume
                ) * 100
            )}%`;
    }

    function populatePanelVoices() {

        panelSelect.innerHTML =
            `
            <option value="">
                ✨ Default Voice
            </option>
            `;

        voices.forEach(
            (voice, index) => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value = index;

                option.textContent =
                    `${voice.name} • ${voice.lang}`;

                panelSelect.appendChild(
                    option
                );
            }
        );

        const saved =
            localStorage.getItem(
                "yuva_selected_voice"
            );

        if (
            saved !== null &&
            voices[saved]
        ) {

            panelSelect.value =
                saved;
        }
    }

    rate.addEventListener(
        "input",
        function() {

            voiceSettings.rate =
                Number(rate.value);

            localStorage.setItem(
                "yuva_voice_rate",
                voiceSettings.rate
            );

            syncLabels();
        }
    );

    pitch.addEventListener(
        "input",
        function() {

            voiceSettings.pitch =
                Number(pitch.value);

            localStorage.setItem(
                "yuva_voice_pitch",
                voiceSettings.pitch
            );

            syncLabels();
        }
    );

    volume.addEventListener(
        "input",
        function() {

            voiceSettings.volume =
                Number(volume.value);

            localStorage.setItem(
                "yuva_voice_volume",
                voiceSettings.volume
            );

            syncLabels();
        }
    );

    panelSelect.addEventListener(
        "change",
        function() {

            localStorage.setItem(
                "yuva_selected_voice",
                panelSelect.value
            );

            if (voiceSelect) {
                voiceSelect.value =
                    panelSelect.value;
            }

            setVoiceStatus(
                "Voice selected",
                "",
                true
            );

            setTimeout(
                function() {

                    if (!isSpeaking) {

                        setVoiceStatus(
                            "Ready",
                            "",
                            false
                        );
                    }

                },
                1000
            );
        }
    );

    autoSpeak.addEventListener(
        "click",
        function() {

            autoSpeakEnabled =
                !autoSpeakEnabled;

            localStorage.setItem(
                "yuva_auto_speak",
                autoSpeakEnabled
            );

            syncSwitch();
        }
    );

    document
        .getElementById("yuvaTestVoice")
        .addEventListener(
            "click",
            function() {

                voiceOutputEnabled = true;

                localStorage.setItem(
                    "yuva_voice_output",
                    "true"
                );

                updateVoiceToggleUI();

                speakReply(
                    "**chuckles softly** Hello. This is YUVA's voice test. **pause** Ummmm... I am ready.",
                    true
                );
            }
        );

    document
        .getElementById("yuvaStopVoice")
        .addEventListener(
            "click",
            function() {

                stopSpeaking();
            }
        );

    /*
     * VOICE BUTTON ONLY OPENS VOICE SETTINGS.
     *
     * It does NOT send a message.
     * It does NOT trigger the microphone.
     * It does NOT modify the Send button.
     */

    fab.addEventListener(
        "click",
        function(event) {

            event.preventDefault();
            event.stopPropagation();

            const open =
                card.classList.toggle("open");

            fab.classList.toggle(
                "active",
                open
            );

            if (open) {
                populatePanelVoices();
            }
        }
    );

    /*
     * Clicking outside the panel closes it.
     * This keeps the voice settings out of the
     * normal message-sending workflow.
     */

    document.addEventListener(
        "click",
        function(event) {

            if (
                !card.contains(event.target) &&
                !fab.contains(event.target)
            ) {

                card.classList.remove("open");

                fab.classList.remove("active");
            }
        }
    );

    setInterval(
        function() {

            if (!miniStatus) return;

            const activeText =
                voiceStatusText
                    ? voiceStatusText.textContent
                    : (
                        isSpeaking
                            ? "YUVA is speaking..."
                            : isListening
                                ? "Listening..."
                                : "Ready"
                    );

            miniStatus.textContent =
                activeText || "Ready";

            miniStatus.classList.toggle(
                "live",
                isSpeaking ||
                isListening
            );

        },
        250
    );

    syncLabels();
    syncSwitch();
    populatePanelVoices();
}

// ============================================================
// VISUAL ENHANCEMENTS
// ============================================================

function installYuvaVisualEnhancements() {

    if (
        document.getElementById(
            "yuva-script-enhancements"
        )
    ) {
        return;
    }

    const style =
        document.createElement("style");

    style.id =
        "yuva-script-enhancements";

    style.textContent = `

        .yuva-message-enter {
            opacity: 0;

            transform:
                translateY(10px)
                scale(0.985);

            transition:
                opacity 260ms ease,
                transform 260ms ease;
        }

        .yuva-message-enter.yuva-message-visible {
            opacity: 1;

            transform:
                translateY(0)
                scale(1);
        }

        .message-actions {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .speak-message-button {
            border: 0;

            background:
                transparent;

            cursor: pointer;

            padding:
                4px 6px;

            opacity: .65;

            transition:
                opacity 160ms ease,
                transform 160ms ease;
        }

        .speak-message-button:hover {
            opacity: 1;
            transform: scale(1.08);
        }

        .thinking-content {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .thinking-dots {
            display: inline-flex;
            gap: 3px;
            align-items: center;
        }

        .thinking-dots span {
            width: 4px;
            height: 4px;

            border-radius: 50%;

            background:
                currentColor;

            animation:
                yuvaThinkingDot 1.2s
                infinite ease-in-out;
        }

        .thinking-dots span:nth-child(2) {
            animation-delay: .15s;
        }

        .thinking-dots span:nth-child(3) {
            animation-delay: .3s;
        }

        @keyframes yuvaThinkingDot {

            0%, 60%, 100% {
                opacity: .3;
                transform: translateY(0);
            }

            30% {
                opacity: 1;
                transform: translateY(-3px);
            }
        }
    `;

    document.head.appendChild(style);
}

// ============================================================
// CURSOR GLOW
// ============================================================

const cursorGlow =
    document.getElementById("cursorGlow");

if (cursorGlow) {

    document.addEventListener(
        "pointermove",
        function(event) {

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
        function() {

            cursorGlow.style.opacity =
                "0";
        }
    );
}

// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const app =
            document.getElementById("app");

        if (app) {
            app.style.display = "none";
        }

        checkExistingSession();

        updateVoiceToggleUI();

        installYuvaVisualEnhancements();

        buildVoiceExperiencePanel();
    }
);