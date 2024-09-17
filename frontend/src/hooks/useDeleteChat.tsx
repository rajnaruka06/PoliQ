// useDeleteChat.tsx
// Updated to use axios via apiClient

import { useState } from "react";
// Importing apiClient from utilities folder
import apiClient from "../utilities/apiClient";

// Define the return types of the hook
interface UseDeleteChatHook {
    deleteChat: (chatID: string) => Promise<void>;
    loading: boolean;
    error: string | null;
}

export const useDeleteChat = (userId: string): UseDeleteChatHook => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const deleteChat = async (chatID: string) => {
        setLoading(true);
        setError(null); // Clear any previous error
        try {
            // Using apiClient to send a DELETE request
            const response = await apiClient.delete(`/chats/${chatID}/delete`, {
                params: { userId },
            });

            if (response.status !== 200) throw new Error("Failed to delete chat");

            // You can add any additional logic here if needed, e.g., notifying the user
            console.log(`Chat ${chatID} deleted successfully`);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return { deleteChat, loading, error };
};
