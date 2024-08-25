import React, { useState, useEffect } from "react";
import {
    BiCopy,
    BiRefresh,
    BiConfused,
    BiData,
    BiBarChartSquare,
} from "react-icons/bi";
import Sidebar from "./sidebar";
//Priya 25/8/2024
import { AiOutlineArrowUp, AiOutlineClose, AiOutlinePaperClip, AiOutlineUpload } from "react-icons/ai";
// PMJ 23/8/2024: importing useHandleSend() from handleSend.tsx
//import { useHandleSend } from "../hooks/handleSend";
// PMJ 23/8/2024: importing useSendMessage.tsx and useFetchMessages.tsx
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
    // Priya 25/8/2024: Adding const for upload popup
    const [showPopup, setShowPopup] = useState(false); // adds state for popup visibility
//PMJ 23/8/2024: const for user_id
const user_id = "example_user_id"; // Update later with a user details hook

// PMJ 23/8/2024: Using useFetchMessages to fetch messages for the selected chat
const { messages: fetchedMessages, loading, error } = useFetchMessages(selectedChatID, user_id);

// PMJ 23/8/2024: Using useSendMessage to send messages
const { sendMessage, loading: sending, error: sendError } = useSendMessage(user_id);

const handleSend = async () => {
    if (input.trim()) {
        // Optimistically update the UI before sending the message
        setMessages([...messages, { sender: "user", text: input, user: "user" }]);

        // Send the message using the hook and await the response
        await sendMessage({ chat_id: selectedChatID, content: input });

        // Clear the input after sending
        setInput(""); 
    }
};

// Effect to update conversation messages when new messages are fetched
useEffect(() => {
    if (selectedChatID && fetchedMessages) {
        setConvMessages(fetchedMessages);
    }
}, [selectedChatID, fetchedMessages]);
    // // Function to fetch messages (right side)
    // const fetchChatMessages = async (chatID: string) => {
    //     try {
    //         const response = await fetch(`${chatID}.json`);
    //         const data = await response.json();
    //         setConvMessages(data);
    //     } catch (error) {
    //         console.error("Error fetching messages:", error);
    //     }
    // };

    // // Function to fetch messages
    // useEffect(() => {
    //     if (selectedChatID) {
    //         fetchChatMessages(selectedChatID);
    //         const interval = setInterval(() => {
    //             fetchChatMessages(selectedChatID);
    //         }, 1000);
    //         return () => clearInterval(interval);
    //     }
    // }, [selectedChatID]);

    // Function to render feedback button
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

    return (
        <div className="flex p-4 w-screen h-screen bg-primary">
            {/* sidebar.tsx */}
            <Sidebar
                selectedChatID={selectedChatID}
                setSelectedChatID={setSelectedChatID}
            />
            {/* Chat area */}
            <div className="flex flex-col mx-auto w-3/5">
                <div className="overflow-y-auto flex-grow p-4 text-2xl rounded-lg">
                    {/* TASK: need to refactor */}
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
                                              ? "bg-zinc-700 text-white"
                                              : " text-white"
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
                                              ? "bg-zinc-700 text-white"
                                              : " text-white"
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
                     <div className="relative flex-grow">
                        {showPopup && ( // Conditional rendering for the popup
                        <div className="absolute z-10 bg-white border rounded shadow-lg p-2 bottom-full mb-2 w-80">
                        <button onClick={() => setShowPopup(false)} className="text-gray-300 text-sm absolute right-2 top-2">
                        <AiOutlineClose className="text-sm" /> {/* Cross icon to close the popup */}
                        </button>
                        <button
                                className="flex items-center font-bold text-sm"
                                onClick={() => document.getElementById('fileInput')?.click()} // Trigger file input click
                        >
                         <AiOutlineUpload className="mr-1" /> {/* Upload icon with margin */}
                         Upload Dataset
                        </button>
                        <input type="file" id="fileInput" className="hidden" onChange={(e) => {
                        // Handle file selection here
                        const file = e.target.files?.[0];
                        if (file) {
                        console.log("Selected file:", file.name);
                        // Add further processing for the selected file
                    }
                }}
            />
            </div>
                )}
                <AiOutlinePaperClip
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-3xl cursor-pointer"
                                    onClick={() => setShowPopup(true)} // Show popup on click of the paperclip icon
                /> {/* Add the icon */}
                <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)} // Update input state on change
                            onKeyUp={(e) => e.key === "Enter" && handleSend()} // Send message on Enter key press
                            className="flex-grow w-full p-3 pl-10 pr-3 rounded-full border border-gray-300" // Set width to increase length
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
