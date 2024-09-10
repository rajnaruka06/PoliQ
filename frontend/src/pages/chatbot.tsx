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
import SettingsOptionOverlay from "../components/SettingsOptionOverlay.tsx";
import Hero from "../components/Hero.tsx";

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
    const [showHero, setShowHero] = useState(true);
    const [levels, setLevels] = useState<string[]>([]); // Initialize state for levels
    const [regions, setRegions] = useState<string[]>([]); // Initialize state for regions

    const toggleRegionDropdown = () => {
        setShowRegionDropdown((prev) => !prev);
        setShowLevelsDropdown(false); // Close Levels dropdown if open
    };
    const toggleLevelsDropdown = () => {
        setShowLevelsDropdown((prev) => !prev);
        setShowRegionDropdown(false); // Close Region dropdown if open
    };

    // Levels fetch
    useEffect(() => {
        const fetchLevels = async () => {
            const response = await fetch("../../public/levels.json"); // Fetch levels from JSON
            const data = await response.json();
            setLevels(data.levels); // Set levels from fetched data
        };
        fetchLevels(); // Call the fetch function
    }, []); // Empty dependency array to run once on mount

    // Regions fetch
    useEffect(() => {
        const fetchRegions = async () => {
            const response = await fetch("../../public/regions.json"); // Fetch regions from JSON
            const data = await response.json();
            setRegions(data.regions); // Set regions from fetched data
        };
        fetchRegions(); // Call the fetch function
    }, []); // Empty dependency array to run once on mount

    // Function to render level and region dropdowns
    const LevelRegions = () => {
        return (
            <div className="flex relative gap-2 mx-5 mt-auto mb-2">
                <button
                    onClick={toggleLevelsDropdown}
                    className="p-3 w-32 text-white rounded-full bg-lightTertiary dark:bg-darkSecondary"
                >
                    Levels
                </button>
                <button
                    onClick={toggleRegionDropdown}
                    className="p-3 w-32 text-white rounded-full bg-lightTertiary dark:bg-darkSecondary"
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
        // commented to remove red prompt
        // loading,
        // error,
    } = useFetchMessages(selectedChatID, userId);
    // Using useSendMessage to send messages
    const {
        sendMessage,
        // commented to remove red prompt
        // loading: sending,
        // error: sendError,
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
        setShowHero(false);

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

    // Sends predefined questions as messages upon click
    const handleOptionClick = async (optionText: string) => {
        setShowHero(false);
        // Adds the message
        setMessages([
            ...messages,
            { sender: "user", text: optionText, user: "user" },
        ]);

        // Send the message using the sendMessage hook and await the response
        await sendMessage({
            chatId: selectedChatID || "",
            content: optionText,
        });

        // Fetch the latest messages for the selected chat after sending
        if (selectedChatID) {
            const updatedMessages = await fetchUpdatedMessages(selectedChatID);
            setConvMessages(updatedMessages);
        }
    };
    // Chat Area right hand side
    // TODO: need to change logic
    const ChatArea = selectedChatID
        ? detailedMessages.map((msg, index) => (
              <div
                  key={index}
                  className={`mb-4 relative ${
                      msg.user === "user" ? "text-right" : "text-left"
                  } group`}
              >
                  <div
                      className={`inline-block p-2 break-words rounded-xl px-7 ${
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
                  {/* Copy and Feedback Buttons */}
                  {msg.user !== "user" && (
                      <div className="flex gap-2 mt-2">
                          <FeedbackButton
                              chatId={selectedChatID || ""}
                              messageId={msg.messageID}
                              userId={userId}
                              content={msg.content} // Pass the content for the copy functionality
                          />
                      </div>
                  )}
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

    const [showSettingsOverlay, setShowSettingsOverlay] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    const handleSettingsOverlay = (option: string | null) => {
        if (option) {
            setSelectedOption(option);
            setShowSettingsOverlay(true);
        } else {
            setShowSettingsOverlay(false);
            setSelectedOption(null);
        }
    };

    // Return
    return (
        <div className={`${isDarkMode && "dark"}`}>
            <div className="flex p-4 w-screen h-screen bg-white dark:bg-darkPrimary">
                {/* sidebar.tsx */}
                <Sidebar
                    selectedChatID={selectedChatID}
                    setSelectedChatID={setSelectedChatID}
                    setMessages={setMessages}
                    onOptionClick={handleSettingsOverlay}
                />
                {/* Settings Option Overlay */}
                <SettingsOptionOverlay
                    showSettingsOverlay={showSettingsOverlay}
                    handleSettingsOverlay={handleSettingsOverlay}
                    selectedOption={selectedOption}
                />
                {/*Levels and Regions */}
                <LevelRegions /> {/* Call the LevelRegions function here */}
                {/* Chat area */}
                <div className="flex flex-col w-full">
                    {/* light dark mode button */}
                    <button
                        onClick={toggleDarkMode}
                        className={`absolute top-4 right-9 p-2 text-2xl rounded-full ${isDarkMode ? "text-yellow-300 bg-darkPrimary" : "text-gray-400 bg-lightPrimary"} rounded`}
                    >
                        {isDarkMode ? <AiFillSun /> : <AiFillMoon />}
                    </button>
                    {/* Hero for welcoming page */}
                    {showHero && !selectedChatID && (
                        <Hero handleOptionClick={handleOptionClick} />
                    )}

                    <div className="flex overflow-y-auto flex-col flex-grow">
                        {/* Chat Area Container */}
                        <div className="mx-auto w-full max-w-7xl">
                            {ChatArea}
                        </div>
                    </div>

                    {/* Input bar */}
                    <div className="flex gap-2 mx-auto mt-4 w-full max-w-7xl text-xl">
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
