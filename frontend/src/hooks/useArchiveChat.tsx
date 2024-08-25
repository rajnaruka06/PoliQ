import { useState } from "react";

// Define the return types of the hook
interface UseArchiveChatHook {
    archiveChat: (chatID: string) => Promise<void>;
    loading: boolean;
    error: string | null;
}

export const useArchiveChat = (user_id: string): UseArchiveChatHook => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const archiveChat = async (chatID: string) => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8000/api/chats/${chatID}/archive?user_id=${user_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) throw new Error("Failed to archive chat");

            console.log(`Chat ${chatID} archived successfully`);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return { archiveChat, loading, error };
};
