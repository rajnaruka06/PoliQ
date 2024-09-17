import { useState } from "react";
// using Axios now
// Import apiClient from utilities
import apiClient from "../utilities/apiClient";

interface UseUnarchiveChatHook {
    unarchiveChat: (chatID: string) => Promise<void>;
    loading: boolean;
    error: string | null;
}

export const useUnarchiveChat = (userId: string): UseUnarchiveChatHook => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const unarchiveChat = async (chatID: string) => {
        setLoading(true);
        try {
            // Use apiClient instead of fetch
            /*
            const response = await fetch(`http://localhost:8000/api/chats/${chatID}/unarchive?userId=${userId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) throw new Error("Failed to unarchive chat");
            */

            // Replace fetch with apiClient PUT request
            await apiClient.put(
                `/chats/${chatID}/unarchive`,
                {}, // No data in the body
                {
                    params: { userId },
                }
            );

            console.log(`Chat ${chatID} unarchived successfully`);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return { unarchiveChat, loading, error };
};
