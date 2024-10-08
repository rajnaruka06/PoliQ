// useArchiveAllChats.tsx

import apiClient from "../utilities/apiClient";

interface UseArchiveAllChatsHook {
  archiveAllChats: (chatIDs: string[]) => Promise<void>;
}

export const useArchiveAllChats = (userId: string): UseArchiveAllChatsHook => {
  const archiveAllChats = async (chatIDs: string[]) => {
    try {
      await Promise.all(
        chatIDs.map(async (chatID) => {
          const response = await apiClient.put(`/chats/${chatID}/archive`, {}, {
            params: { userId },
          });
          if (response.status !== 200) {
            throw new Error(`Failed to archive chat ${chatID}`);
          }
          console.log(`Chat ${chatID} archived successfully`);
        })
      );
    } catch (err) {
      throw err; // Re-throw the error to be handled where the function is called
    }
  };

  return { archiveAllChats };
};
