const input = document.getElementById("userInput");
const chat = document.getElementById("chat");

async function sendMessage() {
    const text = input.value.trim();

    if (text === "") return;

    addMessage(text, "user");
    input.value = "";

    const loadingMessage = addMessage("Thinking... 🤔", "ai");

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: text
            })
        });

        const data = await response.json();

        if (data.reply) {
            loadingMessage.querySelector(".bubble").textContent = data.reply;
        } else {
            loadingMessage.querySelector(".bubble").textContent =
                "Something went wrong. 😕";
        }

    } catch (error) {
        console.error(error);

        loadingMessage.querySelector(".bubble").textContent =
            "I couldn't connect to my AI brain. 🧠❌";
    }
}

function addMessage(text, type) {
    const message = document.createElement("div");

    message.className = `message ${type}`;

    const avatar = type === "ai" ? "🤖" : "👤";

    message.innerHTML = `
        <div class="avatar">${avatar}</div>
        <div class="bubble"></div>
    `;

    message.querySelector(".bubble").textContent = text;

    chat.appendChild(message);

    chat.scrollTop = chat.scrollHeight;

    return message;
}

input.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});