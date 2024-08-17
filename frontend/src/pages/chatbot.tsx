import React, { useState, useEffect } from "react";
// CHANGE: Added 5 icons from react-icons/bi to add to the render feedback button
// CHANGE: Added 3 icons from react-icons/bi to add the pin icon and active-chat options
import {
    BiChevronLeftCircle,
    BiChevronRightCircle,
    BiCopy,
    BiRefresh,
    BiConfused,
    BiData,
    BiBarChartSquare,
    BiGridSmall,
    BiPin,
    BiSolidPin,
    BiTrash,        // Add this for delete
    BiArchive       // Add this for archive
} from "react-icons/bi";

import { AiFillSetting } from "react-icons/ai";

// Define an interface for the chat history data structure
interface ChatHistory {
    date: string;
    chat: { title: string; chatID: string }[];
}

interface MessageCurrent {
    sender: string;
    text: string;
    user: string;
}

interface MessageHistory {
    messageID: string;
    user: string;
    content: string;
    date: string;
    time: string;
}

const ChatBot: React.FC = () => {
    const [messages, setMessages] = useState<MessageCurrent[]>([]);
    const [input, setInput] = useState("");
    const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
    const [filteredChatHistory, setFilteredChatHistory] = useState<
        ChatHistory[]
    >([]);
    const [detailedMessages, setConvMessages] = useState<MessageHistory[]>([]);
    const [selectedChatID, setSelectedChatID] = useState<string | null>(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isOverlayVisible, setIsOverlayVisible] = useState(false);
    // CHANGE: State for managing pinned chats
    const [pinnedChats, setPinnedChats] = useState<string[]>([]); // Tracks pinned chat IDs
    // CHANGE: State to manage the visibility of the options menu for each chat
    const [showOptionsMenu, setShowOptionsMenu] = useState<string | null>(null);

    // Function to handle sending messages
    const handleSend = () => {
        if (input.trim()) {
            setMessages([
                ...messages,
                { sender: "user", text: input, user: "user" },
            ]);
            setInput("");

            setTimeout(() => {
                setMessages((prevMessages) => [
                    ...prevMessages,
                    {
                        sender: "bot",
                        text: "This is a response from the bot.",
                        user: "bot",
                    },
                ]);
            }, 500);
        }
    };

    // Function to clear the input
    const handleClear = () => {
        setInput("");
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

    // Function to fetch chat history
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

    // Function to fetch messages
    const fetchMessages = async (chatID: string) => {
        try {
            const response = await fetch(`${chatID}.json`);
            const data = await response.json();
            setConvMessages(data);
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    useEffect(() => {
        fetchChatHistory();
    }, []);

    // Function to fetch messages
    useEffect(() => {
        if (selectedChatID) {
            fetchMessages(selectedChatID);
            const interval = setInterval(() => {
                fetchMessages(selectedChatID);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [selectedChatID]);

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

    // CHANGE: Function to handle the pinning and unpinning of chats
    const handlePinChat = (chatID: string) => {
        if (pinnedChats.includes(chatID)) {
            setPinnedChats(pinnedChats.filter((id) => id !== chatID)); // Unpin the chat if it is already pinned
        } else {
            setPinnedChats([...pinnedChats, chatID]); // Pin the chat
        }
    };
    // Function to handle deleting a chat
    // Function to handle deleting a chat
const handleDeleteChat = (chatID: string) => {
    // Confirm before deleting
    if (window.confirm("Are you sure you want to delete this chat?")) {
        // Filter out the chat from chatHistory and filteredChatHistory
        const updatedChatHistory = chatHistory.filter((session) =>
            session.chat.every((chat) => chat.chatID !== chatID)
        );
        const updatedFilteredChatHistory = filteredChatHistory.filter((session) =>
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


    // Function to handle archiving a chat
    const handleArchiveChat = (chatID: string) => {
        // Archive logic here (e.g., move to archived chats list)
        console.log(`Archived chat with ID: ${chatID}`);
    };

    // Function to render feedback button
    // CHANGE: Added icons for what user can do to interact with the response
    const FeedbackButton = () => {
        return (
            <div className="flex gap-1 p-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {/* Copy Icon */}
                <button className="px-1 py-1 text-white bg-blue-500 rounded-full">
                    {/* CHANGE TODO: Allow user to copy response to clipboard */}
                    <BiCopy className="text-xl" />
                </button>
                {/* Refresh Icon */}
                <button className="px-1 py-1 text-white bg-green-500 rounded-full">
                    {/* CHANGE TODO: Allow user to regenerate response */}
                    <BiRefresh className="text-xl" />
                </button>
                {/* Confused Icon */}
                <button className="px-1 py-1 text-white bg-red-500 rounded-full">
                    {/* CHANGE TODO: Allow user to report bad or confusing response */}
                    <BiConfused className="text-xl" />
                </button>
                {/* Data Icon */}
                <button className="px-1 py-1 text-white bg-yellow-500 rounded-full">
                    {/* CHANGE TODO: Allow user to upload data specifically for this response - to regenerate response with new date as new context */}
                    <BiData className="text-xl" />
                </button>
                {/* Bar Chart Icon */}
                <button className="px-1 py-1 text-white bg-purple-500 rounded-full">
                    {/* CHANGE TODO: Allow user to generate a visualisation based on this response */}
                    <BiBarChartSquare className="text-xl" />
                </button>
            </div>
        );
    };
    // QUESTION: not sure what this is for?
    const toggleOverlay = () => {
        setIsOverlayVisible(!isOverlayVisible);
    };

    return (
        <div className="flex p-4 w-screen h-screen bg-primary">
            {/* Sidebar with transition */}
            <div
                className="flex flex-col p-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out bg-sidebar"
                style={{
                    maxWidth: isSidebarVisible ? "16.666%" : "0",
                    minWidth: isSidebarVisible ? "16.666%" : "0",
                }}
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

                        {/* CHANGE: Pinned chat area */}
                        {pinnedChats.length > 0 && (
                            <div className="mb-5 text-white">
                                <h3 className="text-2xl font-semibold">
                                    Pinned Chats
                                </h3>
                                <div className="flex overflow-auto flex-col gap-3">
                                    {filteredChatHistory.map((session) =>
                                        session.chat
                                            .filter((chat) =>
                                                pinnedChats.includes(
                                                    chat.chatID
                                                )
                                            )
                                            .map((chat, idx) => (
                                                <div
                                                    key={idx}
                                                    
                                                    className={`py-1 pl-5 ml-3 text-xl truncate rounded-full hover:bg-zinc-500 hover:cursor-pointer ${
                                                        selectedChatID ===
                                                        chat.chatID
                                                            ? "bg-blue-600 text-white"
                                                            : "bg-transparent"
                                                    }`}
                                                    onClick={() =>
                                                        setSelectedChatID(
                                                            chat.chatID
                                                        )
                                                    }
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span>
                                                            {chat.title}
                                                        </span>
                                                        <BiGridSmall
                                                        
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // Prevents triggering the chat selection
                                                                setShowOptionsMenu(
                                                                    showOptionsMenu ===
                                                                        chat.chatID
                                                                        ? null
                                                                        : chat.chatID
                                                                );
                                                            }}
                                                        />
                                                    </div>
                                                    {/* CHANGE: Options menu for pinning/unpinning when pinned */}
                                                    {showOptionsMenu ===
                                                        chat.chatID && (
                                                        <div className="absolute p-2 text-white bg-black rounded shadow-lg">
                                                            <button
                                                                className="flex gap-2 items-center"
                                                                onClick={() =>
                                                                    handlePinChat(
                                                                        chat.chatID
                                                                    )
                                                                }
                                                            >
                                                                {pinnedChats.includes(
                                                                    chat.chatID
                                                                ) ? (
                                                                    <>
                                                                        <BiSolidPin />
                                                                        <span>
                                                                            Unpin
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <BiPin />
                                                                        <span>
                                                                            Pin
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* CHANGE: Chat history amended with exclusion of pinned chats */}
                        <div className="flex overflow-auto flex-col gap-3 text-white">
                            {filteredChatHistory.map((session, index) => (
                                <div
                                    key={index}
                                    className="flex flex-col gap-1 mb-4"
                                >
                                    <div className="text-2xl font-semibold">
                                        {formatDate(session.date)}
                                    </div>
                                    {session.chat
                                        .filter(
                                            (chat) =>
                                                !pinnedChats.includes(
                                                    chat.chatID
                                                )
                                        ) // Exclude pinned chats
                                        .map((chat, idx) => (
                                            <div
                                                key={idx}
                                                className={`py-1 pl-5 ml-3 text-xl truncate rounded-full hover:bg-zinc-500 hover:cursor-pointer ${
                                                    selectedChatID ===
                                                    chat.chatID
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-transparent"
                                                }`}
                                                onClick={() =>
                                                    setSelectedChatID(
                                                        chat.chatID
                                                    )
                                                }
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span>{chat.title}</span>
                                                    <BiGridSmall
                                                    
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevents triggering the chat selection
                                                            setShowOptionsMenu(
                                                                showOptionsMenu ===
                                                                    chat.chatID
                                                                    ? null
                                                                    : chat.chatID
                                                            );
                                                        }}
                                                    />
                                                </div>
                                                {/* Options menu for pinning/unpinning */}
                                                {showOptionsMenu ===
                                                    chat.chatID && (
                                                    <div className="absolute p-2 text-white bg-black rounded shadow-lg">
                                                        <button
                                                            className="flex gap-2 items-center"
                                                            onClick={() =>
                                                                handlePinChat(
                                                                    chat.chatID
                                                                )
                                                            }
                                                        >
                                                            {pinnedChats.includes(
                                                                chat.chatID
                                                            ) ? (
                                                                <>
                                                                    <BiSolidPin />
                                                                    <span>
                                                                        Unpin
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <BiPin />
                                                                    <span>
                                                                        Pin
                                                                    </span>
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
                                                )}
                                            </div>
                                        ))}
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center text-3xl bg-sidebar">
                            {/* User name */}
                            <div className="flex-grow text-left">John Doe</div>
                            {/* Settings button */}
                            <button
                                className="text-3xl"
                                onClick={toggleOverlay}
                            >
                                <AiFillSetting />
                            </button>
                        </div>
                </>
                )}
            </div>

            {/* Toggle button */}
            <div className="content-center">
                <button
                    className="text-4xl text-white bg-primary"
                    onClick={toggleSidebar}
                >
                    {isSidebarVisible ? (
                        <BiChevronLeftCircle />
                    ) : (
                        <BiChevronRightCircle />
                    )}
                </button>
            </div>

            {/* Chat area */}
            <div className="flex flex-col mx-auto w-3/5">
                <div className="overflow-y-auto flex-grow p-4 text-2xl rounded-lg">
                    {/* Messages */}
                    {selectedChatID
                        ? detailedMessages.map((msg, index) => (
                              <div
                                  key={index}
                                  className={`mb-4 relative ${
                                      msg.user === "user"
                                          ? "text-right"
                                          : "text-left"
                                  } group`}
                              >
                                  <div
                                      className={`inline-block p-2 max-w-7xl break-words rounded-full px-7 ${
                                          msg.user === "user"
                                              ? "bg-zinc-500 text-white"
                                              : "bg-zinc-700 text-white"
                                      }`}
                                  >
                                      {msg.content}
                                      <div className="text-sm text-gray-400">
                                          {msg.date} {msg.time}
                                      </div>
                                  </div>
                                  {/* Feedback Button (Incomplete) */}
                                  {msg.user !== "user" && (
                                      <div className="relative">
                                          <div className="absolute left-0 top-full mt-2">
                                              <FeedbackButton />
                                          </div>
                                      </div>
                                  )}
                              </div>
                          ))
                        : messages.map((msg, index) => (
                              <div
                                  key={index}
                                  className={`mb-4 ${
                                      msg.sender === "user"
                                          ? "text-right"
                                          : "text-left"
                                  }`}
                              >
                                  <div
                                      className={`inline-block p-2 max-w-7xl break-words rounded-full px-7 ${
                                          msg.sender === "user"
                                              ? "bg-zinc-500 text-white"
                                              : "bg-zinc-700 text-white"
                                      }`}
                                  >
                                      {msg.text}
                                  </div>
                              </div>
                          ))}
                          
                </div>
                {/* Input bar */}
                <div className="flex gap-2 mt-4 text-xl">
                    {/* Input box */}
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyUp={(e) => e.key === "Enter" && handleSend()}
                        className="flex-grow p-3 mr-2 rounded-full border border-gray-300"
                        placeholder="Type your message..."
                    />
                    {/* Send button */}
                    <button
                        onClick={handleSend}
                        className="px-4 py-2 text-white bg-blue-500 rounded-lg"
                    >
                        Send
                    </button>
                    {/* Clear button */}
                    <button
                        onClick={handleClear}
                        className="px-4 py-2 text-white bg-red-500 rounded-lg"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Overlay with menus  */}
            {isOverlayVisible && (
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
                            <button className="text-2xl font-semibold">
                                Menu 1
                            </button>
                            <button className="text-2xl font-semibold">
                                Menu 2
                            </button>
                            <button className="text-2xl font-semibold">
                                Menu 3
                            </button>
                        </ul>
                        <div className="flex justify-end">
                            <button
                                className="text-3xl"
                                onClick={toggleOverlay}
                            >
                                <AiFillSetting />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatBot;