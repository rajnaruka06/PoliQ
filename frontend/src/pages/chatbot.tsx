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
    AiFillDelete,
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

interface Memory {
    memoryId: string;
    memoryContent: string;
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

    const [memories, setMemories] = useState<Memory[]>([]);
    const [showSettingsOverlay, setShowSettingsOverlay] = useState(false); // State to control visibility of settings overlay
    const [selectedOption, setSelectedOption] = useState<string | null>(null); // State to track which option is selected

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

    // Hero for welcome screen
    // TODO: If user click opt x, the content will be send as user input
    const hero = () => {
        return (
            <div className="flex flex-col flex-grow justify-center items-center h-full">
                <div className="text-5xl text-black text-text dark:text-white">
                    Welcome to PoliQ
                </div>
                <div className="flex gap-3 mt-4">
                    <button
                        className="text-2xl text-black bg-lightTertiary dark:bg-darkSecondary dark:text-white"
                        onClick={() =>
                            handleOptionClick(
                                "What is the age distribution demographic of Greens voters?"
                            )
                        }
                    >
                        What is the age distribution demographic of Greens
                        voters?
                    </button>
                    <button
                        className="text-2xl text-black bg-lightTertiary dark:bg-darkSecondary dark:text-white"
                        onClick={() =>
                            handleOptionClick(
                                "Which electorates of AEC did the Greens have most success in the recent election?"
                            )
                        }
                    >
                        Which electorates of AEC did the Greens have most
                        success in the recent election?
                    </button>
                    <button
                        className="text-2xl text-black bg-lightTertiary dark:bg-darkSecondary dark:text-white"
                        onClick={() =>
                            handleOptionClick(
                                "Which electorates in Victoria can the Greens improve their performance?"
                            )
                        }
                    >
                        Which electorates in Victoria can the Greens improve
                        their performance?
                    </button>
                    <button
                        className="text-2xl text-black bg-lightTertiary dark:bg-darkSecondary dark:text-white"
                        onClick={() =>
                            handleOptionClick(
                                "Which electorates in New South Wales can the Greens improve their performance?"
                            )
                        }
                    >
                        Which electorates in New South Wales can the Greens
                        improve their performance?
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
                  {/* Feedback Button */}
                  {msg.user !== "user" && (
                      <FeedbackButton
                          chatId={selectedChatID || ""} // Pass the selected chat ID
                          messageId={msg.messageID} // Pass the message ID
                          userId={userId} // Pass the user ID
                      />
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

    // Fetch memory data from memory.json
    useEffect(() => {
        const fetchMemories = async () => {
            try {
                const response = await fetch("../../public/memory.json");
                if (!response.ok) throw new Error("Failed to fetch memories");

                const data = await response.json();
                setMemories(data);
            } catch (error) {
                console.error("Error fetching memories:", error);
            }
        };

        fetchMemories();
    }, []);

    // Toggle Dark Mode
    const toggleDarkMode = () => {
        setIsDarkMode((prevMode) => !prevMode);
    };

    // Function to handle showing the settings overlay
    const handleShowSettingsOverlay = (option: string) => {
        setSelectedOption(option); // Update the selected option
        setShowSettingsOverlay(true); // Show the overlay
    };

    // Function to hide the settings overlay
    const handleHideSettingsOverlay = () => {
        setShowSettingsOverlay(false); // Hide the overlay
        setSelectedOption(null); // Reset the selected option
    };

    // Settings overlay for viewallchats, archivedchats, memory
    const settingsOptionsOverlay = () => {
        if (!showSettingsOverlay) return null;

        return (
            <div className="flex absolute top-1/2 left-1/2 flex-col gap-3 p-4 w-1/2 h-1/2 rounded-2xl transform -translate-x-1/2 -translate-y-1/2 bg-darkSecondary">
                <div className="relative h-full">
                    <div className="sticky p-2 mb-10 text-3xl font-semibold rounded-md bg-darkPrimary">
                        {selectedOption}
                    </div>
                    <div className="flex overflow-y-auto flex-col gap-3 p-2 bg-darkPrimary max-h-[calc(100%-10rem)] scrollbar-hide rounded-md">
                        {/* Content based on the selected option */}
                        {selectedOption === "Memory" &&
                            memories.map((memory) => (
                                <div
                                    key={memory.memoryId}
                                    className="flex justify-between text-2xl"
                                >
                                    <div className="truncate">
                                        {memory.memoryContent}
                                    </div>
                                    <div className="px-4 rounded-md cursor-pointer bg-darkSecondary hover:border">
                                        <AiFillDelete className="" />
                                    </div>
                                </div>
                            ))}
                        {/* Other options handling */}
                    </div>
                    <button
                        onClick={handleHideSettingsOverlay}
                        className="absolute right-0 bottom-0 px-2 text-xl rounded-md bg-darkPrimary"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
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
                    onOptionClick={handleShowSettingsOverlay}
                />

                {settingsOptionsOverlay()}
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
                    {!selectedChatID && hero()}

                    <div className="overflow-y-auto">
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
