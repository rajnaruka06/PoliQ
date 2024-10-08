// useDeleteAllChats.tsx

import apiClient from "../utilities/apiClient";

interface UseDeleteAllChatsHook {
  deleteAllChats: (chatIDs: string[]) => Promise<void>;
}

export const useDeleteAllChats = (userId: string): UseDeleteAllChatsHook => {
  const deleteAllChats = async (chatIDs: string[]) => {
    try {
      await Promise.all(
        chatIDs.map(async (chatID) => {
          const response = await apiClient.delete(`/chats/${chatID}/delete`, {
            params: { userId },
          });
          if (response.status !== 200) {
            throw new Error(`Failed to delete chat ${chatID}`);
          }
          console.log(`Chat ${chatID} deleted successfully`);
        })
      );
    } catch (err) {
      throw err; // Re-throw the error to be handled where the function is called
    }
  };

  return { deleteAllChats };
};
