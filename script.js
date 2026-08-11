const input = document.getElementById("userInput");
const chat = document.getElementById("chat");

let creatorToken =
    localStorage.getItem("yuva_creator_token");


// ========================================
// PAGE START
// ========================================

window.addEventListener("load", async () => {

    hideApp();

    if (creatorToken) {

        const valid =
            await verifyCreator();

        if (valid) {

            showApp();

            setCreatorStatus();

            return;

        }

    }

    showLogin();

});


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
            await fetch("/login", {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    password: password
                })

            });

        const data =
            await response.json();

        if (data.success) {

            creatorToken =
                data.token;

            localStorage.setItem(
                "yuva_creator_token",
                creatorToken
            );

            document.getElementById(
                "creatorPassword"
            ).value = "";

            showApp();

            setCreatorStatus();

            addMessage(
                "Welcome back, Creator Yuva. 👑🤖",
                "ai"
            );

        } else {

            message.textContent =
                data.message ||
                "Incorrect password.";

        }

    } catch (error) {

        console.error(error);

        message.textContent =
            "Unable to connect to YUVA AI.";
    }
}


// ========================================
// GUEST
// ========================================

function continueAsGuest() {

    creatorToken = null;

    showApp();

    document.getElementById(
        "status"
    ).textContent =
        "Guest Mode";

}


// ========================================
// VERIFY CREATOR
// ========================================

async function verifyCreator() {

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

        if (data.authenticated) {
            return true;
        }

    } catch (error) {

        console.error(error);

    }

    localStorage.removeItem(
        "yuva_creator_token"
    );

    creatorToken = null;

    return false;
}


// ========================================
// LOGOUT
// ========================================

async function creatorLogout() {

    if (creatorToken) {

        try {

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

        } catch (error) {

            console.error(error);

        }

    }

    creatorToken = null;

    localStorage.removeItem(
        "yuva_creator_token"
    );

    location.reload();
}


// ========================================
// SEND MESSAGE
// ========================================

async function sendMessage() {

    const text =
        input.value.trim();

    if (!text) return;

    addMessage(
        text,
        "user"
    );

    input.value = "";

    const loading =
        addMessage(
            "Thinking... 🤔",
            "ai"
        );

    try {

        const response =
            await fetch(
                "/chat",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        message: text,

                        token:
                            creatorToken

                    })

                }
            );

        const data =
            await response.json();

        if (data.reply) {

            loading
                .querySelector(".bubble")
                .textContent =
                data.reply;

        } else {

            loading
                .querySelector(".bubble")
                .textContent =
                "Something went wrong.";

        }

    } catch (error) {

        console.error(error);

        loading
            .querySelector(".bubble")
            .textContent =
            "I couldn't connect to my AI brain. 🧠❌";
    }
}


// ========================================
// ADD MESSAGE
// ========================================

function addMessage(
    text,
    type
) {

    const message =
        document.createElement(
            "div"
        );

    message.className =
        `message ${type}`;

    const avatar =
        type === "ai"
            ? "🤖"
            : "👤";

    message.innerHTML = `
        <div class="avatar">
            ${avatar}
        </div>

        <div class="bubble"></div>
    `;

    message
        .querySelector(".bubble")
        .textContent = text;

    chat.appendChild(
        message
    );

    chat.scrollTop =
        chat.scrollHeight;

    return message;
}


// ========================================
// SHOW / HIDE
// ========================================

function showLogin() {

    document.getElementById(
        "loginScreen"
    ).style.display = "flex";

    document.getElementById(
        "app"
    ).style.display = "none";
}


function hideApp() {

    document.getElementById(
        "loginScreen"
    ).style.display = "none";

    document.getElementById(
        "app"
    ).style.display = "none";
}


function showApp() {

    document.getElementById(
        "loginScreen"
    ).style.display = "none";

    document.getElementById(
        "app"
    ).style.display = "flex";
}


function setCreatorStatus() {

    document.getElementById(
        "status"
    ).textContent =
        "👑 Creator Mode";
}


// ========================================
// ENTER KEY
// ========================================

document
    .getElementById(
        "creatorPassword"
    )
    .addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Enter"
            ) {

                creatorLogin();

            }

        }
    );


input.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter"
        ) {

            sendMessage();

        }

    }
);