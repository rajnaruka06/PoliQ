import { useState } from "react";

interface UseUnpinChatHook {
    unpinChat: (chat_id: string) => Promise<void>;
    loading: boolean;
    error: string | null;
}

export const useUnpinChat = (user_id: string): UseUnpinChatHook => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const unpinChat = async (chat_id: string) => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/api/chats/${chat_id}/unpin?user_id=${user_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) throw new Error("Failed to unpin chat");

            // Optional: You can add logic here if you need to handle any data returned by the API
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return { unpinChat, loading, error };
};
