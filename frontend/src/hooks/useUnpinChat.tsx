// updated for new main.py
import { useState } from "react";

interface UseUnpinChatHook {
    unpinChat: (chatID: string) => Promise<void>;
    loading: boolean;
    error: string | null;
}

export const useUnpinChat = (userId: string): UseUnpinChatHook => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const unpinChat = async (chatID: string) => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8000/api/chats/${chatID}/unpin?userId=${userId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) throw new Error("Failed to unpin chat");

            console.log(`Chat ${chatID} unpinned successfully`);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return { unpinChat, loading, error };
};
