import React, { useRef, useState, useEffect } from "react";
// oi adding this
import {
    BiChevronLeftCircle,
    BiChevronRightCircle,
    BiPin,
    BiSolidPin,
    BiTrash,
    BiArchive,
} from "react-icons/bi";
import {
    AiOutlineMore,
    AiOutlineSearch,
    AiOutlineEllipsis,
    AiOutlineForm,
} from "react-icons/ai";
// Import hooks
import { useFetchChatHistory } from "../hooks/useFetchChatHistory";
import { usePinChat } from "../hooks/usePinChat";
import { useUnpinChat } from "../hooks/useUnpinChat";
import { useDeleteChat } from "../hooks/useDeleteChat";
import { useArchiveChat } from "../hooks/useArchiveChat";
import { useSearchChats } from "../hooks/useSearchChats";
import { useUnarchiveChat } from "../hooks/useUnarchiveChat";

interface ChatHistory {
    chatId: string;
    date: string;
    title: string;
    pinned: boolean;
    archived?: boolean;
}

interface SidebarProps {
    selectedChatID: string | null;
    setSelectedChatID: (chatID: string | null) => void;
    setMessages: React.Dispatch<React.SetStateAction<MessageCurrent[]>>;
    refreshChatHistoryRef: React.MutableRefObject<() => void>; // **Added this prop**
}

const Sidebar: React.FC<SidebarProps> = ({
    selectedChatID,
    setSelectedChatID,
    setMessages,
    refreshChatHistoryRef,
}) => {
    // TODO: Proper commenting to explain

    const userId = "example_user_id"; // Placeholder for user ID, replace with dynamic user ID
    const menuRef = useRef<HTMLDivElement | null>(null); // Reference for the menu
    const settingsRef = useRef<HTMLDivElement | null>(null);
    const [pinnedChats, setPinnedChats] = useState<string[]>([]); // Tracks pinned chat IDs
    const [showOptionsMenu, setShowOptionsMenu] = useState<string | null>(null); // State to manage the visibility of the options menu for each chat
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);
    const [hoveredChatID, setHoveredChatID] = useState<string | null>(null); // State to track hovered chat
    const { chatHistory, loading, error, fetchChatHistory } = useFetchChatHistory(userId);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    // State to manage filtered chat history
    const [filteredChatHistory, setFilteredChatHistory] = useState<
        ChatHistory[]
    >([]);

    // Function to toggle sidebar
    const toggleSidebar = () => {
        setIsSidebarVisible(!isSidebarVisible);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setShowOptionsMenu(null); // Close the menu if clicked outside
            }

            if (
                settingsRef.current &&
                !settingsRef.current.contains(event.target as Node)
            ) {
                setShowSettingsMenu(false); // Close the settings menu if clicked outside
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        // Cleanup event listener when component unmounts
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef, settingsRef]);

    //Delete chat using useDeleteChat hook
    //KW 27/08: commented unused because it gives red prompt
    const {
        deleteChat,
        // loading: deleteLoading,
        // error: deleteError,
    } = useDeleteChat(userId);
    // Use the pin and unpin chat hooks
    const { 
        pinChat, /* loading: pinLoading, error: pinError */ } = usePinChat(userId);
    const { 
        unpinChat, /* loading: unpinLoading, error: unpinError */ } = useUnpinChat(userId); 
    const {
        searchResults,
        // loading: searchLoading,
        // error: searchError,
    } = useSearchChats(userId, searchTerm);
    // Use the archive and unarchive chat hooks
    const { 
        archiveChat, /* loading: archiveLoading, error: archiveError */ } = useArchiveChat(userId);
    const { 
        unarchiveChat, /* loading: unarchiveLoading, error: unarchiveError */ } = useUnarchiveChat(userId);

    // Effect to determine whether to use serach results or the full chat history
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

    // updated function to pin or unpin based on chat's current state
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
                    chat.chatId === chatID
                        ? { ...chat, pinned: !isPinned }
                        : chat
                )
            );
            fetchChatHistory();
        } catch (error) {
            console.error("Error pinning/unpinning chat:", error);
        }
    };

    // Function to handle deleting a chat
    const handleDeleteChat = async (chatID: string) => {
        if (window.confirm("Are you sure you want to delete this chat?")) {
            await deleteChat(chatID); // Call the deleteChat function from the hook
            // Update the chat history locally
            setFilteredChatHistory((prevHistory) =>
                prevHistory.filter((chat) => chat.chatId !== chatID)
            );
            setPinnedChats((prev) => prev.filter((id) => id !== chatID)); // Remove from pinned chats if necessary
            fetchChatHistory();
            if (selectedChatID === chatID) {
                setSelectedChatID(null);
            }
        }
    };

    // Update archive/unarchive handling in threeDotsMenu function
    const handleArchiveChat = async (chatID: string, isArchived: boolean) => {
        try {
            if (isArchived) {
                await unarchiveChat(chatID); // Call unarchive if currently archived
            } else {
                await archiveChat(chatID); // Call archive otherwise
            }
            // Update chat history or UI state
            setFilteredChatHistory((prevHistory) =>
                prevHistory.map((chat) =>
                    chat.chatId === chatID ? { ...chat, archived: !isArchived } : chat
                )
            );
            fetchChatHistory();
        } catch (error) {
            console.error("Error archiving/unarchiving chat:", error);
        }
    };

        // **Expose fetchChatHistory via refreshChatHistoryRef**
        useEffect(() => {
            if (refreshChatHistoryRef) {
                refreshChatHistoryRef.current = fetchChatHistory;
            }
        }, [fetchChatHistory, refreshChatHistoryRef]);

    // Function to handle the three dots menu
    const threeDotsMenu = (chat: {
        chatId: string;
        title: string;
        pinned: boolean;
    }) => {
        return (
            // FIXME: threedots bug, useref can't close
            <div
                ref={menuRef}
                className="flex absolute right-4 z-50 flex-col gap-3 items-end p-3 mt-10 text-white rounded-xl shadow-lg bg-primary"
            >
                {/* Pin / Unpin button */}
                <button
                    className="flex gap-2 items-center shadow-sm bg-primary shadow-black/90"
                    onClick={() => handlePinChat(chat.chatId, chat.pinned)}
                >
                    {chat.pinned ? (
                        <>
                            <BiSolidPin />
                            {/* <span>Unpin</span> */}
                        </>
                    ) : (
                        <>
                            <BiPin />
                            {/* <span>Pin</span> */}
                        </>
                    )}
                </button>
                {/* Delete chat button */}
                <button
                    className="flex gap-2 items-center shadow-sm bg-primary shadow-black/90"
                    onClick={() => handleDeleteChat(chat.chatId)}
                >
                    <BiTrash />
                    {/* <span>Delete</span> */}
                </button>
                {/* Archive / Unarchive button */}
                <button
                    className="flex gap-2 items-center shadow-sm bg-primary shadow-black/90"
                    onClick={() => handleArchiveChat(chat.chatId, chat.archived || false)} // Pass the correct state
                >
                    <BiArchive />
                    {/* <span>Archive</span> */}
                </button>

            </div>
        );
    };

    //  Overlay content on bottom left corner
    //  TODO: Create a floating window
    const settingsOverlay = showSettingsMenu && (
        <div
            ref={settingsRef}
            className="absolute right-0 bottom-10 p-2 mb-2 w-full rounded shadow-lg"
        >
            <ul className="flex flex-col gap-5 content-end p-5 text-lg rounded-lg bg-primary">
                <button className="text-2xl font-semibold bg-primary">
                    View all chats
                </button>
                <button className="text-2xl font-semibold bg-primary">
                    Archived chats
                </button>
                <button className="text-2xl font-semibold bg-primary">
                    Memory
                </button>
            </ul>
            {/* <div className="flex justify-end">
                <button className="text-3xl" onClick={toggleSettingsOverlay}>
                    <AiOutlineEllipsis />
                </button>
            </div> */}
        </div>
    );

    // components that called inside loadChatHistory
    const loadChatHistoryComponent = (chat: ChatHistory, idx: number) => {
        return (
            <div
                key={idx}
                className={`flex flex-col py-1 pl-5 ml-3 rounded-xl text-xl truncate hover:bg-zinc-500 hover:cursor-pointer ${
                    selectedChatID === chat.chatId
                        ? "bg-blue-600 text-white"
                        : "bg-transparent"
                }`}
                onClick={() => setSelectedChatID(chat.chatId)}
                onMouseEnter={() => setHoveredChatID(chat.chatId)} // Set hovered chat on mouse enter
                onMouseLeave={() => setHoveredChatID(null)} // Reset hovered chat on mouse leave
            >
                <div className="flex justify-between group">
                    <span className="truncate">{chat.title}</span>
                    {hoveredChatID === chat.chatId && ( // Show icon only if hovered
                        <AiOutlineMore
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowOptionsMenu(
                                    showOptionsMenu === chat.chatId
                                        ? null
                                        : chat.chatId
                                );
                            }}
                            className="pr-2 text-3xl"
                        />
                    )}
                </div>
                {/* FIXME: when threedotsmenu hovered, row size changes */}
                {showOptionsMenu === chat.chatId && threeDotsMenu(chat)}
            </div>
        );
    };

    // Populate chat history - changed to group unpinned chats by date
    const loadChatHistory = () => {
        // Separate pinned and regular chats based on the actual chat data
        const pinnedChatHistory = filteredChatHistory.filter(
            (chat) => chat.pinned
        );
        const regularChatHistory = filteredChatHistory.filter(
            (chat) => !chat.pinned
        );

        // Group regular chats by date
        const groupedByDate: { [key: string]: ChatHistory[] } = {};
        regularChatHistory.forEach((chat) => {
            const date = formatDate(chat.date); // Format the date
            if (!groupedByDate[date]) {
                groupedByDate[date] = [];
            }
            groupedByDate[date].push(chat);
        });

        // Sort dates from newest to oldest
        const sortedDates = Object.keys(groupedByDate).sort(
            (a, b) => new Date(b).getTime() - new Date(a).getTime()
        );

        return (
            <div className="flex overflow-auto flex-col flex-grow gap-2 text-white">
                {/* Pinned Chats */}
                {pinnedChatHistory.length > 0 && (
                    <div className="mb-4">
                        <div className="text-2xl font-semibold">Pinned</div>
                        {pinnedChatHistory.map((chat, idx) =>
                            loadChatHistoryComponent(chat, idx)
                        )}
                    </div>
                )}

                {/* Regular Chats grouped by date */}
                {sortedDates.map((date) => (
                    <div key={date} className="mb-4">
                        <div className="text-xl font-semibold">{date}</div>
                        {groupedByDate[date].map((chat, idx) =>
                            loadChatHistoryComponent(chat, idx)
                        )}
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
                    {/* Title Area*/}
                    <div className="flex relative mb-10">
                        <div className="text-5xl font-bold text-white">
                            <a href="/" className="text-white hover:text-white">
                                PoliQ Chat
                            </a>
                        </div>
                    </div>

                    {/* Chat History Area */}
                    <div className="flex relative gap-2 mb-8">
                        {/* Search bar with icon */}
                        <div className="relative flex-grow">
                            <input
                                className="px-4 py-2 pl-10 w-full text-white rounded-full bg-zinc-700 "
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                            <AiOutlineSearch className="absolute left-3 top-1/2 text-2xl text-white transform -translate-y-1/2" />
                        </div>
                        {/* New chat button */}
                        <button
                            className="px-4 py-2 text-white rounded-full bg-zinc-700"
                            onClick={() => {
                                setSelectedChatID(null); // Clear the selected chat
                                setMessages([]);
                            }}
                        >
                            <AiOutlineForm />
                        </button>
                    </div>
                    {loading && <p>Loading results...</p>}
                    {error && <p>Error: {error}</p>}
                    {!loading && !error && loadChatHistory()}

                    {/* Bottom Sidebar Area */}
                    <div className="flex relative text-3xl bg-sidebar">
                        <div className="">John Doe</div>
                        {/* FIXME: settings bug, useref can't close */}
                        {settingsOverlay}
                        <AiOutlineEllipsis
                            className="absolute right-0 cursor-pointer"
                            onClick={() => setShowSettingsMenu(true)}
                        />
                    </div>
                </>
            )}
            {/* Hide/Show Sidebar Button */}
            <button
                className={`absolute top-4 ${
                    isSidebarVisible ? "right-0" : "-right-12"
                } text-2xl text-white rounded-full bg-sidebar`}
                onClick={toggleSidebar}
            >
                {isSidebarVisible ? (
                    <BiChevronLeftCircle />
                ) : (
                    <BiChevronRightCircle />
                )}
            </button>
        </div>
    );
};

export default Sidebar;
