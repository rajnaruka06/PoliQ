import { useState } from "react";

// Define the return types of the hook
interface UseUpdateTitleChatHook {
  updateTitleChat: (chatID: string, newTitle: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const useUpdateTitleChat = (user_id: string): UseUpdateTitleChatHook => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTitleChat = async (chatID: string, newTitle: string) => {
    setLoading(true);
    setError(null); // Clear any previous error
    try {
      const response = await fetch(
        `http://localhost:8000/api/chats/${chatID}/title?userId=${user_id}&newTitle=${encodeURIComponent(newTitle)}`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) throw new Error("Failed to update chat title");

      // Log success message or handle success notification
      console.log(`Chat ${chatID} title updated to ${newTitle} successfully`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return { updateTitleChat, loading, error };
};
