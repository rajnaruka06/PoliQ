import { useState, useEffect } from "react";

interface ChatHistory {
    chat_id: string;
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

// The hook takes in the user_id and searchTerm and makes an API request
export const useSearchChats = (user_id: string, searchTerm: string): UseSearchChatsHook => {
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
                const response = await fetch(
                    `http://localhost:8000/api/chats/search?term=${encodeURIComponent(
                        searchTerm
                    )}&user_id=${user_id}`
                );
                if (!response.ok) throw new Error("Failed to search chats");

                const data: ChatHistory[] = await response.json();
                setSearchResults(data);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchSearchResults();
    }, [searchTerm, user_id]);

    return { searchResults, loading, error };
};
