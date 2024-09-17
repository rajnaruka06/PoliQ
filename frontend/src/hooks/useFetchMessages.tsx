// useFetchMessages.tsx
import { useState, useEffect } from "react";
import axios from "axios";

interface MessageHistory {
    messageID: string;
    user: string;
    content: string;
    date: string;
    time: string;
}

interface UseFetchMessagesHook {
    messages: MessageHistory[] | null;
    loading: boolean;
    error: string | null;
    fetchMessages: () => Promise<void>; // Function to manually re-fetch messages
}

export const useFetchMessages = (
    chatId: string | null,
    userId: string
): UseFetchMessagesHook => {
    const [messages, setMessages] = useState<MessageHistory[] | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMessages = async () => {
        if (!chatId) return;
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get<MessageHistory[]>(
                `http://localhost:8000/api/chats/${chatId}/messages`,
                {
                    params: { userId },
                }
            );

            setMessages(response.data);
        } catch (err) {
            console.error("Error fetching messages:", err);
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, [chatId, userId]);

    return { messages, loading, error, fetchMessages };
};
