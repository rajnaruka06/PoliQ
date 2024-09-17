// useArchiveChat.tsx
// Updated to use axios via apiClient

import { useState } from "react";
// Importing apiClient from utilities folder
import apiClient from "../utilities/apiClient";

// Define the return types of the hook
interface UseArchiveChatHook {
    archiveChat: (chatID: string) => Promise<void>;
    loading: boolean;
    error: string | null;
}

export const useArchiveChat = (userId: string): UseArchiveChatHook => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const archiveChat = async (chatID: string) => {
        setLoading(true);
        try {
            // Using apiClient to send a PUT request
            const response = await apiClient.put(
                `/chats/${chatID}/archive`,
                {}, // No data in the body
                {
                    params: { userId }, // Send userId as a query parameter
                }
            );

            // Check if response status is not OK
            if (response.status !== 200)
                throw new Error("Failed to archive chat");

            console.log(`Chat ${chatID} archived successfully`);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return { archiveChat, loading, error };
};
