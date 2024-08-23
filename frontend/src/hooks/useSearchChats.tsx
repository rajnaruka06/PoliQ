// import { useState } from "react";

// // PMJ 23/8/2024: This hook searches chats for the specified term using the user ID.
// export const useSearchChats = (user_id: string) => {
//     const [results, setResults] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState<string | null>(null);

//     const searchChats = async (term: string) => {
//         setLoading(true); // PMJ 23/8/2024: Loading is set to true when the API call starts.
//         try {
//             const res = await fetch(`/api/chats/search?term=${term}&user_id=${user_id}`);
//             if (!res.ok) throw new Error("Failed to search chats");
//             const data = await res.json();
//             setResults(data); // PMJ 23/8/2024: The search results are stored in state.
//         } catch (err) {
//             setError(err.message); // PMJ 23/8/2024: If there's an error, it gets stored in state.
//         } finally {
//             setLoading(false); // PMJ 23/8/2024: Once the API call is done, loading is set to false.
//         }
//     };

//     // PMJ 23/8/2024: The hook returns the searchChats function, results, loading status, and any errors encountered.
//     return { searchChats, results, loading, error };
// };
