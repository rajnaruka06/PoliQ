import { useState } from "react";

interface MessageCurrent {
    sender: string;
    text: string;
    user: string;
}

export const useHandleSend = (
    messages: MessageCurrent[],
    setMessages: React.Dispatch<React.SetStateAction<MessageCurrent[]>>,
    input: string,
    setInput: React.Dispatch<React.SetStateAction<string>>
) => {
    const handleSend = async () => {
        if (input.trim()) {
            setMessages([
                ...messages,
                { sender: "user", text: input, user: "user" },
            ]);
            try {
                const response = await fetch("http://localhost:8000/run", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        user_query: input,
                    }),
                });

                if (!response.ok) {
                    throw new Error("API call failed");
                }

                const data = await response.json();

                setMessages((prevMessages) => [
                    ...prevMessages,
                    { sender: "bot", text: data.response, user: "bot" },
                ]);
                console.log("API call was successful!");
            } catch (error) {
                console.error("Error sending message:", error);
                setMessages((prevMessages) => [
                    ...prevMessages,
                    {
                        sender: "bot",
                        text: "Sorry, there was an error processing your request.",
                        user: "bot",
                    },
                ]);
            }

            setInput("");
        }
    };

    return { handleSend };
};
