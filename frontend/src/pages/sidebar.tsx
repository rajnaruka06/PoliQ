import React, { useState, useEffect } from "react";
import {
    BiChevronLeftCircle,
    BiChevronRightCircle,
    BiPin,
    BiSolidPin,
    BiTrash, // Add this for delete
    BiArchive, // Add this for archive
} from "react-icons/bi";
import { HiOutlineDotsVertical } from "react-icons/hi";

import { AiFillSetting } from "react-icons/ai";

interface ChatHistory {
    date: string;
    chat: { title: string; chatID: string }[];
}

interface SidebarProps {
    selectedChatID: string | null;
    setSelectedChatID: (chatID: string | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    selectedChatID,
    setSelectedChatID,
}) => {
    const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
    const [filteredChatHistory, setFilteredChatHistory] = useState<
        ChatHistory[]
    >([]);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [pinnedChats, setPinnedChats] = useState<string[]>([]); // Tracks pinned chat IDs
    const [isOverlaySettingsVisible, setIsOverlaySettingsVisible] =
        useState(false);
    // CHANGE: State to manage the visibility of the options menu for each chat
    const [showOptionsMenu, setShowOptionsMenu] = useState<string | null>(null);

    // Function to fetch chat history (sidebar) and useEffect to call it
    useEffect(() => {
        const fetchChatHistory = async () => {
            try {
                const response = await fetch("/chat.json");
                const data = await response.json();
                setChatHistory(data);
                setFilteredChatHistory(data);
            } catch (error) {
                console.error("Error fetching chat history:", error);
            }
        };

        fetchChatHistory();
    }, []);

    // Function to toggle sidebar
    const toggleSidebar = () => {
        setIsSidebarVisible(!isSidebarVisible);
    };

    // Function to handle search
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        if (value === "") {
            setFilteredChatHistory(chatHistory);
        } else {
            const filtered = chatHistory
                .map((session) => ({
                    ...session,
                    chat: session.chat.filter((chat) =>
                        chat.title.toLowerCase().includes(value.toLowerCase())
                    ),
                }))
                .filter((session) => session.chat.length > 0);
            setFilteredChatHistory(filtered);
        }
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
    // CHANGE: Function to handle the pinning and unpinning of chats
    const handlePinChat = (chatID: string) => {
        if (pinnedChats.includes(chatID)) {
            setPinnedChats(pinnedChats.filter((id) => id !== chatID)); // Unpin the chat if it is already pinned
        } else {
            setPinnedChats([...pinnedChats, chatID]); // Pin the chat
        }
    };

    // WAITING FOR API
    // Function to handle deleting a chat
    const handleDeleteChat = (chatID: string) => {
        // Confirm before deleting
        if (window.confirm("Are you sure you want to delete this chat?")) {
            // Filter out the chat from chatHistory and filteredChatHistory
            const updatedChatHistory = chatHistory.filter((session) =>
                session.chat.every((chat) => chat.chatID !== chatID)
            );
            const updatedFilteredChatHistory = filteredChatHistory.filter(
                (session) =>
                    session.chat.every((chat) => chat.chatID !== chatID)
            );

            // Update state
            setChatHistory(updatedChatHistory);
            setFilteredChatHistory(updatedFilteredChatHistory);

            // Remove from pinnedChats if present
            setPinnedChats(pinnedChats.filter((id) => id !== chatID));

            // Clear selectedChatID if it's the one being deleted
            if (selectedChatID === chatID) {
                setSelectedChatID(null);
            }
        }
    };

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
    const toggleOverlaySettings = () => {
        setIsOverlaySettingsVisible(!isOverlaySettingsVisible);
    };

    // Overlay for Settings
    const overlaySettings = isOverlaySettingsVisible && (
        // Overlay content on bottom left corner
        <div
            className="fixed bottom-0 left-0 w-full h-full bg-black/70"
            onClick={toggleOverlaySettings}
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
                        onClick={toggleOverlaySettings}
                    >
                        <AiFillSetting />
                    </button>
                </div>
            </div>
        </div>
    );

    // Populate chat history
    const loadChatHistory = () => {
        return (
            <div className="flex overflow-auto flex-col flex-grow gap-3 text-white">
                {filteredChatHistory.map((session, index) => (
                    <div
                        key={index}
                        className="flex relative flex-col gap-1 mb-4"
                    >
                        <div className="text-2xl font-semibold">
                            {formatDate(session.date)}
                        </div>
                        {session.chat
                            .filter(
                                (chat) => !pinnedChats.includes(chat.chatID)
                            ) // Exclude pinned chats
                            .map((chat, idx) => (
                                <div
                                    key={idx}
                                    className={`flex flex-col py-1 pl-5 ml-3 text-xl truncate hover:bg-zinc-500 hover:cursor-pointer ${
                                        selectedChatID === chat.chatID
                                            ? "bg-blue-600 text-white"
                                            : "bg-transparent"
                                    }`}
                                    onClick={() =>
                                        setSelectedChatID(chat.chatID)
                                    }
                                >
                                    <div className="flex justify-between group">
                                        <span className="truncate">
                                            {chat.title}
                                        </span>
                                        <HiOutlineDotsVertical
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevents triggering the chat selection
                                                setShowOptionsMenu(
                                                    showOptionsMenu ===
                                                        chat.chatID
                                                        ? null
                                                        : chat.chatID
                                                );
                                            }}
                                            className="pr-2 text-3xl"
                                        />
                                    </div>
                                    {showOptionsMenu === chat.chatID &&
                                        threeDotsMenu(chat)}
                                </div>
                            ))}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div
            className={`flex flex-col p-4 relative rounded-lg shadow-lg transition-all duration-300 ease-in-out bg-sidebar ${isSidebarVisible ? "w-1/6" : "w-0"}`}
        >
            {isSidebarVisible && (
                <>
                    <div className="mb-10 text-5xl font-bold text-white">
                        <a href="/" className="text-white hover:text-white">
                            PoliQ Chat
                        </a>
                    </div>
                    {/* Search bar */}
                    <input
                        className="px-4 py-2 mb-10 text-2xl rounded-full bg-zinc-500"
                        placeholder="search chat..."
                        value={searchTerm}
                        onChange={handleSearch}
                    ></input>

                    {/* CHANGE: Chat history amended with exclusion of pinned chats */}
                    {loadChatHistory()}
                    {overlaySettings}
                    <div className="flex justify-between items-center text-3xl bg-sidebar">
                        {/* User name */}
                        <div className="flex-grow text-left">John Doe</div>
                        {/* Settings button */}
                        <button
                            className="text-3xl"
                            onClick={toggleOverlaySettings}
                        >
                            <AiFillSetting />
                        </button>
                    </div>
                </>
            )}
            <div
                className={`absolute top-1/2 ${isSidebarVisible ? "-right-20" : "-right-15"}`}
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
