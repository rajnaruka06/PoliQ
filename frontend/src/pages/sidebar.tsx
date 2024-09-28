import React, { useRef, useState, useEffect } from "react";
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
    AiOutlineBook,
    AiOutlineForm,
    AiOutlineEdit,
} from "react-icons/ai";
// Import hooks
import { useUpdateTitleChat } from "../hooks/useUpdateTitleChat";
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
    onOptionClick?: (option: string) => void;
    selectedChatID: string | null;
    setSelectedChatID: (chatID: string | null) => void;
    setMessages: React.Dispatch<React.SetStateAction<MessageCurrent[]>>;
    refreshChatHistoryRef: React.MutableRefObject<() => void>; // **Added this prop**
}

const Sidebar: React.FC<SidebarProps> = ({
    onOptionClick,
    selectedChatID,
    setSelectedChatID,
    setMessages,
    refreshChatHistoryRef,
}) => {
    const userId = "example_user_id"; // Placeholder for user ID, replace with dynamic user ID
    const menuRef = useRef<HTMLDivElement | null>(null); // Reference for the menu
    const settingsRef = useRef<HTMLDivElement | null>(null);
    const SetRef = useRef<HTMLDivElement | null>(null); // Reference for the settings icon
    const dotRef = useRef<HTMLDivElement | null>(null); // Reference for the three dots icon
    const [, setPinnedChats] = useState<string[]>([]); // Tracks pinned chat IDs
    const [showOptionsMenu, setShowOptionsMenu] = useState<string | null>(null); // State to manage the visibility of the options menu for each chat
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);
    const [hoveredChatID, setHoveredChatID] = useState<string | null>(null); // State to track hovered chat
    const { chatHistory, loading, error, fetchChatHistory } =
        useFetchChatHistory(userId);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isRenaming, setIsRenaming] = useState(false); // To control renaming state
    const [newTitle, setNewTitle] = useState(""); // New title state
    const [chatToRename, setChatToRename] = useState<string | null>(null); // Chat ID to rename
    const {
        updateTitleChat,
        loading: renameLoading,
        error: renameError,
    } = useUpdateTitleChat(userId); // Hook to rename chat
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
                !menuRef.current.contains(event.target as Node) && // Check if click is outside the popup
                !(
                    dotRef.current &&
                    dotRef.current.contains(event.target as Node)
                )
            ) {
                setShowOptionsMenu(null); // Close the menu if clicked outside
            }

            if (
                settingsRef.current &&
                !settingsRef.current.contains(event.target as Node) && // Check if click is outside the popup
                !(
                    SetRef.current &&
                    SetRef.current.contains(event.target as Node)
                )
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
    const { deleteChat } = useDeleteChat(userId);
    // Use the pin and unpin chat hooks
    const { pinChat } = usePinChat(userId);
    const { unpinChat } = useUnpinChat(userId);
    const { searchResults } = useSearchChats(userId, searchTerm);
    // Use the archive and unarchive chat hooks
    const { archiveChat } = useArchiveChat(userId);
    const { unarchiveChat } = useUnarchiveChat(userId);

    // Effect to determine whether to use search results or the full chat history
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
                    chat.chatId === chatID
                        ? { ...chat, archived: !isArchived }
                        : chat
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

    //to rename a chat title
    const handleRenameChat = async (chatID: string) => {
        if (!newTitle.trim()) return; // Prevent empty titles
        try {
            await updateTitleChat(chatID, newTitle); // Call the updateTitleChat function from the hook
            // Update the chat title locally after renaming
            setFilteredChatHistory((prevHistory) =>
                prevHistory.map((chat) =>
                    chat.chatId === chatID ? { ...chat, title: newTitle } : chat
                )
            );
            setIsRenaming(false); // Hide the rename input
        } catch (error) {
            console.error("Error renaming chat:", error);
        }
    };

    // Function to handle the three dots menu
    const threeDotsMenu = (chat: {
        chatId: string;
        title: string;
        pinned: boolean;
        archived: boolean;
    }) => {
        return (
            <div
                ref={menuRef}
                className="flex absolute right-4 z-10 flex-col gap-3 items-end p-2 mt-10 rounded-2xl dark:bg-darkPrimary bg-lightPrimary"
            >
                {/* Pin / Unpin button */}
                <button
                    className="flex gap-2 items-center text-black bg-lightPrimary dark:bg-darkPrimary dark:text-white"
                    onClick={() => {
                        handlePinChat(chat.chatId, chat.pinned);
                        setShowOptionsMenu(null); // Close the menu after action
                    }}
                >
                    {chat.pinned ? (
                        <>
                            <span>Unpin</span>
                            <BiSolidPin />
                        </>
                    ) : (
                        <>
                            <span>Pin</span>
                            <BiPin />
                        </>
                    )}
                </button>
                {/* Delete chat button */}
                <button
                    className="flex gap-2 items-center text-black bg-lightPrimary dark:bg-darkPrimary dark:text-white"
                    onClick={() => {
                        handleDeleteChat(chat.chatId);
                        setShowOptionsMenu(null); // Close the menu after action
                    }}
                >
                    <span>Delete</span>
                    <BiTrash />
                </button>
                {/* Archive / Unarchive button */}
                <button
                    className="flex gap-2 items-center text-black bg-lightPrimary dark:bg-darkPrimary dark:text-white"
                    onClick={() => {
                        handleArchiveChat(chat.chatId, chat.archived || false);
                        setShowOptionsMenu(null); // Close the menu after action
                    }}
                >
                    <span>{chat.archived ? "Unarchive" : "Archive"}</span>
                    <BiArchive />
                </button>
                {/* Rename button */}
                <button
                    className="flex gap-2 items-center text-black bg-lightPrimary dark:bg-darkPrimary dark:text-white"
                    onClick={() => {
                        setIsRenaming(true);
                        setChatToRename(chat.chatId); // Set the chat ID to rename
                        setNewTitle(chat.title); // Set the current title as default
                        setShowOptionsMenu(null); // Close the menu after action
                    }}
                >
                    <span>Rename</span>
                    <AiOutlineEdit />
                </button>
            </div>
        );
    };

    //  Overlay content on bottom left corner
    const settingsOverlay = showSettingsMenu && (
        <div
            ref={settingsRef}
            className="flex absolute right-0 bottom-10 flex-col gap-5 p-5 mb-2 w-full text-lg text-white rounded-md shadow-lg bg-lightTertiary dark:bg-darkPrimary dark:text-black"
        >
            <button
                onClick={() => onOptionClick && onOptionClick("View all chats")}
                className="text-2xl font-semibold text-black bg-lightPrimary dark:bg-darkPrimary dark:text-white"
            >
                View all chats
            </button>
            <button
                onClick={() => onOptionClick && onOptionClick("Archived chats")}
                className="text-2xl font-semibold text-black bg-lightPrimary dark:bg-darkPrimary dark:text-white"
            >
                Archived chats
            </button>
            <button
                onClick={() => onOptionClick && onOptionClick("Memory")}
                className="text-2xl font-semibold text-black bg-lightPrimary dark:bg-darkPrimary dark:text-white"
            >
                Memory
            </button>
        </div>
    );

    // Populate chat history - changed to group unpinned chats by date
    const loadChatHistory = () => {
        // Separate pinned, archived, and regular chats based on the actual chat data
        const pinnedChatHistory = filteredChatHistory.filter(
            (chat) => chat.pinned
        );
        const archivedChatHistory = filteredChatHistory.filter(
            (chat) => chat.archived
        );
        const regularChatHistory = filteredChatHistory.filter(
            (chat) => !chat.pinned && !chat.archived
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
            <div className="flex overflow-auto flex-col flex-grow gap-2 text-black dark:text-white">
                {/* Pinned Chats */}
                {pinnedChatHistory.length > 0 && (
                    <div className="mb-4">
                        <div className="text-2xl font-semibold">Pinned</div>
                        {pinnedChatHistory.map((chat, idx) =>
                            loadChatHistoryComponent(chat, idx)
                        )}
                    </div>
                )}

                {/* Archived Chats */}
                {archivedChatHistory.length > 0 && (
                    <div className="mb-4">
                        <div className="text-2xl font-semibold">Archived</div>
                        {archivedChatHistory.map((chat, idx) =>
                            loadChatHistoryComponent(chat, idx)
                        )}
                    </div>
                )}

                {/* Regular Chats grouped by date */}
                {sortedDates.map((date) => (
                    <div key={date} className="mb-1">
                        <div className="text-lg font-semibold 3xl:text-xl">
                            {date}
                        </div>
                        {groupedByDate[date]
                            .reverse()
                            .map((chat, idx) =>
                                loadChatHistoryComponent(chat, idx)
                            )}
                    </div>
                ))}
            </div>
        );
    };

    // Function to load individual chat history component
    const loadChatHistoryComponent = (chat: ChatHistory, idx: number) => {
        return (
            <div
                key={idx}
                className={`flex items-center py-1 px-5 rounded-xl text-lg 3xl:text-xl hover:cursor-pointer ${
                    selectedChatID === chat.chatId
                        ? "bg-blue-600 hover:bg-blue-500 dark:hover:bg-blue-500 text-white dark:text-white"
                        : "dark:hover:bg-darkPrimary hover:bg-gray-200 bg-transparent text-black dark:text-white"
                }`}
                onClick={() => setSelectedChatID(chat.chatId)}
                onMouseEnter={() =>
                    !isRenaming && setHoveredChatID(chat.chatId)
                } // Set hovered chat on mouse enter only if not renaming
                onMouseLeave={() => !isRenaming && setHoveredChatID(null)} // Reset hovered chat on mouse leave only if not renaming
            >
                <div className="flex items-center w-full">
                    {/* Chat title or input */}
                    {isRenaming && chatToRename === chat.chatId ? (
                        <div className="flex-grow w-full">
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="px-3 py-2 mb-2 w-full text-black bg-white rounded border"
                                placeholder="Enter new title"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleRenameChat(chatToRename!);
                                    }
                                }}
                            />
                            <div className="flex flex-col gap-4 mt-2 xl:flex-row">
                                <button
                                    className="px-3 py-1 text-white bg-green-500 rounded"
                                    onClick={() =>
                                        handleRenameChat(chatToRename!)
                                    }
                                >
                                    Save
                                </button>
                                <button
                                    className="px-3 py-1 text-white bg-red-500 rounded"
                                    onClick={() => setIsRenaming(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="flex-grow truncate cursor-pointer"
                            onDoubleClick={() => {
                                setIsRenaming(true);
                                setChatToRename(chat.chatId);
                                setNewTitle(chat.title);
                            }}
                        >
                            {chat.title}
                        </div>
                    )}

                    {/* Three-dot menu icon */}
                    {!isRenaming &&
                        (hoveredChatID === chat.chatId ||
                            selectedChatID === chat.chatId) && (
                            <div ref={dotRef} className="flex-shrink-0 ml-auto">
                                <AiOutlineMore
                                    onClick={(event) => {
                                        event.stopPropagation(); // Prevent click from bubbling up to the document
                                        setShowOptionsMenu(
                                            (prev) =>
                                                prev === chat.chatId
                                                    ? null
                                                    : chat.chatId // Toggle the options menu for the specific chat
                                        );
                                    }}
                                    className="text-2xl cursor-pointer"
                                />
                            </div>
                        )}
                </div>
                {showOptionsMenu === chat.chatId && threeDotsMenu(chat)}
            </div>
        );
    };

    return (
        <div
            className={`flex flex-col relative rounded-lg shadow-lg transition-all duration-300 ease-in-out bg-lightSecondary dark:bg-darkSecondary ${
                isSidebarVisible ? "p-4 w-1/6" : "w-0"
            }`}
        >
            {isSidebarVisible && (
                <>
                    {/* Title Area*/}
                    <div className="flex relative mb-6">
                        <div className="">
                            <a
                                href="/"
                                className="font-semibold text-black lg:text-4xl 3xl:text-5xl dark:text-white hover:text-white"
                            >
                                PoliQ Chat
                            </a>
                        </div>
                    </div>

                    {/* Chat History Area */}
                    <div className="flex gap-2 mb-4">
                        {/* Search bar with icon */}
                        <div className="flex flex-grow text-2xl rounded-full 3xl:text-4xl bg-lightTertiary dark:bg-darkPrimary">
                            <AiOutlineSearch className="mx-2 my-auto" />
                            <input
                                className="w-full text-xl text-black rounded-full dark:bg-darkPrimary dark:text-white"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>
                        {/* New chat button */}
                        <button
                            className="px-4 py-2 text-2xl text-black rounded-full 3xl:text-3xl bg-lightTertiary dark:bg-darkPrimary dark:text-white"
                            onClick={() => {
                                setSelectedChatID(null); // Clear the selected chat
                                setMessages([]);
                            }}
                        >
                            <AiOutlineForm />
                        </button>
                    </div>
                    {/* Loading and error handling */}
                    {loading ? (
                        <p>Loading results...</p>
                    ) : error ? (
                        <p>Error: {error}</p>
                    ) : (
                        loadChatHistory()
                    )}

                    {/* Bottom Sidebar Area */}
                    <div className="flex p-2 text-3xl rounded-2xl shadow-lg 3xl:p-4 bg-lightSecondary dark:bg-darkPrimary">
                        <div className="mr-auto text-2xl text-black 3xl:text-3xl dark:text-white">
                            John Doe
                        </div>
                        {/* Show settings menu if active */}
                        <div ref={SetRef}>
                            <AiOutlineBook
                                className="text-black cursor-pointer dark:text-white"
                                onClick={(event) => {
                                    event.stopPropagation(); // Prevent click from bubbling up to the document
                                    setShowSettingsMenu((prev) => !prev); // Toggle the settings menu visibility
                                }}
                            />
                        </div>
                        {settingsOverlay}
                    </div>
                </>
            )}
            {/* Hide/Show Sidebar Button */}
            <button
                className={`absolute top-4 ${
                    isSidebarVisible ? "right-0" : "-right-12"
                } text-xl 3xl:text-2xl text-black dark:text-white rounded-full bg-lightSecondary dark:bg-darkSecondary`}
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
