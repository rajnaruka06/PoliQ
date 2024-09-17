// hooks/useUpdateMessage.tsx
import { useState } from "react";
// using Axios now
// Import apiClient from utilities
import apiClient from "../utilities/apiClient";

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
            // Use apiClient instead of fetch
            /*
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
            */

            // Replace fetch with apiClient PUT request
            const response = await apiClient.put(
                `/chats/${chatId}/messages/${messageId}`,
                {}, // No data in the body
                {
                    params: {
                        userId: user_id,
                        newContent: newContent,
                    },
                }
            );

            // Check if response status is not OK
            if (response.status !== 200) {
                console.error("Error Response:", response.data);
                throw new Error("Failed to update the message and regenerate response");
            }

            console.log("Message updated and new response generated", response.data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return { updateMessage, loading, error };
};
