// updated for main.py
import { useState, useEffect } from "react";

// Define the structure of a chat session and the chat history response
interface ChatSession {
    date: string;
    chat: { title: string; chatId: string }[];  // Updated chatID to chatId
}

// Define the return types of the hook
interface UseFetchChatHistoryHook {
    chatHistory: ChatSession[];
    loading: boolean;
    error: string | null;
}

export const useFetchChatHistory = (userId: string): UseFetchChatHistoryHook => {  // Changed user_id to userId
    const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchChatHistory = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/chats/all?userId=${userId}`);  // Updated endpoint with userId
                
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
    }, [userId]);  // Updated dependency to userId

    return { chatHistory, loading, error };
};