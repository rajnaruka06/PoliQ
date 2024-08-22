import React, { useState, useEffect } from "react";
import {
    BiCopy,
    BiRefresh,
    BiConfused,
    BiData,
    BiBarChartSquare,
} from "react-icons/bi";
import Sidebar from "./sidebar";
import { AiOutlineArrowUp, AiOutlineClose } from "react-icons/ai";

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

    // Function to fetch messages (right side)
    const fetchChatMessages = async (chatID: string) => {
        try {
            const response = await fetch(`${chatID}.json`);
            const data = await response.json();
            setConvMessages(data);
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    // Function to fetch messages
    useEffect(() => {
        if (selectedChatID) {
            fetchChatMessages(selectedChatID);
            const interval = setInterval(() => {
                fetchChatMessages(selectedChatID);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [selectedChatID]);

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
