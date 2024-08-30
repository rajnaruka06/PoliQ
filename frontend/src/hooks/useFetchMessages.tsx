// Updated for main.py
import { useState, useEffect } from "react";

// Define the message structure based on your backend response
interface MessageHistory {
    messageId: string;  // Changed from messageID to messageId for consistency
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

// This hook fetches all messages for a specified chat using the chatId and userId.
export const useFetchMessages = (chatId: string | null, userId: string): UseFetchMessagesHook => {
    const [messages, setMessages] = useState<MessageHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!chatId) return; // If there's no chatId, do not attempt to fetch messages

        //  This function makes the API call to fetch messages for a specific chat.
        const fetchMessages = async () => {
            try {
                // Fetches messages for the specified chat from the backend
                const response = await fetch(`http://localhost:8000/api/chats/${chatId}/messages?userId=${userId}`);
                
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
    }, [chatId, userId]);

    // Return the messages, loading status, and any errors encountered
    return { messages, loading, error };
};
