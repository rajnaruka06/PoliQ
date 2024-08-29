import React, { useRef, useState, useEffect } from "react";

import Sidebar from "./sidebar.tsx";
import {
    AiOutlineArrowUp,
    AiOutlineClose,
    AiOutlinePaperClip,
    AiOutlineUpload,
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
                !popupRef.current.contains(event.target as Node) // Check if click is outside the popup
            ) {
                setShowPopup(false); // Close the popup if clicked outside
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        // Cleanup event listener when component unmounts
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [popupRef]);

    // New handleSend to use the correct format and reflect messages immediately.
    const handleSend = async () => {
        if (input.trim()) {
            // Optimistically add the user's message to the UI
            setMessages([
                ...messages,
                { sender: "user", text: input, user: "user" },
            ]);
    
            // Send the message using the hook and await the response
            await sendMessage({ chatId: selectedChatID || '', content: input });
    
            // Fetch the latest messages for the selected chat after sending
            if (selectedChatID) {
                const updatedMessages = await fetchUpdatedMessages(selectedChatID);
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
        const response = await fetch(`http://localhost:8000/api/chats/${chatId}/messages?userId=${userId}`);
        
        if (!response.ok) throw new Error('Failed to fetch messages');
        
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
    const hero = () => {
        return (
            <div className="flex flex-col flex-grow justify-center items-center h-full">
                <div className="text-5xl">Hello World</div>
                <div className="flex gap-3 mt-4">
                    <button className="text-2xl">Opt 1</button>
                    <button className="text-2xl">Opt 2</button>
                    <button className="text-2xl">Opt 3</button>
                    <button className="text-2xl">Opt 4</button>
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
                      className={`inline-block p-2 max-w-7xl break-words rounded-full px-7 ${
                          msg.user === "user"
                              ? "bg-zinc-700 text-white"
                              : " text-white"
                      }`}
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
                      className={`inline-block p-2 max-w-7xl break-words rounded-full px-7 ${
                          msg.sender === "user"
                              ? "bg-zinc-700 text-white"
                              : " text-white"
                      }`}
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
            className="absolute bottom-full z-10 p-2 mb-2 rounded shadow-lg"
        >
            {/* Upload Button */}
            <button
                className="flex gap-2 items-center text-xl font-bold"
                onClick={() => document.getElementById("fileInput")?.click()} // Trigger file input click
            >
                <AiOutlineUpload />
                {/* Upload icon with margin */}
                Upload Dataset
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

    // Return
    return (
        <div className="flex p-4 w-screen h-screen bg-primary">
            {/* sidebar.tsx */}
            <Sidebar
                selectedChatID={selectedChatID}
                setSelectedChatID={setSelectedChatID}
                setMessages={setMessages} //passes setMessages as a prop
            />

            {/* Chat area */}
            <div className="flex flex-col mx-auto w-3/5">
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
                        {/* FIXME: Upload popup when click paperclip can't close */}
                        <AiOutlinePaperClip
                            className="absolute left-3 top-1/2 text-2xl text-white transform -translate-y-1/2 cursor-pointer"
                            onClick={() => setShowPopup(true)} // Show popup on click of the paperclip icon
                        />
                        {/* Add the icon */}
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)} // Update input state on change
                            onKeyUp={(e) => e.key === "Enter" && handleSend()} // Send message on Enter key press
                            className="flex-grow p-3 pr-3 pl-10 w-full rounded-full border border-gray-300" // Set width to increase length
                            placeholder="Type your message..." // Placeholder text for the input
                        />
                    </div>
                    {/* Send button */}
                    <button
                        onClick={handleSend}
                        className="px-4 py-2 font-extrabold text-white rounded-full"
                    >
                        <AiOutlineArrowUp />
                    </button>
                    {/* Clear button */}
                    <button
                        onClick={() => setInput("")}
                        className="px-4 py-2 text-white rounded-full"
                    >
                        <AiOutlineClose />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatBot;
