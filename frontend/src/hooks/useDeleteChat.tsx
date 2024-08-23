// import { useState } from "react";

// // PMJ 23/8/2024: This hook deletes a specified chat by making an API request with the chat ID and user ID.
// export const useDeleteChat = (user_id: string) => {
//     const [status, setStatus] = useState<string | null>(null);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState<string | null>(null);

//     const deleteChat = async (chat_id: string) => {
//         setLoading(true); // PMJ 23/8/2024: Loading is set to true when the API call starts.
//         try {
//             const res = await fetch(`/api/chats/${chat_id}/delete?user_id=${user_id}`, {
//                 method: "DELETE",
//             });

//             if (!res.ok) throw new Error("Failed to delete chat");
//             const data = await res.json();
//             setStatus(data.status); // PMJ 23/8/2024: The status of the delete action is stored in state.
//         } catch (err) {
//             setError(err.message); // PMJ 23/8/2024: If there's an error, it gets stored in state.
//         } finally {
//             setLoading(false); // PMJ 23/8/2024: Once the API call is done, loading is set to false.
//         }
//     };

//     // PMJ 23/8/2024: The hook returns the deleteChat function, status, loading status, and any errors encountered.
//     return { deleteChat, status, loading, error };
// };
