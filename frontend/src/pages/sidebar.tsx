// frontend/src/components/Sidebar.tsx
import React, { useRef, useState, useEffect } from "react";
import {
    BiChevronLeftCircle,
    BiChevronRightCircle,
    BiPin,
    BiSolidPin,
    BiTrash,
    BiChevronDown,
    BiChevronUp,
    BiArchive,
} from "react-icons/bi";
import {
    AiOutlineMore,
    AiOutlineSearch,
    AiOutlineBook,
    AiOutlineForm,
    AiOutlineEdit,
} from "react-icons/ai";
import { useUpdateTitleChat } from "../hooks/useUpdateTitleChat";
import { useFetchChatHistory } from "../hooks/useFetchChatHistory";
import { usePinChat } from "../hooks/usePinChat";
import { useUnpinChat } from "../hooks/useUnpinChat";
import { useDeleteChat } from "../hooks/useDeleteChat";
import { useArchiveChat } from "../hooks/useArchiveChat";
import { useSearchChats } from "../hooks/useSearchChats";
import { useUnarchiveChat } from "../hooks/useUnarchiveChat";
import { useDeleteAllChats } from "../hooks/useDeleteAllChats";
import { useArchiveAllChats } from "../hooks/useArchiveAllChats";

import ConfirmationModal from "./ConfirmationModal"; // Import the modal

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
    refreshChatHistoryRef: React.MutableRefObject<() => void>;
}

const Sidebar: React.FC<SidebarProps> = ({
    onOptionClick,
    selectedChatID,
    setSelectedChatID,
    setMessages,
    refreshChatHistoryRef,
}) => {
    const userId = "example_user_id"; // Placeholder for user ID
    const menuRef = useRef<HTMLDivElement | null>(null);
    const settingsRef = useRef<HTMLDivElement | null>(null);
    const SetRef = useRef<HTMLDivElement | null>(null);
    const dotRef = useRef<HTMLDivElement | null>(null);
    const [, setPinnedChats] = useState<string[]>([]);
    const [showOptionsMenu, setShowOptionsMenu] = useState<string | null>(null);
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);
    const [hoveredChatID, setHoveredChatID] = useState<string | null>(null);
    const { chatHistory, loading, error, fetchChatHistory } =
        useFetchChatHistory(userId);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [expandedDates, setExpandedDates] = useState<{
        [key: string]: boolean;
    }>({});
    const [searchTerm, setSearchTerm] = useState("");
    const [isRenaming, setIsRenaming] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [chatToRename, setChatToRename] = useState<string | null>(null);
    const {
        updateTitleChat,
        loading: renameLoading,
        error: renameError,
    } = useUpdateTitleChat(userId);
    const [filteredChatHistory, setFilteredChatHistory] = useState<
        ChatHistory[]
    >([]);

    const { deleteAllChats } = useDeleteAllChats(userId);
    const { archiveAllChats } = useArchiveAllChats(userId);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [actionToConfirm, setActionToConfirm] =
        useState<() => void | null>(null);

    // Function to handle confirmation
    const handleConfirmAction = () => {
        if (actionToConfirm) {
            actionToConfirm();
            setActionToConfirm(null);
        }
        setIsModalOpen(false);
    };

    // Function to toggle sidebar
    const toggleSidebar = () => {
        setIsSidebarVisible(!isSidebarVisible);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                !(
                    dotRef.current &&
                    dotRef.current.contains(event.target as Node)
                )
            ) {
                setShowOptionsMenu(null);
            }

            if (
                settingsRef.current &&
                !settingsRef.current.contains(event.target as Node) &&
                !(
                    SetRef.current &&
                    SetRef.current.contains(event.target as Node)
                )
            ) {
                setShowSettingsMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef, settingsRef]);

    const { deleteChat } = useDeleteChat(userId);
    const { pinChat } = usePinChat(userId);
    const { unpinChat } = useUnpinChat(userId);
    const { searchResults } = useSearchChats(userId, searchTerm);
    const { archiveChat } = useArchiveChat(userId);
    const { unarchiveChat } = useUnarchiveChat(userId);

    useEffect(() => {
        if (searchTerm === "") {
            setFilteredChatHistory(chatHistory);
        } else {
            setFilteredChatHistory(searchResults);
        }
    }, [chatHistory, searchResults, searchTerm]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const toggleDateExpansion = (date: string) => {
        setExpandedDates((prevState) => ({
            ...prevState,
            [date]: !prevState[date], // Toggle the expansion state for the clicked date
        }));
    };

    const formatDate = (dateString: string): string => {
        // console.log(`Original date string: ${dateString}`); // Log the original date string

        let date: Date;

        // Check if the date is already in ISO format (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
            date = new Date(dateString);
        } else {
            // Attempt to parse other formats
            const parts = dateString.split(/[/.-]/);
            if (parts.length === 3) {
                // Assume DD/MM/YYYY or YYYY/MM/DD format
                if (parts[0].length === 4) {
                    // YYYY/MM/DD
                    date = new Date(
                        Number(parts[0]),
                        Number(parts[1]) - 1,
                        Number(parts[2])
                    );
                } else {
                    // DD/MM/YYYY
                    date = new Date(
                        Number(parts[2]),
                        Number(parts[1]) - 1,
                        Number(parts[0])
                    );
                }
            } else {
                console.error(`Invalid date format: ${dateString}`);
                return "Invalid Date";
            }
        }

        // Check if the date is valid
        if (isNaN(date.getTime())) {
            console.error(`Invalid date: ${dateString}`);
            return "Invalid Date";
        }

        // Format the date
        const formattedDate = date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });

        // console.log(`Formatted date: ${formattedDate}`);
        return formattedDate;
    };

    const handlePinChat = async (chatID: string, isPinned: boolean) => {
        try {
            if (isPinned) {
                await unpinChat(chatID);
            } else {
                await pinChat(chatID);
            }

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

    const handleDeleteChat = async (chatID: string) => {
        await deleteChat(chatID);
        setFilteredChatHistory((prevHistory) =>
            prevHistory.filter((chat) => chat.chatId !== chatID)
        );
        setPinnedChats((prev) => prev.filter((id) => id !== chatID));
        fetchChatHistory();
        if (selectedChatID === chatID) {
            setSelectedChatID(null);
        }
    };

    const handleArchiveChat = async (chatID: string, isArchived: boolean) => {
        try {
            if (isArchived) {
                await unarchiveChat(chatID);
            } else {
                await archiveChat(chatID);
            }
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

    useEffect(() => {
        if (refreshChatHistoryRef) {
            refreshChatHistoryRef.current = fetchChatHistory;
        }
    }, [fetchChatHistory, refreshChatHistoryRef]);

    const handleRenameChat = async (chatID: string) => {
        if (!newTitle.trim()) return;
        try {
            await updateTitleChat(chatID, newTitle);
            setFilteredChatHistory((prevHistory) =>
                prevHistory.map((chat) =>
                    chat.chatId === chatID ? { ...chat, title: newTitle } : chat
                )
            );
            setIsRenaming(false);
        } catch (error) {
            console.error("Error renaming chat:", error);
        }
    };

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
                <button
                    className="flex gap-2 items-center text-black bg-lightPrimary dark:bg-darkPrimary dark:text-white"
                    onClick={() => {
                        handlePinChat(chat.chatId, chat.pinned);
                        setShowOptionsMenu(null);
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
                <button
                    className="flex gap-2 items-center text-black bg-lightPrimary dark:bg-darkPrimary dark:text-white"
                    onClick={() => {
                        setModalMessage(
                            "Are you sure you want to delete this chat?"
                        );
                        setActionToConfirm(
                            () => () => handleDeleteChat(chat.chatId)
                        );
                        setIsModalOpen(true);
                        setShowOptionsMenu(null);
                    }}
                >
                    <span>Delete</span>
                    <BiTrash />
                </button>
                <button
                    className="flex gap-2 items-center text-black bg-lightPrimary dark:bg-darkPrimary dark:text-white"
                    onClick={() => {
                        setModalMessage(
                            chat.archived
                                ? "Are you sure you want to unarchive this chat?"
                                : "Are you sure you want to archive this chat?"
                        );
                        setActionToConfirm(() =>
                            handleArchiveChat(
                                chat.chatId,
                                chat.archived || false
                            )
                        );
                        setIsModalOpen(true);
                        setShowOptionsMenu(null);
                    }}
                >
                    <span>{chat.archived ? "Unarchive" : "Archive"}</span>
                    <BiArchive />
                </button>
                <button
                    className="flex gap-2 items-center text-black bg-lightPrimary dark:bg-darkPrimary dark:text-white"
                    onClick={() => {
                        setIsRenaming(true);
                        setChatToRename(chat.chatId);
                        setNewTitle(chat.title);
                        setShowOptionsMenu(null);
                    }}
                >
                    <span>Rename</span>
                    <AiOutlineEdit />
                </button>
            </div>
        );
    };

    const settingsOverlay = showSettingsMenu && (
        <div
            ref={settingsRef}
            className="flex absolute right-0 bottom-10 flex-col gap-5 p-5 mb-2 w-full text-lg text-white rounded-md shadow-lg bg-lightTertiary dark:bg-darkPrimary dark:text-black"
        >
            <button
                onClick={() => {
                    setModalMessage(
                        "Are you sure you want to delete all chats?"
                    );
                    setActionToConfirm(() => async () => {
                        try {
                            const chatIDs = filteredChatHistory.map(
                                (chat) => chat.chatId
                            );
                            await deleteAllChats(chatIDs);
                            setFilteredChatHistory([]); // Clear the chat history
                            if (refreshChatHistoryRef.current) {
                                refreshChatHistoryRef.current();
                            }
                            setSelectedChatID(null); // Deselect any selected chat
                            setMessages([]); // Clear messages in the chat area
                        } catch (err) {
                            console.error("Error deleting all chats:", err);
                        }
                    });
                    setIsModalOpen(true);
                }}
                className="text-2xl font-semibold text-black bg-lightPrimary dark:bg-darkPrimary dark:text-white"
            >
                Delete All chats
            </button>
            <button
                onClick={() => {
                    setModalMessage(
                        "Are you sure you want to archive all chats?"
                    );
                    setActionToConfirm(() => async () => {
                        try {
                            const chatIDs = filteredChatHistory.map(
                                (chat) => chat.chatId
                            );
                            await archiveAllChats(chatIDs);
                            setFilteredChatHistory((prevHistory) =>
                                prevHistory.map((chat) => ({
                                    ...chat,
                                    archived: true,
                                }))
                            ); // Set all chats to archived
                            if (refreshChatHistoryRef.current) {
                                refreshChatHistoryRef.current();
                            }
                            setSelectedChatID(null); // Deselect any selected chat
                            setMessages([]); // Clear messages in the chat area
                        } catch (err) {
                            console.error("Error archiving all chats:", err);
                            // Optionally, display an error message to the user
                        }
                    });
                    setIsModalOpen(true);
                }}
                className="text-2xl font-semibold text-black bg-lightPrimary dark:bg-darkPrimary dark:text-white"
            >
                Archive All chats
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

    // Updated loadChatHistory function
    const loadChatHistory = () => {
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
            const date = formatDate(chat.date);
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
                        {/* Date Header with Toggle Icon */}
                        <div
                            className="flex justify-between items-center text-lg font-semibold cursor-pointer"
                            onClick={() => toggleDateExpansion(date)}
                        >
                            <span>{date}</span>
                            {/* Toggle Icon to Expand/Collapse Chats */}
                            <div>
                                {expandedDates[date] ? (
                                    <BiChevronUp className="text-xl" />
                                ) : (
                                    <BiChevronDown className="text-xl" />
                                )}
                            </div>
                        </div>

                        {/* Render Chats under the Date if Expanded */}
                        {expandedDates[date] &&
                            groupedByDate[date]
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
                }
                onMouseLeave={() => !isRenaming && setHoveredChatID(null)}
            >
                <div className="flex items-center w-full">
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

                    {!isRenaming &&
                        (hoveredChatID === chat.chatId ||
                            selectedChatID === chat.chatId) && (
                            <div ref={dotRef} className="flex-shrink-0 ml-auto">
                                <AiOutlineMore
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setShowOptionsMenu((prev) =>
                                            prev === chat.chatId
                                                ? null
                                                : chat.chatId
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
                                className="w-full text-xl text-black rounded-full bg-lightTertiary dark:bg-darkPrimary dark:text-white"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>
                        <button
                            className="px-4 py-2 text-2xl text-black rounded-full 3xl:text-3xl bg-lightTertiary dark:bg-darkPrimary dark:text-white"
                            onClick={() => {
                                setSelectedChatID(null);
                                setMessages([]);
                            }}
                        >
                            <AiOutlineForm />
                        </button>
                    </div>
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
                                    event.stopPropagation();
                                    setShowSettingsMenu((prev) => !prev);
                                }}
                            />
                        </div>
                        {settingsOverlay}
                    </div>
                </>
            )}
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
            <ConfirmationModal
                isOpen={isModalOpen}
                message={modalMessage}
                onConfirm={handleConfirmAction}
                onCancel={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default Sidebar;
