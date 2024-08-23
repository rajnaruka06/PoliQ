import React, { useState, useEffect } from "react";
import {
    BiChevronLeftCircle,
    BiChevronRightCircle,
    BiPin,
    BiSolidPin,
    BiTrash,
    BiArchive,
} from "react-icons/bi";
// PMJ 23/8/2024: import useFetchChatHistory hook
import { useFetchChatHistory } from "../hooks/useFetchChatHistory";
import { AiFillSetting, AiOutlineMore } from "react-icons/ai";
//PMJ 23/8/2024: import pin and unpin chat hooks
import { usePinChat } from "../hooks/usePinChat";
import { useUnpinChat } from "../hooks/useUnpinChat";
// PMJ 23/8/2024: changed the interface format to accept the json format that returns to the UI
interface ChatHistory {
    chat_id: string;
    date: string;
    title: string;
    pinned: boolean;
}

interface SidebarProps {
    selectedChatID: string | null;
    setSelectedChatID: (chatID: string | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    selectedChatID,
    setSelectedChatID,
}) => {
    const user_id = "example_user_id"; // Placeholder for user ID, replace with dynamic user ID

    // Fetch chat history using the useFetchChatHistory hook
    const { chatHistory, loading, error } = useFetchChatHistory(user_id);
    // Use the pin and unpin chat hooks
    const { pinChat, loading: pinLoading, error: pinError } = usePinChat(user_id);
    const { unpinChat, loading: unpinLoading, error: unpinError } = useUnpinChat(user_id);

    // State to manage filtered chat history
    const [filteredChatHistory, setFilteredChatHistory] = useState<ChatHistory[]>([]);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [pinnedChats, setPinnedChats] = useState<string[]>([]); // Tracks pinned chat IDs
    const [isSettingsOverlayVisible, setIsSettingsOverlayVisible] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState<string | null>(null); // State to manage the visibility of the options menu for each chat

    // Effect to update filtered chat history when chat history is fetched or search term changes
    useEffect(() => {
        if (searchTerm === "") {
            setFilteredChatHistory(chatHistory); // Show the full chat history if there's no search term
        } else {
            const filtered = chatHistory
                .filter((chat) => chat.title.toLowerCase().includes(searchTerm.toLowerCase()));
            setFilteredChatHistory(filtered); // Update the filtered chat history based on the search term
        }
    }, [chatHistory, searchTerm]); // The effect runs when either chat history or search term changes
 
    // Function to toggle sidebar
    const toggleSidebar = () => {
        setIsSidebarVisible(!isSidebarVisible);
    };

    // Function to handle search -> changed
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
    };
    // const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const value = e.target.value;
    //     setSearchTerm(value);

    //     if (value === "") {
    //         setFilteredChatHistory(chatHistory);
    //     } else {
    //         const filtered = chatHistory
    //             .map((session) => ({
    //                 ...session,
    //                 chat: session.chat.filter((chat) =>
    //                     chat.title.toLowerCase().includes(value.toLowerCase())
    //                 ),
    //             }))
    //             .filter((session) => session.chat.length > 0);
    //         setFilteredChatHistory(filtered);
    //     }
    // };

    // Function to format date
    const formatDate = (dateString: string): string => {
        const [day, month, year] = dateString.split("/");
        const date = new Date(`${year}-${month}-${day}`);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    // WAITING FOR API
    // PMJ 23/8/2024: updated function to pin or unpin based on chat's current state
    const handlePinChat = async (chatID: string) => {
        try {
            if (pinnedChats.includes(chatID)) {
                // Unpin the chat
                await unpinChat(chatID); // Call the API
                setPinnedChats((prev) => prev.filter((id) => id !== chatID)); // Remove from pinned chats
    
                // Update the chat history to reflect the unpinned status
                setFilteredChatHistory((prevHistory) =>
                    prevHistory.map((chat) =>
                        chat.chat_id === chatID ? { ...chat, pinned: false } : chat
                    )
                );
            } else {
                // Pin the chat
                await pinChat(chatID); // Call the API
                setPinnedChats((prev) => [...prev, chatID]); // Add to pinned chats
    
                // Update the chat history to reflect the pinned status
                setFilteredChatHistory((prevHistory) =>
                    prevHistory.map((chat) =>
                        chat.chat_id === chatID ? { ...chat, pinned: true } : chat
                    )
                );
            }
        } catch (error) {
            console.error("Error pinning/unpinning chat:", error);
        }
    };
    
    
    

    // WAITING FOR API -> API is here now, modified
    // Function to handle deleting a chat
    const handleDeleteChat = (chatID: string) => {
        if (window.confirm("Are you sure you want to delete this chat?")) {
            const updatedChatHistory = chatHistory.filter((chat) => chat.chat_id !== chatID);
            const updatedFilteredChatHistory = filteredChatHistory.filter((chat) => chat.chat_id !== chatID);

            setFilteredChatHistory(updatedFilteredChatHistory);
            setPinnedChats(pinnedChats.filter((id) => id !== chatID)); // Remove from pinnedChats if present

            if (selectedChatID === chatID) {
                setSelectedChatID(null);
            }
        }
    };
    // const handleDeleteChat = (chatID: string) => {
    //     // Confirm before deleting
    //     if (window.confirm("Are you sure you want to delete this chat?")) {
    //         // Filter out the chat from chatHistory and filteredChatHistory
    //         const updatedChatHistory = chatHistory.filter((session) =>
    //             session.chat.every((chat) => chat.chatID !== chatID)
    //         );
    //         const updatedFilteredChatHistory = filteredChatHistory.filter(
    //             (session) =>
    //                 session.chat.every((chat) => chat.chatID !== chatID)
    //         );

    //         // Update state
    //         setChatHistory(updatedChatHistory);
    //         setFilteredChatHistory(updatedFilteredChatHistory);

    //         // Remove from pinnedChats if present
    //         setPinnedChats(pinnedChats.filter((id) => id !== chatID));

    //         // Clear selectedChatID if it's the one being deleted
    //         if (selectedChatID === chatID) {
    //             setSelectedChatID(null);
    //         }
    //     }
    // };

    // WAITING FOR API
    // Function to handle archiving a chat
    const handleArchiveChat = (chatID: string) => {
        // Archive logic here (e.g., move to archived chats list)
        console.log(`Archived chat with ID: ${chatID}`);
    };

    // Function to handle the three dots menu
    const threeDotsMenu = (chat: { chatID: string; title: string }) => {
        return (
            <div className="flex absolute right-4 z-50 flex-col gap-3 items-end p-3 mt-10 text-white rounded-xl shadow-lg bg-primary">
                <button
                    className="flex gap-2 items-center shadow-sm bg-primary shadow-black/90"
                    onClick={() => handlePinChat(chat.chatID)}
                >
                    {pinnedChats.includes(chat.chatID) ? (
                        <>
                            <BiSolidPin />
                            <span>Unpin</span>
                        </>
                    ) : (
                        <>
                            <BiPin />
                            <span>Pin</span>
                        </>
                    )}
                </button>
                <button
                    className="flex gap-2 items-center shadow-sm bg-primary shadow-black/90"
                    onClick={() => handleDeleteChat(chat.chatID)}
                >
                    <BiTrash />
                    <span>Delete</span>
                </button>
                <button
                    className="flex gap-2 items-center shadow-sm bg-primary shadow-black/90"
                    onClick={() => handleArchiveChat(chat.chatID)}
                >
                    <BiArchive />
                    <span>Archive</span>
                </button>
            </div>
        );
    };

    // Function to toggle Settings overlay
    const toggleSettingsOverlay = () => {
        setIsSettingsOverlayVisible(!isSettingsOverlayVisible);
    };

    // Overlay for Settings
    const overlaySettings = isSettingsOverlayVisible && (
        // Overlay content on bottom left corner
        <div
            className="fixed bottom-0 left-0 w-full h-full bg-black/70"
            onClick={toggleSettingsOverlay}
        >
            <div
                className="flex flex-col pr-2 pb-8 pl-8 w-1/6 h-screen rounded-t-lg shadow-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-auto"></div>

                <ul className="flex flex-col gap-5 content-end p-5 text-lg rounded-lg bg-sidebar">
                    <button className="text-2xl font-semibold">Menu 1</button>
                    <button className="text-2xl font-semibold">Menu 2</button>
                    <button className="text-2xl font-semibold">Menu 3</button>
                </ul>
                <div className="flex justify-end">
                    <button
                        className="text-3xl"
                        onClick={toggleSettingsOverlay}
                    >
                        <AiFillSetting />
                    </button>
                </div>
            </div>
        </div>
    );
    // PMJ 23/8/2024: API is here
    // Populate chat history - changed in a big way to include pin and unpin and group by date
    const loadChatHistory = () => {
        // Separate pinned and regular chats based on the actual chat data
        const pinnedChatHistory = filteredChatHistory.filter((chat) => chat.pinned);
        const regularChatHistory = filteredChatHistory.filter((chat) => !chat.pinned);
    
        return (
            <div className="flex overflow-auto flex-col flex-grow gap-3 text-white">
                {/* Pinned Chats */}
                {pinnedChatHistory.length > 0 && (
                    <div className="mb-4">
                        <div className="text-2xl font-semibold">Pinned</div>
                        {pinnedChatHistory.map((chat, idx) => (
                            <div
                                key={idx}
                                className={`flex flex-col py-1 pl-5 ml-3 text-xl truncate hover:bg-zinc-500 hover:cursor-pointer ${
                                    selectedChatID === chat.chat_id
                                        ? "bg-blue-600 text-white"
                                        : "bg-transparent"
                                }`}
                                onClick={() => setSelectedChatID(chat.chat_id)}
                            >
                                <div className="flex justify-between group">
                                    <span className="truncate">{chat.title}</span>
                                    <AiOutlineMore
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowOptionsMenu(
                                                showOptionsMenu === chat.chat_id
                                                    ? null
                                                    : chat.chat_id
                                            );
                                        }}
                                        className="pr-2 text-3xl"
                                    />
                                </div>
                                {showOptionsMenu === chat.chat_id &&
                                    threeDotsMenu(chat)}
                            </div>
                        ))}
                    </div>
                )}
    
                {/* Regular Chats */}
                {regularChatHistory.map((chat, idx) => (
                    <div
                        key={idx}
                        className={`flex flex-col py-1 pl-5 ml-3 text-xl truncate hover:bg-zinc-500 hover:cursor-pointer ${
                            selectedChatID === chat.chat_id
                                ? "bg-blue-600 text-white"
                                : "bg-transparent"
                        }`}
                        onClick={() => setSelectedChatID(chat.chat_id)}
                    >
                        <div className="flex justify-between group">
                            <span className="truncate">{chat.title}</span>
                            <AiOutlineMore
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowOptionsMenu(
                                        showOptionsMenu === chat.chat_id
                                            ? null
                                            : chat.chat_id
                                    );
                                }}
                                className="pr-2 text-3xl"
                            />
                        </div>
                        {showOptionsMenu === chat.chat_id && threeDotsMenu(chat)}
                    </div>
                ))}
            </div>
        );
    };
    
    
    
    

    return (
        <div
            className={`flex flex-col relative rounded-lg shadow-lg transition-all duration-300 ease-in-out bg-sidebar ${
                isSidebarVisible ? "p-4 w-1/6" : "w-0"
            }`}
        >
            {isSidebarVisible && (
                <>
                    <div className="mb-10 text-5xl font-bold text-white">
                        <a href="/" className="text-white hover:text-white">
                            PoliQ Chat
                        </a>
                    </div>
                    <input
                        className="px-4 py-2 mb-10 text-2xl rounded-full bg-zinc-700"
                        placeholder="search chat..."
                        value={searchTerm}
                        onChange={handleSearch}
                    ></input>

                    {loading && <p>Loading...</p>}
                    {error && <p>Error: {error}</p>}
                    {!loading && !error && loadChatHistory()}
                    {overlaySettings}
                    <div className="flex justify-between items-center text-3xl bg-sidebar">
                        <div className="flex-grow text-left">John Doe</div>
                        <button className="text-3xl" onClick={toggleSettingsOverlay}>
                            <AiFillSetting />
                        </button>
                    </div>
                </>
            )}
            <div
                className={`absolute top-1/2 ${
                    isSidebarVisible ? "-right-20" : "-right-15"
                }`}
            >
                <button
                    className="text-3xl text-white rounded-full bg-sidebar"
                    onClick={toggleSidebar}
                >
                    {isSidebarVisible ? (
                        <BiChevronLeftCircle />
                    ) : (
                        <BiChevronRightCircle />
                    )}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
//     const loadChatHistory = () => {
//         return (
//             <div className="flex overflow-auto flex-col flex-grow gap-3 text-white">
//                 {filteredChatHistory.map((session, index) => (
//                     <div
//                         key={index}
//                         className="flex relative flex-col gap-1 mb-4"
//                     >
//                         <div className="text-2xl font-semibold">
//                             {formatDate(session.date)}
//                         </div>
//                         {session.chat
//                             .filter(
//                                 (chat) => !pinnedChats.includes(chat.chatID)
//                             ) // Exclude pinned chats
//                             .map((chat, idx) => (
//                                 <div
//                                     key={idx}
//                                     className={`flex flex-col py-1 pl-5 ml-3 text-xl truncate hover:bg-zinc-500 hover:cursor-pointer ${
//                                         selectedChatID === chat.chatID
//                                             ? "bg-blue-600 text-white"
//                                             : "bg-transparent"
//                                     }`}
//                                     onClick={() =>
//                                         setSelectedChatID(chat.chatID)
//                                     }
//                                 >
//                                     {/* Chat HIstory Area */}
//                                     <div className="flex justify-between group">
//                                         <span className="truncate">
//                                             {chat.title}
//                                         </span>
//                                         <AiOutlineMore
//                                             onClick={(e) => {
//                                                 e.stopPropagation(); // Prevents triggering the chat selection
//                                                 setShowOptionsMenu(
//                                                     showOptionsMenu ===
//                                                         chat.chatID
//                                                         ? null
//                                                         : chat.chatID
//                                                 );
//                                             }}
//                                             className="pr-2 text-3xl"
//                                         />
//                                     </div>
//                                     {/* Three dots menu */}
//                                     {showOptionsMenu === chat.chatID &&
//                                         threeDotsMenu(chat)}
//                                 </div>
//                             ))}
//                     </div>
//                 ))}
//             </div>
//         );
//     };

//     return (
//         <div
//             className={`flex flex-col relative rounded-lg shadow-lg transition-all duration-300 ease-in-out bg-sidebar ${isSidebarVisible ? "p-4 w-1/6" : "w-0"}`}
//         >
//             {isSidebarVisible && (
//                 <>
//                     <div className="mb-10 text-5xl font-bold text-white">
//                         <a href="/" className="text-white hover:text-white">
//                             PoliQ Chat
//                         </a>
//                     </div>
//                     {/* Search bar */}
//                     <input
//                         className="px-4 py-2 mb-10 text-2xl rounded-full bg-zinc-700"
//                         placeholder="search chat..."
//                         value={searchTerm}
//                         onChange={handleSearch}
//                     ></input>

//                     {/* CHANGE: Chat history amended with exclusion of pinned chats */}
//                     {loadChatHistory()}
//                     {overlaySettings}
//                     <div className="flex justify-between items-center text-3xl bg-sidebar">
//                         {/* User name */}
//                         <div className="flex-grow text-left">John Doe</div>
//                         {/* Settings button */}
//                         <button
//                             className="text-3xl"
//                             onClick={toggleSettingsOverlay}
//                         >
//                             <AiFillSetting />
//                         </button>
//                     </div>
//                 </>
//             )}
//             <div
//                 className={`absolute top-1/2 ${isSidebarVisible ? "-right-20" : "-right-15"}`}
//             >
//                 <button
//                     className="text-3xl text-white rounded-full bg-sidebar"
//                     onClick={toggleSidebar}
//                 >
//                     {isSidebarVisible ? (
//                         <BiChevronLeftCircle />
//                     ) : (
//                         <BiChevronRightCircle />
//                     )}
//                 </button>
//             </div>
//         </div>
//     );
// };

// export default Sidebar;
