// updated for new main.py
import { useState } from "react";
// using axios now
// Import apiClient from utilities
import apiClient from "../utilities/apiClient";

interface UsePinChatHook {
    pinChat: (chatID: string) => Promise<void>;
    loading: boolean;
    error: string | null;
}

export const usePinChat = (userId: string): UsePinChatHook => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const pinChat = async (chatID: string) => {
        setLoading(true);
        try {
            // Use apiClient instead of fetch
            /*
            const response = await fetch(`http://localhost:8000/api/chats/${chatID}/pin?userId=${userId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) throw new Error("Failed to pin chat");
            */

            // Replace fetch with apiClient PUT request
            await apiClient.put(
                `/chats/${chatID}/pin`,
                {}, // No data in the body
                {
                    params: { userId },
                }
            );

            console.log(`Chat ${chatID} pinned successfully`);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return { pinChat, loading, error };
};
