import React from "react";
import {
    BiChevronLeftCircle,
    BiChevronRightCircle,
    BiGridSmall,
    BiPin,
    BiSolidPin,
    BiTrash, // Add this for delete
    BiArchive, // Add this for archive
} from "react-icons/bi";

const Sidebar: React.FC = () => {
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
    const threeDotsMenu = (chat: { chatID: string; title: string }) => {
        return (
            <div className="absolute p-2 text-white bg-black rounded shadow-lg">
                <button
                    className="flex gap-2 items-center"
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
                    className="flex gap-2 items-center mt-2"
                    onClick={() => handleDeleteChat(chat.chatID)}
                >
                    <BiTrash />
                    <span>Delete</span>
                </button>
                <button
                    className="flex gap-2 items-center mt-2"
                    onClick={() => handleArchiveChat(chat.chatID)}
                >
                    <BiArchive />
                    <span>Archive</span>
                </button>
            </div>
        );
    };

    const overlayMenu = isOverlayVisible && (
        // Overlay content on bottom left corner
        <div
            className="absolute bottom-0 left-0 w-full h-full bg-black/70"
            onClick={toggleOverlay}
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
                    <button className="text-3xl" onClick={toggleOverlay}>
                        <AiFillSetting />
                    </button>
                </div>
            </div>
        </div>
    );
    return <div>Sidebar</div>;
};

export default Sidebar;
