import { useState, useEffect } from "react";

// PMJ 23/8/2024: Define the structure of a chat session and the chat history response
interface ChatSession {
    date: string;
    chat: { title: string; chatID: string }[];
}

// Define the return types of the hook
interface UseFetchChatHistoryHook {
    chatHistory: ChatSession[];
    loading: boolean;
    error: string | null;
}

export const useFetchChatHistory = (user_id: string): UseFetchChatHistoryHook => {
    const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchChatHistory = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/chats/all?user_id=${user_id}`);
                
                if (!response.ok) throw new Error("Failed to fetch chat history");

                const data: ChatSession[] = await response.json();

                if (!Array.isArray(data)) throw new Error("Invalid data format received");
                setChatHistory(data);
            } catch (err) {
                console.error("Error fetching chat history:", err);
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchChatHistory();
    }, [user_id]);

    return { chatHistory, loading, error };
};
