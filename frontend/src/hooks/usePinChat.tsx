import { useState } from "react";

interface UsePinChatHook {
    pinChat: (chat_id: string) => Promise<void>;
    loading: boolean;
    error: string | null;
}

export const usePinChat = (user_id: string): UsePinChatHook => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const pinChat = async (chat_id: string) => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/api/chats/${chat_id}/pin?user_id=${user_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) throw new Error("Failed to pin chat");

            // Optional: You can add logic here if you need to handle any data returned by the API
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return { pinChat, loading, error };
};
