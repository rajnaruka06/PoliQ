import React, { useRef, useState, useEffect } from "react";
// oi add this
import Sidebar from "./sidebar.tsx";
import {
    AiOutlineArrowUp,
    AiOutlineClose,
    AiOutlinePaperClip,
    AiOutlineUpload,
    AiFillSun,
    AiFillMoon,
} from "react-icons/ai";
import FeedbackButton from "../components/FeedbackButton.tsx";
import { useSendMessage } from "../hooks/useSendMessage";
import { useFetchMessages } from "../hooks/useFetchMessages";
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
    const [detailedMessages, setConvMessages] = useState<MessageHistory[]>([]);
    const [selectedChatID, setSelectedChatID] = useState<string | null>(null);
    const [showPopup, setShowPopup] = useState(false); // adds state for popup visibility
    const userId = "example_user_id"; // Update later with a user details hook
    const popupRef = useRef<HTMLDivElement | null>(null); // Reference for the popup
    const paperclipRef = useRef<HTMLDivElement | null>(null); // Reference for the paperclip icon
    const [showRegionDropdown, setShowRegionDropdown] = useState(false); // State for Region dropdown
    const [showLevelsDropdown, setShowLevelsDropdown] = useState(false); // State for Levels dropdown
    const [searchRegion, setSearchRegion] = useState(""); // State for region search
    const [searchLevel, setSearchLevel] = useState(""); // State for level search
    const toggleRegionDropdown = () => {
        setShowRegionDropdown((prev) => !prev);
        setShowLevelsDropdown(false); // Close Levels dropdown if open
    };
    const toggleLevelsDropdown = () => {
        setShowLevelsDropdown((prev) => !prev);
        setShowRegionDropdown(false); // Close Region dropdown if open
    };
    // Sample data for dropdown options
    const regions = [
        "Region 1",
        "Region 2",
        "Region 3",
        "Region 4",
        "Region 5",
        "Region 6",
        "Region 7",
        "Region 8",
        "Region 9",
        "Region 10",
        "Region 11",
        "Region 12",
        "Region 13",
        "Region 14",
        "Region 15",
        "Region 16",
        "Region 17",
        "Region 18",
        "Region 19",
        "Region 20",
    ];
    const levels = [
        "Level 1",
        "Level 2",
        "Level 3",
        "Level 4",
        "Level 5",
        "Level 6",
        "Level 7",
        "Level 8",
        "Level 9",
        "Level 10",
        "Level 11",
        "Level 12",
        "Level 13",
        "Level 14",
        "Level 15",
        "Level 16",
        "Level 17",
        "Level 18",
        "Level 19",
        "Level 20",
    ];

    // Function to render level and region dropdowns
    const LevelRegions = () => {
        return (
            <div className="flex relative gap-2 mx-5 mt-auto mb-2">
                <button
                    onClick={toggleLevelsDropdown}
                    className="w-32 p-3 bg-lightTertiary dark:bg-darkSecondary rounded-full text-white"
                >
                    Levels
                </button>
                <button
                    onClick={toggleRegionDropdown}
                    className="w-32 p-3 bg-lightTertiary dark:bg-darkSecondary rounded-full text-white"
                >
                    Region
                </button>
                {showRegionDropdown && (
                    <div className="absolute bottom-full mb-2 w-64 bg-white rounded shadow-lg dark:bg-darkPrimary">
                        <input
                            type="text"
                            placeholder="Search Region..."
                            value={searchRegion}
                            onChange={(e) => setSearchRegion(e.target.value)}
                            className="p-2 mb-2 w-full rounded border border-gray-300"
                        />
                        <ul className="overflow-y-auto p-2 max-h-48">
                            {regions
                                .filter((region) =>
                                    region
                                        .toLowerCase()
                                        .includes(searchRegion.toLowerCase())
                                )
                                .map((region, index) => (
                                    <li
                                        key={index}
                                        className="px-2 py-1 text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                                    >
                                        {region}
                                    </li>
                                ))}
                        </ul>
                    </div>
                )}
                {showLevelsDropdown && (
                    <div className="absolute bottom-full mb-2 w-64 bg-white rounded shadow-lg dark:bg-darkPrimary">
                        <input
                            type="text"
                            placeholder="Search Level..."
                            value={searchLevel}
                            onChange={(e) => setSearchLevel(e.target.value)}
                            className="p-2 mb-2 w-full rounded border border-gray-300"
                        />
                        <ul className="overflow-y-auto p-2 max-h-48">
                            {levels
                                .filter((level) =>
                                    level
                                        .toLowerCase()
                                        .includes(searchLevel.toLowerCase())
                                )
                                .map((level, index) => (
                                    <li
                                        key={index}
                                        className="px-2 py-1 text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                                    >
                                        {level}
                                    </li>
                                ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    const [isDarkMode, setIsDarkMode] = useState(() => {
        // Dark mode state
        // Check local storage or use system preference
        if (localStorage.getItem("theme")) {
            return localStorage.getItem("theme") === "dark";
        }
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    });
    // Using useFetchMessages to fetch messages for the selected chat
    const {
        messages: fetchedMessages,
        loading,
        error,
    } = useFetchMessages(selectedChatID, userId);
    // Using useSendMessage to send messages
    const {
        sendMessage,
        loading: sending,
        error: sendError,
    } = useSendMessage(userId);
    // Reference for the popup
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popupRef.current &&
                !popupRef.current.contains(event.target as Node) && // Check if click is outside the popup
                !(
                    paperclipRef.current &&
                    paperclipRef.current.contains(event.target as Node)
                ) // Check if click is on the paperclip icon
            ) {
                setShowPopup(false); // Close the popup if clicked outside
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        // Cleanup event listener when component unmounts
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [popupRef, paperclipRef]);
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [isDarkMode]);
    // New handleSend to use the correct format and reflect messages immediately.
    const handleSend = async () => {
        if (input.trim()) {
            // Optimistically add the user's message to the UI
            setMessages([
                ...messages,
                { sender: "user", text: input, user: "user" },
            ]);
            // Send the message using the hook and await the response
            await sendMessage({ chatId: selectedChatID || "", content: input });
            // Fetch the latest messages for the selected chat after sending
            if (selectedChatID) {
                const updatedMessages =
                    await fetchUpdatedMessages(selectedChatID);
                setConvMessages(updatedMessages);
            }
            // Clear the input after sending
            setInput("");
        }
    };
    // New fetchUpdatedMessages to retrieve updated messages after handleSend
    const fetchUpdatedMessages = async (chatId: string) => {
        // Call the same logic you use to fetch messages, which could be
        // reused from your `useFetchMessages` hook
        const response = await fetch(
            `http://localhost:8000/api/chats/${chatId}/messages?userId=${userId}`
        );
        if (!response.ok) throw new Error("Failed to fetch messages");
        const data: MessageHistory[] = await response.json();
        return data;
    };
    // Effect to update conversation messages when new messages are fetched
    useEffect(() => {
        if (selectedChatID && fetchedMessages) {
            setConvMessages(fetchedMessages);
        }
    }, [selectedChatID, fetchedMessages]);
    // Hero for welcome screen
    // TODO: If user click opt x, the content will be send as user input
    const hero = () => {
        return (
            <div className="flex flex-col flex-grow justify-center items-center h-full">
                <div className="text-5xl text-black text-text dark:text-white">
                    Hello World
                </div>
                <div className="flex gap-3 mt-4">
                    <button className="text-2xl text-black bg-lightTertiary dark:bg-darkSecondary dark:text-white">
                        Opt 1
                    </button>
                    <button className="text-2xl text-black bg-lightTertiary dark:bg-darkSecondary dark:text-white">
                        Opt 2
                    </button>
                    <button className="text-2xl text-black bg-lightTertiary dark:bg-darkSecondary dark:text-white">
                        Opt 3
                    </button>
                    <button className="text-2xl text-black bg-lightTertiary dark:bg-darkSecondary dark:text-white">
                        Opt 4
                    </button>
                </div>
            </div>
        );
    };
    // Chat Area right hand side
    // TODO: need to change logic
    // FIXME: rounded bug if message too long
    const ChatArea = selectedChatID
        ? detailedMessages.map((msg, index) => (
              <div
                  key={index}
                  className={`mb-4 relative ${
                      msg.user === "user" ? "text-right" : "text-left"
                  } group`}
              >
                  <div
                      className={`inline-block p-2 max-w-7xl break-words rounded-xl px-7 ${
                          msg.user === "user"
                              ? "bg-lightTertiary text-black dark:text-white dark:bg-darkSecondary"
                              : "text-black dark:text-white dark:bg-darkPrimary bg-lightPrimary"
                      } text-justify`} // Added text-justify for justification
                  >
                      {msg.content}
                      <div className="text-sm text-gray-400">
                          {msg.date} {msg.time}
                      </div>
                  </div>
                  {/* Feedback Button */}
                  {msg.user !== "user" && <FeedbackButton />}
              </div>
          ))
        : messages.map((msg, index) => (
              <div
                  key={index}
                  className={`mb-4 ${
                      msg.sender === "user" ? "text-right" : "text-left"
                  }`}
              >
                  <div
                      className={`inline-block p-2 max-w-7xl break-words rounded-xl px-7 ${
                          msg.sender === "user"
                              ? "bg-zinc-700 text-white"
                              : " text-white"
                      } text-justify`} // Added text-justify for justification
                  >
                      {msg.text}
                  </div>
              </div>
          ));
    // Popup for Upload File
    const UploadPopup = showPopup && (
        // TODO: Highlight icon when hover
        <div
            ref={popupRef}
            className="absolute bottom-full z-10 p-2 mb-2 rounded-2xl shadow-lg bg-lightSecondary dark:bg-darkSecondary dark:text-white"
        >
            {/* Upload Button */}
            <button
                className="flex gap-2 items-center p-2 text-xl font-semibold rounded-lg bg-lightSecondary dark:bg-darkSecondary"
                onClick={() => document.getElementById("fileInput")?.click()} // Trigger file input click
            >
                <AiOutlineUpload className="text-black dark:text-white" />
                {/* Upload icon with margin */}
                <div className="text-black dark:text-white">Upload Dataset</div>
            </button>
            <input
                type="file"
                id="fileInput"
                className="hidden"
                onChange={(e) => {
                    // Handle file selection here
                    const file = e.target.files?.[0];
                    if (file) {
                        console.log("Selected file:", file.name);
                        // Add further processing for the selected file
                    }
                }}
            />
        </div>
    );
    // Toggle Dark Mode
    const toggleDarkMode = () => {
        setIsDarkMode((prevMode) => !prevMode);
    };
    // Return
    return (
        <div className={`${isDarkMode && "dark"}`}>
            <div className="flex p-4 w-screen h-screen bg-white dark:bg-darkPrimary">
                {/* sidebar.tsx */}
                <Sidebar
                    selectedChatID={selectedChatID}
                    setSelectedChatID={setSelectedChatID}
                    setMessages={setMessages} //passes setMessages as a prop
                />
                {/*Levels and Regions */}
                <LevelRegions /> {/* Call the LevelRegions function here */}
                {/* Chat area */}
                <div className="flex flex-col mx-auto w-3/5">
                    {/* light dark mode button */}
                    <button
                        onClick={toggleDarkMode}
                        className={`absolute top-4 right-4 p-2 text-xl rounded-full ${isDarkMode ? "text-yellow-300 bg-darkPrimary" : "text-gray-400 bg-lightPrimary"} rounded`}
                    >
                        {isDarkMode ? <AiFillSun /> : <AiFillMoon />}
                    </button>
                    {/* Hero for welcoming page */}
                    {!selectedChatID && hero()}
                    <div className="overflow-y-auto flex-grow p-4 text-2xl rounded-lg">
                        {/* Messages */}
                        {ChatArea}
                    </div>
                    {/* Input bar */}
                    <div className="flex gap-2 mt-4 text-xl">
                        {/* Input box */}
                        <div className="relative flex-grow">
                            {UploadPopup}
                            <div ref={paperclipRef}>
                                <AiOutlinePaperClip
                                    className="absolute left-3 top-1/2 text-2xl text-white transform -translate-y-1/2 cursor-pointer"
                                    onClick={(event) => {
                                        event.stopPropagation(); // Prevent click from bubbling up to the document
                                        setShowPopup((prev) => !prev); // Toggle the popup visibility
                                    }}
                                />
                            </div>
                            {/* Input Area */}
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)} // Update input state on change
                                onKeyUp={(e) =>
                                    e.key === "Enter" && handleSend()
                                } // Send message on Enter key press
                                className="flex-grow p-3 pr-3 pl-12 w-full text-black rounded-full bg-lightTertiary dark:bg-darkSecondary dark:text-white"
                                placeholder="Type your message..."
                            />
                        </div>
                        {/* Send button */}
                        <button
                            onClick={handleSend}
                            className="px-4 py-2 text-black rounded-full bg-lightTertiary dark:bg-darkSecondary dark:text-white"
                        >
                            <AiOutlineArrowUp />
                        </button>
                        {/* Clear button */}
                        <button
                            onClick={() => setInput("")}
                            className="px-4 py-2 text-black rounded-full bg-lightTertiary dark:bg-darkSecondary dark:text-white"
                        >
                            <AiOutlineClose />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default ChatBot;
