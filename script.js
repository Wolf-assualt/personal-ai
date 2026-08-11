// ========================================
// YUVA AI — COMPLETE FRONTEND SCRIPT
// ========================================

const input = document.getElementById("userInput");
const chat = document.getElementById("chat");

let creatorToken =
    localStorage.getItem("yuva_creator_token");

let conversationHistory = [];


// ========================================
// VOICE ELEMENTS
// ========================================

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

const liveVoiceButton =
    document.getElementById("liveVoiceButton");


// ========================================
// VOICE STATE
// ========================================

let voiceOutputEnabled =
    localStorage.getItem("yuva_voice_output") === "true";

let voices = [];

let recognition = null;

let isListening = false;
let isSpeaking = false;


// ========================================
// LIVE VOICE STATE
// ========================================

let liveVoiceMode = false;
let liveWaitingForReply = false;
let liveRestartTimer = null;


// ========================================
// SPEECH RECOGNITION
// ========================================

const SpeechRecognitionAPI =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (SpeechRecognitionAPI) {

    recognition =
        new SpeechRecognitionAPI();

    recognition.continuous = false;

    recognition.interimResults = true;

    recognition.lang = "en-IN";


    recognition.onstart = function () {

        isListening = true;


        // Stop YUVA if user starts talking
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
            liveVoiceMode
                ? "YUVA Live is listening..."
                : "Listening...",
            "listening",
            true
        );
    };


    recognition.onresult =
        function (event) {

            // LIVE MODE
            if (liveVoiceMode) {

                handleLiveVoiceResult(
                    event
                );

                return;
            }


            // NORMAL VOICE MODE

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


            if (
                input &&
                transcript.trim()
            ) {

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

                if (!isSpeaking) {

                    micButton.textContent =
                        "🎤";
                }
            }


            // In Live Mode, recover automatically
            if (liveVoiceMode) {

                if (
                    event.error ===
                    "not-allowed"
                ) {

                    liveVoiceMode = false;

                    liveWaitingForReply = false;

                    updateLiveVoiceUI();

                    setVoiceStatus(
                        "Microphone permission denied",
                        "",
                        true
                    );

                    return;
                }


                if (
                    event.error ===
                    "aborted"
                ) {

                    return;
                }


                clearTimeout(
                    liveRestartTimer
                );


                liveRestartTimer =
                    setTimeout(
                        startLiveListening,
                        600
                    );

                return;
            }


            // Normal voice mode errors

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

                    if (
                        !isSpeaking &&
                        !liveVoiceMode
                    ) {

                        setVoiceStatus(
                            "Ready",
                            "",
                            false
                        );
                    }

                },
                2000
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


            // LIVE MODE
            if (liveVoiceMode) {

                if (
                    !liveWaitingForReply &&
                    !isSpeaking
                ) {

                    clearTimeout(
                        liveRestartTimer
                    );

                    liveRestartTimer =
                        setTimeout(
                            startLiveListening,
                            300
                        );
                }

                return;
            }


            // NORMAL MODE

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
// VOICE STATUS UI
// ========================================

function setVoiceStatus(
    text,
    state = "",
    visible = true
) {

    if (!voiceStatus) return;


    if (voiceStatusText) {

        voiceStatusText.textContent =
            text;
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
// NORMAL VOICE INPUT
// ========================================

function toggleVoiceInput() {

    if (!recognition) {

        addMessage(
            "Voice input isn't supported in this browser. Try Chrome or Edge.",
            "ai"
        );

        return;
    }


    if (liveVoiceMode) {

        stopLiveVoice();

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
            "Recognition start error:",
            error
        );
    }
}


// ========================================
// VOICE OUTPUT UI
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
// TOGGLE VOICE OUTPUT
// ========================================

function toggleVoiceOutput() {

    voiceOutputEnabled =
        !voiceOutputEnabled;


    localStorage.setItem(
        "yuva_voice_output",
        voiceOutputEnabled
            ? "true"
            : "false"
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

                if (
                    !isListening &&
                    !isSpeaking
                ) {

                    setVoiceStatus(
                        "Ready",
                        "",
                        false
                    );
                }

            },
            1200
        );

    } else {

        setVoiceStatus(
            "Voice output enabled",
            "",
            true
        );


        setTimeout(
            () => {

                if (
                    !isListening &&
                    !isSpeaking
                ) {

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

                    if (
                        !isListening &&
                        !isSpeaking
                    ) {

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
}


// ========================================
// SPEAK YUVA REPLY
// ========================================

function speakReply(text) {

    if (!voiceOutputEnabled) {

        // In Live Mode, voice output is
        // automatically required.
        if (!liveVoiceMode) {

            return;
        }
    }


    if (
        !("speechSynthesis" in window)
    ) {

        return;
    }


    window.speechSynthesis.cancel();


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


    if (!cleanText) {

        if (liveVoiceMode) {

            continueLiveConversation();
        }

        return;
    }


    const utterance =
        new SpeechSynthesisUtterance(
            cleanText
        );


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


    utterance.rate = 1;

    utterance.pitch = 1;

    utterance.volume = 1;


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


            if (liveVoiceMode) {

                continueLiveConversation();

            } else {

                setVoiceStatus(
                    "Ready",
                    "",
                    false
                );
            }
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


            if (liveVoiceMode) {

                continueLiveConversation();

            } else {

                setVoiceStatus(
                    "Ready",
                    "",
                    false
                );
            }
        };


    window.speechSynthesis.speak(
        utterance
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
}


// ========================================
// 🔴 LIVE VOICE MODE
// ========================================

function updateLiveVoiceUI() {

    if (!liveVoiceButton) return;


    if (liveVoiceMode) {

        liveVoiceButton.textContent =
            "🔴 Live: On";

        liveVoiceButton.classList.add(
            "live-active"
        );

    } else {

        liveVoiceButton.textContent =
            "🔴 Live";

        liveVoiceButton.classList.remove(
            "live-active"
        );
    }
}


// ========================================
// START LIVE MODE
// ========================================

function startLiveVoice() {

    if (!recognition) {

        setVoiceStatus(
            "Live voice isn't supported in this browser",
            "",
            true
        );

        return;
    }


    /*
     * Live mode needs voice output.
     * Automatically enable it.
     */

    if (!voiceOutputEnabled) {

        voiceOutputEnabled = true;

        localStorage.setItem(
            "yuva_voice_output",
            "true"
        );

        updateVoiceToggleUI();
    }


    liveVoiceMode = true;

    liveWaitingForReply = false;


    updateLiveVoiceUI();


    stopSpeaking();


    setVoiceStatus(
        "YUVA Live is listening...",
        "listening",
        true
    );


    startLiveListening();
}


// ========================================
// STOP LIVE MODE
// ========================================

function stopLiveVoice() {

    liveVoiceMode = false;

    liveWaitingForReply = false;


    clearTimeout(
        liveRestartTimer
    );


    if (recognition) {

        try {

            recognition.abort();

        } catch (error) {

            console.log(error);
        }
    }


    stopSpeaking();


    updateLiveVoiceUI();


    setVoiceStatus(
        "Live mode stopped",
        "",
        true
    );


    setTimeout(
        () => {

            if (!liveVoiceMode) {

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


// ========================================
// TOGGLE LIVE MODE
// ========================================

function toggleLiveVoice() {

    if (liveVoiceMode) {

        stopLiveVoice();

    } else {

        startLiveVoice();
    }
}


// ========================================
// START LIVE LISTENING
// ========================================

function startLiveListening() {

    if (!liveVoiceMode) return;

    if (isListening) return;

    if (liveWaitingForReply) return;

    try {

        recognition.start();

    } catch (error) {

        console.log(
            "Live recognition start:",
            error
        );


        clearTimeout(
            liveRestartTimer
        );


        liveRestartTimer =
            setTimeout(
                startLiveListening,
                500
            );
    }
}


// ========================================
// LIVE SPEECH RESULT
// ========================================

function handleLiveVoiceResult(event) {

    let transcript = "";

    let finalText = "";


    for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
    ) {

        const result =
            event.results[i];


        const text =
            result[0].transcript;


        transcript += text;


        if (result.isFinal) {

            finalText += text;
        }
    }


    if (
        input &&
        transcript.trim()
    ) {

        input.value =
            transcript.trim();
    }


    if (
        finalText.trim() &&
        !liveWaitingForReply
    ) {

        liveWaitingForReply = true;


        input.value =
            finalText.trim();


        setVoiceStatus(
            "YUVA is thinking...",
            "speaking",
            true
        );


        sendMessage();
    }
}


// ========================================
// CONTINUE LIVE CONVERSATION
// ========================================

function continueLiveConversation() {

    if (!liveVoiceMode) return;


    liveWaitingForReply = false;


    setVoiceStatus(
        "YUVA Live is listening...",
        "listening",
        true
    );


    clearTimeout(
        liveRestartTimer
    );


    liveRestartTimer =
        setTimeout(
            startLiveListening,
            400
        );
}


// ========================================
// SEND MESSAGE
// ========================================

async function sendMessage() {

    const message =
        input.value.trim();


    if (!message) return;


    // Stop listening before sending
    if (isListening && recognition) {

        try {

            recognition.stop();

        } catch (error) {

            console.log(error);
        }
    }


    input.value = "";


    addMessage(
        message,
        "user"
    );


    conversationHistory.push({
        role: "user",
        content: message
    });


    const typing =
        document.createElement(
            "div"
        );


    typing.className =
        "message ai";


    typing.innerHTML = `
        <div class="avatar">🤖</div>
        <div class="bubble typing">
            YUVA is thinking...
        </div>
    `;


    chat.appendChild(
        typing
    );


    chat.scrollTop =
        chat.scrollHeight;


    try {

        const response =
            await fetch(
                "/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        ...(creatorToken
                            ? {
                                "Authorization":
                                    `Bearer ${creatorToken}`
                            }
                            : {})
                    },

                    body: JSON.stringify({
                        message: message,

                        history:
                            conversationHistory
                    })
                }
            );


        const data =
            await response.json();


        typing.remove();


        if (!response.ok) {

            addMessage(
                data.error ||
                "Something went wrong.",
                "ai"
            );


            if (liveVoiceMode) {

                liveWaitingForReply =
                    false;

                continueLiveConversation();
            }


            return;
        }


        addMessage(
            data.reply,
            "ai"
        );


        conversationHistory.push({
            role: "assistant",
            content: data.reply
        });


        /*
         * Speak the reply.
         */

        speakReply(
            data.reply
        );


        /*
         * If voice output is disabled
         * and Live Mode is active,
         * speakReply will still work
         * because Live Mode requires voice.
         */

        if (
            liveVoiceMode &&
            !isSpeaking
        ) {

            continueLiveConversation();
        }


    } catch (error) {

        console.error(
            "Chat error:",
            error
        );


        typing.remove();


        addMessage(
            "Unable to connect to YUVA AI.",
            "ai"
        );


        if (liveVoiceMode) {

            liveWaitingForReply =
                false;

            continueLiveConversation();
        }
    }
}


// ========================================
// ADD MESSAGE
// ========================================

function addMessage(
    text,
    sender
) {

    const message =
        document.createElement(
            "div"
        );


    message.className =
        `message ${sender}`;


    const avatar =
        document.createElement(
            "div"
        );


    avatar.className =
        "avatar";


    avatar.textContent =
        sender === "ai"
            ? "🤖"
            : "👤";


    const bubble =
        document.createElement(
            "div"
        );


    bubble.className =
        "bubble";


    bubble.textContent =
        text;


    message.appendChild(
        avatar
    );


    message.appendChild(
        bubble
    );


    chat.appendChild(
        message
    );


    chat.scrollTop =
        chat.scrollHeight;
}


// ========================================
// NEW CHAT
// ========================================

function clearMemory() {

    conversationHistory = [];


    chat.innerHTML = `
        <div class="message ai">

            <div class="avatar">
                🤖
            </div>

            <div class="bubble">
                Hi! I'm YUVA AI. How can I help you?
            </div>

        </div>
    `;


    input.value = "";


    if (liveVoiceMode) {

        liveWaitingForReply =
            false;
    }
}


// ========================================
// CREATOR LOGIN
// ========================================

async function creatorLogin() {

    const password =
        document.getElementById(
            "creatorPassword"
        ).value;


    const message =
        document.getElementById(
            "loginMessage"
        );


    if (!password) {

        message.textContent =
            "Please enter your password.";

        return;
    }


    try {

        const response =
            await fetch(
                "/creator-login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        password:
                            password
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            message.textContent =
                data.error ||
                "Login failed.";

            return;
        }


        creatorToken =
            data.token;


        localStorage.setItem(
            "yuva_creator_token",
            creatorToken
        );


        document.getElementById(
            "loginScreen"
        ).style.display =
            "none";


        document.getElementById(
            "app"
        ).style.display =
            "flex";


    } catch (error) {

        console.error(
            error
        );


        message.textContent =
            "Unable to connect to server.";
    }
}


// ========================================
// GUEST LOGIN
// ========================================

function continueAsGuest() {

    creatorToken = null;


    localStorage.removeItem(
        "yuva_creator_token"
    );


    document.getElementById(
        "loginScreen"
    ).style.display =
        "none";


    document.getElementById(
        "app"
    ).style.display =
        "flex";
}


// ========================================
// CREATOR LOGOUT
// ========================================

function creatorLogout() {

    stopLiveVoice();

    stopSpeaking();


    creatorToken = null;


    localStorage.removeItem(
        "yuva_creator_token"
    );


    document.getElementById(
        "app"
    ).style.display =
        "none";


    document.getElementById(
        "loginScreen"
    ).style.display =
        "flex";
}


// ========================================
// ENTER KEY
// ========================================

if (input) {

    input.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                sendMessage();
            }
        }
    );
}


// ========================================
// INITIALIZATION
// ========================================

updateVoiceToggleUI();

updateLiveVoiceUI();


// ========================================
// RESTORE LOGIN STATE
// ========================================

if (creatorToken) {

    document.getElementById(
        "loginScreen"
    ).style.display =
        "none";

    document.getElementById(
        "app"
    ).style.display =
        "flex";
}