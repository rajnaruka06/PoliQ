// useFetchChatHistory.tsx
import { useState, useEffect } from "react";
import apiClient from "../utilities/apiClient";

interface ChatSession {
    date: string;
    chat: { title: string; chatId: string }[];
}

interface UseFetchChatHistoryHook {
    chatHistory: ChatSession[];
    loading: boolean;
    error: string | null;
    fetchChatHistory: () => void; // Function to manually re-fetch chat history
}

export const useFetchChatHistory = (userId: string): UseFetchChatHistoryHook => {
    const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchChatHistory = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get<ChatSession[]>('/chats/all', {
                params: { userId },
            });

            const data = response.data;

            if (!Array.isArray(data)) throw new Error("Invalid data format received");
            setChatHistory(data);
        } catch (err) {
            console.error("Error fetching chat history:", err);
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChatHistory();
    }, [userId]);

    return { chatHistory, loading, error, fetchChatHistory };
};
