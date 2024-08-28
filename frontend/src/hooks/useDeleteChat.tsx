import { useState } from "react";

// Define the return types of the hook
interface UseDeleteChatHook {
    deleteChat: (chatID: string) => Promise<void>;
    loading: boolean;
    error: string | null;
}

export const useDeleteChat = (user_id: string): UseDeleteChatHook => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const deleteChat = async (chatID: string) => {
        setLoading(true);
        setError(null); // Clear any previous error
        try {
            const response = await fetch(`http://localhost:8000/api/chats/${chatID}/delete?user_id=${user_id}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete chat");

            // You can add any additional logic here if needed, e.g., notifying the user

        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return { deleteChat, loading, error };
};
