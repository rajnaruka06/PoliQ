import React, { useState, useEffect } from "react";
import {
    BiCopy,
    BiRefresh,
    BiConfused,
    BiData,
    BiBarChartSquare,
} from "react-icons/bi";
import Sidebar from "./sidebar";
import {
    AiOutlineArrowUp,
    AiOutlineClose,
    AiOutlinePaperClip,
    AiOutlineUpload,
} from "react-icons/ai";

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
    const user_id = "example_user_id"; // Update later with a user details hook

    // PMJ 23/8/2024: Using useFetchMessages to fetch messages for the selected chat
    const {
        messages: fetchedMessages,
        loading,
        error,
    } = useFetchMessages(selectedChatID, user_id);

    // PMJ 23/8/2024: Using useSendMessage to send messages
    const {
        sendMessage,
        loading: sending,
        error: sendError,
    } = useSendMessage(user_id);

    const handleSend = async () => {
        if (input.trim()) {
            // Optimistically update the UI before sending the message
            setMessages([
                ...messages,
                { sender: "user", text: input, user: "user" },
            ]);

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

    return (
        <div className="flex p-4 w-screen h-screen bg-primary">
            {/* sidebar.tsx */}
            <Sidebar
                selectedChatID={selectedChatID}
                setSelectedChatID={setSelectedChatID}
            />

            {/* Chat area */}
            <div className="flex flex-col mx-auto w-3/5">
                {/* hero */}

                {!selectedChatID && hero()}
                <div className="overflow-y-auto flex-grow p-4 text-2xl rounded-lg">
                    {/* TODO: need to refactor */}
                    {/* FIXME: rounded bug if message too long */}
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
                            // TODO: Update visualisation
                            // TODO: Highlight when hover
                            // FIXME: if click icon again, close
                            // FIXME: if click anywhere, close
                            <div className="absolute bottom-full z-10 p-2 mb-2 w-80 bg-white rounded border shadow-lg">
                                <button
                                    onClick={() => setShowPopup(false)}
                                    className="absolute top-2 right-2 text-sm text-gray-300"
                                >
                                    <AiOutlineClose className="text-sm" />{" "}
                                    {/* Cross icon to close the popup */}
                                </button>
                                <button
                                    className="flex items-center text-sm font-bold"
                                    onClick={() =>
                                        document
                                            .getElementById("fileInput")
                                            ?.click()
                                    } // Trigger file input click
                                >
                                    <AiOutlineUpload className="mr-1" />{" "}
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
                                            console.log(
                                                "Selected file:",
                                                file.name
                                            );
                                            // Add further processing for the selected file
                                        }
                                    }}
                                />
                            </div>
                        )}
                        <AiOutlinePaperClip
                            className="absolute left-3 top-1/2 text-3xl text-gray-500 transform -translate-y-1/2 cursor-pointer"
                            onClick={() => setShowPopup(true)} // Show popup on click of the paperclip icon
                        />{" "}
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
