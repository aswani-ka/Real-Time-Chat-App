"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chatbot = async (message) => {
    try {
        const msg = message.replace("/bot", "").trim().toLowerCase();
        if (msg.includes("hi") || msg.includes("hello") || msg.includes("hey")) {
            return "Hello 👋 How can I help you?";
        }
        if (msg.includes("how are you") || msg.includes("how you doing")) {
            return "I'm just code, but I'm running perfectly 😄";
        }
        if (msg.includes("what's your name") || msg.includes("your name")) {
            return "I'm your friendly chat assistant 🤖";
        }
        if (msg.includes("bye") || msg.includes("goodbye")) {
            return "Goodbye! 😊";
        }
        if (msg.includes("help")) {
            return `
                Available commands:
                /bot hello
                /bot how are you
                /bot what is your name
                /bot bye
                /bot help
                `;
        }
        return "🤖 Sorry, I didn't understand that. Try `/bot help`.";
    }
    catch (error) {
        return "Bot error";
    }
};
exports.default = chatbot;
