// hooks/useUpdateMessage.tsx
import { useState } from "react";

interface UseUpdateMessageHook {
    updateMessage: (chatId: string, messageId: string, newContent: string) => Promise<void>;
    loading: boolean;
    error: string | null;
}

export const useUpdateMessage = (user_id: string): UseUpdateMessageHook => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateMessage = async (chatId: string, messageId: string, newContent: string) => {
        setLoading(true);
        setError(null); // Clear any previous error
        try {
            const response = await fetch(
                `http://localhost:8000/api/chats/${chatId}/messages/${messageId}?newContent=${encodeURIComponent(newContent)}&userId=${user_id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            const result = await response.json(); // Log response body

            if (!response.ok) {
                console.error("Error Response:", result); // Log error details
                throw new Error("Failed to update the message and regenerate response");
            }

            console.log("Message updated and new response generated", result);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return { updateMessage, loading, error };
};
