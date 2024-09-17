// updated for new main.py
import { useState } from "react";
// Import apiClient from utilities
import apiClient from "../utilities/apiClient";

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
            // Use apiClient instead of fetch
            /*
            const response = await fetch(`http://localhost:8000/api/chats/${chatID}/unpin?userId=${userId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) throw new Error("Failed to unpin chat");
            */

            // Replace fetch with apiClient PUT request
            await apiClient.put(
                `/chats/${chatID}/unpin`,
                {}, // No data in the body
                {
                    params: { userId }, // Send userId as a query parameter
                }
            );

            console.log(`Chat ${chatID} unpinned successfully`);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return { unpinChat, loading, error };
};
