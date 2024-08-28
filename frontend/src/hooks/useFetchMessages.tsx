import { useState, useEffect } from "react";

// Define the message structure based on your backend response
interface MessageHistory {
    messageID: string;
    user: string;
    content: string;
    date: string;
    time: string;
}

// Define the return types of the hook
interface UseFetchMessagesHook {
    messages: MessageHistory[];
    loading: boolean;
    error: string | null;
}

// PMJ 23/8/2024: This hook fetches all messages for a specified chat using the chat ID and user ID.
export const useFetchMessages = (chat_id: string | null, user_id: string): UseFetchMessagesHook => {
    const [messages, setMessages] = useState<MessageHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!chat_id) return; // If there's no chat ID, do not attempt to fetch messages

        // PMJ 23/8/2024: This function makes the API call to fetch messages for a specific chat.
        const fetchMessages = async () => {
            try {
                // Fetches messages for the specified chat from the backend
                const response = await fetch(`http://localhost:8000/api/chats/${chat_id}/messages?user_id=${user_id}`);
                
                // If the response is not OK, throw an error
                if (!response.ok) throw new Error("Failed to fetch messages");

                // Parse the response as JSON
                const data: MessageHistory[] = await response.json();

                // Update the messages state with the fetched data
                setMessages(data);
            } catch (err) {
                // If there's an error, store the error message in state
                setError((err as Error).message);
            } finally {
                // Set loading to false once the operation is complete
                setLoading(false);
            }
        };

        // Call the fetchMessages function
        fetchMessages();
    }, [chat_id, user_id]);

    // Return the messages, loading status, and any errors encountered
    return { messages, loading, error };
};
