import { useState } from "react";

// Define the interface for the message request
interface MessageRequest {
    chat_id?: string;
    content: string;
}

// Define the return types of the hook
interface UseSendMessageHook {
    sendMessage: (message: MessageRequest) => Promise<void>;
    response: string | null;
    loading: boolean;
    error: string | null;
}

// PMJ 23/8/2024: This hook sends a message and gets a response from the backend workflow.
export const useSendMessage = (user_id: string): UseSendMessageHook => {
    const [response, setResponse] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendMessage = async (message: MessageRequest) => {
        setLoading(true); // PMJ 23/8/2024: Loading is set to true when the API call starts.
        try {
            const res = await fetch(`http://localhost:8000/api/messages/send?user_id=${user_id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(message), // PMJ 23/8/2024: The message is sent as a JSON object in the request body.
            });

            if (!res.ok) throw new Error("Failed to send message");
            const data = await res.json();
            setResponse(data.response); // PMJ 23/8/2024: The response from the backend is stored in state.
        } catch (err) {
            setError((err as Error).message); // PMJ 23/8/2024: If there's an error, it gets stored in state.
        } finally {
            setLoading(false); // PMJ 23/8/2024: Once the API call is done, loading is set to false.
        }
    };

    // PMJ 23/8/2024: The hook returns the sendMessage function, response, loading status, and any errors encountered.
    return { sendMessage, response, loading, error };
};
