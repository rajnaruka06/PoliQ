//new hook to unarchive a chat
import { useState } from "react";

// Define the return types of the hook
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
            const response = await fetch(`http://localhost:8000/api/chats/${chatID}/unarchive?userId=${userId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) throw new Error("Failed to unarchive chat");

            console.log(`Chat ${chatID} unarchived successfully`);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return { unarchiveChat, loading, error };
};
