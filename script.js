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

if (input) {
    input.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {
                event.preventDefault();
                sendMessage();
            }
        }
    );
}

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
// YUVA VOICE SYSTEM
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
    document.getElementById(
        "stopSpeakingButton"
    );

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

        voiceStatus.classList.add(
            state
        );

        voiceStatus.classList.add(
            "active"
        );
    }

    if (visible) {

        voiceStatus.classList.add(
            "visible"
        );

    } else {

        voiceStatus.classList.remove(
            "visible"
        );
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

    recognition.lang = "en-IN";


    recognition.onstart =
        function () {

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

                micButton.textContent =
                    "🔴";
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

                micButton.textContent =
                    "🎤";
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

// ========================================
// UPDATE VOICE TOGGLE
// ========================================

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

// ========================================
// TOGGLE VOICE
// ========================================

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

// ============================================================
// EXPRESSIVE SPEECH ENGINE
// ============================================================
//
// This is the important part.
//
// YUVA should NOT send:
//
//     ummmmmmmm
//
// directly to browser TTS.
//
// Browser TTS often turns it into:
//
//     u m m m m m m m
//
// Instead we detect the expression and create a controlled
// speech sequence.
//
// Examples:
//
//     ummmmmmmm  -> "umm..." + natural hold
//     ahhhhhhhh  -> "ah..."  + natural hold
//     uhhhhhhh   -> "uh..."  + natural hold
//     yeahhhh    -> "yeah..." + natural hold
//     hmmmmmmm   -> "hmm..." + natural hold
//
// ============================================================

// ========================================
// DETECT EXPRESSIVE WORD
// ========================================

function detectExpressiveSound(word) {

    if (!word) return null;

    const clean =
        word
            .trim()
            .toLowerCase()
            .replace(
                /^[^\p{L}]+|[^\p{L}]+$/gu,
                ""
            );

    if (!clean) return null;


    // UMMMMMMMM
    if (/^u+m{2,}$/i.test(clean)) {

        return {
            type: "umm",
            original: clean,
            base: "umm",
            repeatCount:
                clean.length - 2
        };
    }


    // AHHHHHHHH
    if (/^a+h{2,}$/i.test(clean)) {

        return {
            type: "ah",
            original: clean,
            base: "ah",
            repeatCount:
                clean.length - 2
        };
    }


    // UHHHHHHHH
    if (/^u+h{2,}$/i.test(clean)) {

        return {
            type: "uh",
            original: clean,
            base: "uh",
            repeatCount:
                clean.length - 2
        };
    }


    // YEAHHHHHH
    if (/^yeah+h{2,}$/i.test(clean)) {

        return {
            type: "yeah",
            original: clean,
            base: "yeah",
            repeatCount:
                clean.length - 5
        };
    }


    // HMMMMMMMM
    if (/^h+m{2,}$/i.test(clean)) {

        return {
            type: "hmm",
            original: clean,
            base: "hmm",
            repeatCount:
                clean.length - 3
        };
    }

    return null;
}

// ========================================
// CREATE EXPRESSIVE SPEECH
// ========================================

function createExpressiveSpeech(expression) {

    if (!expression) return null;

    /*
     * We deliberately do NOT give the browser
     * the user's repeated letters.
     *
     * Example:
     *
     * ummmmmmmmmmmmm
     *
     * becomes:
     *
     * "umm"
     *
     * followed by silence.
     */

    const hold =
        Math.min(
            2200,
            Math.max(
                450,
                450 +
                (
                    expression.repeatCount *
                    90
                )
            )
        );

    let text =
        expression.base;

    let rate = 0.85;
    let pitch = 1;
    let volume = 1;

    if (
        expression.type === "umm"
    ) {

        text = "umm";
        rate = 0.72;
        pitch = 0.95;

    } else if (
        expression.type === "ah"
    ) {

        text = "ah";
        rate = 0.65;
        pitch = 0.9;

    } else if (
        expression.type === "uh"
    ) {

        text = "uh";
        rate = 0.70;
        pitch = 0.9;

    } else if (
        expression.type === "yeah"
    ) {

        text = "yeah";
        rate = 0.82;
        pitch = 1.0;

    } else if (
        expression.type === "hmm"
    ) {

        text = "hmm";
        rate = 0.70;
        pitch = 0.85;
    }

    return {
        text,
        hold,
        rate,
        pitch,
        volume
    };
}

// ========================================
// CLEAN MARKDOWN
// ========================================

function cleanSpeechText(text) {

    if (!text) return "";

    let result = text;

    /*
     * Remove code blocks.
     */

    result =
        result.replace(
            /```[\s\S]*?```/g,
            ""
        );

    /*
     * Convert markdown links
     * into visible text.
     */

    result =
        result.replace(
            /\[([^\]]+)\]\([^)]+\)/g,
            "$1"
        );

    /*
     * Remove common markdown symbols.
     */

    result =
        result.replace(
            /[#>`_~]/g,
            ""
        );

    /*
     * Normalize spaces.
     */

    result =
        result.replace(
            /\s{2,}/g,
            " "
        );

    return result.trim();
}

// ============================================================
// REMOVE / INTERPRET ACTION MARKERS
// ============================================================
//
// Examples:
//
// *laughs*
// *laughs softly*
// *whispers softly*
// *whispers back softly, with a hint of a smile*
// *leans closer*
// *looks at you*
// *pauses*
//
// These must NEVER be spoken literally.
//
// ============================================================

function parseSpeechPerformance(text) {

    const segments = [];

    if (!text) return segments;

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


        // --------------------------------
        // LAUGH
        // --------------------------------

        if (
            cue.includes("laugh")
        ) {

            segments.push({
                type: "laugh",

                soft:
                    cue.includes("soft") ||
                    cue.includes("quiet")
            });


        // --------------------------------
        // WHISPER
        // --------------------------------

        } else if (
            cue.includes("whisper")
        ) {

            segments.push({
                type: "whisper"
            });


        // --------------------------------
        // PAUSE
        // --------------------------------

        } else if (
            cue.includes("pause") ||
            cue.includes("wait") ||
            cue.includes("silence")
        ) {

            segments.push({
                type: "pause"
            });


        // --------------------------------
        // SIGH
        // --------------------------------

        } else if (
            cue.includes("sigh")
        ) {

            segments.push({
                type: "sigh"
            });


        // --------------------------------
        // MOAN
        // --------------------------------

        } else if (
            cue.includes("moan")
        ) {

            segments.push({
                type: "moan"
            });


        // --------------------------------
        // BREATH
        // --------------------------------

        } else if (
            cue.includes("breath") ||
            cue.includes("inhale") ||
            cue.includes("exhale")
        ) {

            segments.push({
                type: "breath"
            });


        // --------------------------------
        // OTHER ACTION
        // --------------------------------

        } else {

            /*
             * Things like:
             *
             * *smiles*
             * *leans closer*
             * *looks at you*
             *
             * are visual/action cues.
             *
             * They are NOT spoken.
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

// ============================================================
// SPEAK TEXT WITH EXPRESSIVE SOUNDS
// ============================================================

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
     * Split into whitespace-preserving pieces.
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
         * Detect expressive sound.
         */

        const expression =
            detectExpressiveSound(
                part
            );


        if (expression) {

            const speech =
                createExpressiveSpeech(
                    expression
                );

            if (!speech) {

                nextPart();
                return;
            }


            const utterance =
                new SpeechSynthesisUtterance(
                    speech.text
                );

            applyVoiceSettings(
                utterance,
                {
                    rate:
                        speech.rate,
                    pitch:
                        speech.pitch,
                    volume:
                        speech.volume
                }
            );


            utterance.onend =
                function () {

                    /*
                     * The hold is REAL silence.
                     *
                     * We don't synthesize:
                     *
                     * h h h h h h
                     *
                     * anymore.
                     */

                    setTimeout(
                        nextPart,
                        speech.hold
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
         * Build a normal sentence chunk.
         *
         * Stop when an expressive word
         * appears.
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
                detectExpressiveSound(
                    next
                )
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

// ============================================================
// SPEAK PERFORMANCE SEGMENT
// ============================================================

function speakPerformanceSegment(
    segment,
    done
) {

    if (!segment) {

        done();
        return;
    }


    // ====================================
    // NORMAL TEXT
    // ====================================

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


    // ====================================
    // PAUSE
    // ====================================

    if (
        segment.type === "pause"
    ) {

        setTimeout(
            done,
            900
        );

        return;
    }


    // ====================================
    // WHISPER
    // ====================================

    if (
        segment.type === "whisper"
    ) {

        /*
         * Browser SpeechSynthesis does not
         * provide a true whisper mode.
         *
         * We therefore create a quieter,
         * slower voice setting for the
         * following content.
         *
         * The marker itself is NEVER spoken.
         */

        setTimeout(
            done,
            30
        );

        return;
    }


    // ====================================
    // LAUGH
    // ====================================

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
                        ? 0.78
                        : 0.95,

                pitch:
                    segment.soft
                        ? 1.08
                        : 1.15,

                volume:
                    segment.soft
                        ? 0.65
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


    // ====================================
    // SIGH
    // ====================================

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
                rate: 0.7,
                pitch: 0.8,
                volume: 0.65
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


    // ====================================
    // BREATH
    // ====================================

    if (
        segment.type === "breath"
    ) {

        /*
         * A real breath cannot be reliably
         * generated by browser TTS.
         *
         * Don't read the word "breath".
         * Instead create a short natural pause.
         */

        setTimeout(
            done,
            350
        );

        return;
    }


    // ====================================
    // MOAN
    // ====================================

    if (
        segment.type === "moan"
    ) {

        /*
         * Do NOT say:
         *
         * "moan"
         *
         * The marker is an instruction,
         * not text.
         *
         * We use a neutral non-verbal vocalization.
         */

        const utterance =
            new SpeechSynthesisUtterance(
                "mmm..."
            );


        applyVoiceSettings(
            utterance,
            {
                rate: 0.7,
                pitch: 0.8,
                volume: 0.65
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


    // ====================================
    // OTHER ACTIONS
    // ====================================

    /*
     * *smiles*
     * *leans closer*
     * *looks at you*
     *
     * Nothing is spoken.
     */

    done();
}

// ============================================================
// SPEAK YUVA REPLY
// ============================================================

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
     * Stop previous speech.
     */

    window.speechSynthesis.cancel();


    /*
     * Parse actions and expressions.
     */

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
// STOP SPEAKING
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
// STOP SPEAKING BUTTON
// ========================================

if (stopSpeakingButton) {

    stopSpeakingButton.addEventListener(
        "click",
        stopSpeaking
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
            ).style.display =
                "none";

            document.getElementById(
                "app"
            ).style.display =
                "flex";

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