// useSearchChats.tsx
// Updated to use axios via apiClient

import { useState, useEffect } from "react";
// Importing apiClient from utilities folder
import apiClient from "../utilities/apiClient";

interface ChatHistory {
    chatId: string;
    date: string;
    title: string;
    pinned: boolean;
    archived?: boolean;
}

// Define the return types of the hook
interface UseSearchChatsHook {
    searchResults: ChatHistory[];
    loading: boolean;
    error: string | null;
}

// The hook takes in the userId and searchTerm and makes an API request
export const useSearchChats = (userId: string, searchTerm: string): UseSearchChatsHook => {
    const [searchResults, setSearchResults] = useState<ChatHistory[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSearchResults = async () => {
            if (searchTerm === "") {
                setSearchResults([]);
                return;
            }

            setLoading(true);
            try {
                // Using apiClient to send a GET request
                const response = await apiClient.get<ChatHistory[]>(`/chats/search`, {
                    params: {
                        term: searchTerm,
                        userId,
                    },
                });

                if (response.status !== 200) throw new Error("Failed to search chats");

                const data = response.data;
                setSearchResults(data);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchSearchResults();
    }, [searchTerm, userId]);

    return { searchResults, loading, error };
};
