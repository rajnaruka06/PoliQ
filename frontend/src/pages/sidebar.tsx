import React, { useState, useEffect } from "react";
import {
    BiChevronLeftCircle,
    BiChevronRightCircle,
    BiPin,
    BiSolidPin,
    BiTrash,
    BiArchive,
} from "react-icons/bi";
import { AiFillSetting, AiOutlineMore, AiOutlineSearch } from "react-icons/ai";
//PMJ 23/8/2024: import hooks
import { useFetchChatHistory } from "../hooks/useFetchChatHistory";
import { usePinChat } from "../hooks/usePinChat";
import { useUnpinChat } from "../hooks/useUnpinChat";
import { useDeleteChat } from "../hooks/useDeleteChat"; 
import { useArchiveChat } from "../hooks/useArchiveChat";
import { useSearchChats } from "../hooks/useSearchChats";

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

    //PMJ Fetch chat history using the useFetchChatHistory hook
    const { chatHistory, loading, error } = useFetchChatHistory(user_id);
    //PMJ 24/8/2024: Delete chat using useDeleteChat hook
    const { deleteChat, loading: deleteLoading, error: deleteError } = useDeleteChat(user_id);
    //PMJ 24/8/2024: Use the useArchiveChat hook
    const { archiveChat, loading: archiveLoading, error: archiveError } = useArchiveChat(user_id);
    // Use the pin and unpin chat hooks
    const { pinChat, loading: pinLoading, error: pinError } = usePinChat(user_id);
    const { unpinChat, loading: unpinLoading, error: unpinError } = useUnpinChat(user_id);

    // State to manage filtered chat history
    const [filteredChatHistory, setFilteredChatHistory] = useState<ChatHistory[]>([]);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    // PMJ 25/8/2024: define search results using useSearchChats
    const { searchResults, loading: searchLoading, error: searchError } = useSearchChats(user_id, searchTerm); 
    const [pinnedChats, setPinnedChats] = useState<string[]>([]); // Tracks pinned chat IDs
    const [isSettingsOverlayVisible, setIsSettingsOverlayVisible] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState<string | null>(null); // State to manage the visibility of the options menu for each chat

    //PMJ 25/8/2024: Effect to determine whether to use serach results or the full chat history
    // Function to handle search -> changed again to use hook
    useEffect(() => {
        if (searchTerm === "") {
            setFilteredChatHistory(chatHistory); // Show full chat history if no search term
        } else {
            setFilteredChatHistory(searchResults); // Show search results if there is a search term
        }
    }, [chatHistory, searchResults, searchTerm]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };
 
    // Function to toggle sidebar
    const toggleSidebar = () => {
        setIsSidebarVisible(!isSidebarVisible);
    };

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
    // PMJ 25/8/2024: updated function to pin or unpin based on chat's current state
    const handlePinChat = async (chatID: string, isPinned: boolean) => {
        try {
            if (isPinned) {
                // Unpin the chat
                await unpinChat(chatID); // Call the API to unpin
            } else {
                // Pin the chat
                await pinChat(chatID); // Call the API to pin
            }
    
            // Optionally, update the local chat history state if needed
            setFilteredChatHistory((prevHistory) =>
                prevHistory.map((chat) =>
                    chat.chat_id === chatID ? { ...chat, pinned: !isPinned } : chat
                )
            );
        } catch (error) {
            console.error("Error pinning/unpinning chat:", error);
        }
    };
    
    
    
    

    // WAITING FOR API -> API is here now, modified
    // PMJ 24/8/2024: Function to handle deleting a chat
    const handleDeleteChat = async (chatID: string) => {
        if (window.confirm("Are you sure you want to delete this chat?")) {
            await deleteChat(chatID); // Call the deleteChat function from the hook

            // Update the chat history locally
            setFilteredChatHistory((prevHistory) =>
                prevHistory.filter((chat) => chat.chat_id !== chatID)
            );
            setPinnedChats((prev) => prev.filter((id) => id !== chatID)); // Remove from pinned chats if necessary

            if (selectedChatID === chatID) {
                setSelectedChatID(null);
            }
        }
    };

    // WAITING FOR API
    // PMJ 24/8/2024: Function to handle archiving a chat
    const handleArchiveChat = async (chatID: string) => {
        try {
            await archiveChat(chatID);
            // Update chat history or UI state to reflect the archived status
            setFilteredChatHistory((prevHistory) =>
                prevHistory.map((chat) =>
                    chat.chat_id === chatID ? { ...chat, archived: true } : chat
                )
            );
        } catch (error) {
            console.error("Error archiving chat:", error);
        }
    };

    // Function to handle the three dots menu
    const threeDotsMenu = (chat: { chat_id: string; title: string; pinned: boolean }) => {
        return (
            <div className="flex absolute right-4 z-50 flex-col gap-3 items-end p-3 mt-10 text-white rounded-xl shadow-lg bg-primary">
                <button
                    className="flex gap-2 items-center shadow-sm bg-primary shadow-black/90"
                    onClick={() => handlePinChat(chat.chat_id, chat.pinned)}
                >
                    {chat.pinned ? (
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
                    onClick={() => handleDeleteChat(chat.chat_id)}
                >
                    <BiTrash />
                    <span>Delete</span>
                </button>
                <button
                    className="flex gap-2 items-center shadow-sm bg-primary shadow-black/90"
                    onClick={() => handleArchiveChat(chat.chat_id)}
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
                    {/* Priya 25/8/2024: Adding new chat button which clears the current chat and calls up a new one */}
                    <button
                             className="mb-2 px-4 py-2 bg-black-500 text-black rounded-full"
                             onClick={() => {
                             setSelectedChatID(null); // Clear the selected chat
                     }}
                    >
                    New Chat
                    </button>
                    {/* Priya 25/8/2024: Search bar with icon */}
                    
                    {/* Search bar with icon */}
                    <div className="relative mb-10">
                        <input
                            className="px-4 py-2 text-white rounded-full bg-zinc-700 pl-10"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                        <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white text-2xl" />
                    </div>

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
