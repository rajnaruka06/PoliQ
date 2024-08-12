import React, { useState, useEffect } from "react";

// Define an interface for the chat history data structure
interface ChatHistory {
    // Date of the chat session, formatted as a string
    date: string;
    // An array of chat objects, each containing a title string
    chat: { title: string; chatID: string }[];
}

interface MessageCurrent {
    sender: string;
    text: string;
}

interface MessageHistory {
    messageID: string;
    user: string;
    content: string;
    date: string;
    time: string;
}

const ChatBot: React.FC = () => {
    // State variable to store the chat messages
    const [messages, setMessages] = useState<MessageCurrent[]>([]);

    // State variable to store the user input
    const [input, setInput] = useState("");

    // State variable to store the chat history
    const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
    const [detailedMessages, setConvMessages] = useState<MessageHistory[]>([]);
    const [selectedChatID, setSelectedChatID] = useState<string | null>(null);

    // Function to handle sending messages
    const handleSend = () => {
        // Check if the input is not empty
        if (input.trim()) {
            // Add the user message to the messages array
            setMessages([...messages, { sender: "user", text: input }]);
            // Clear the input field
            setInput("");

            // Simulate a response from the model
            setTimeout(() => {
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { sender: "bot", text: "This is a response from the bot." },
                ]);
            }, 500);
        }
    };

    // Function to format date
    const formatDate = (dateString: string): string => {
        // Split the input date based on / separator
        const [day, month, year] = dateString.split("/");

        // Create a new Date object using the year, month, and day
        const date = new Date(`${year}-${month}-${day}`);

        // Format the date "DD Month YYYY"
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    // Fetch chat history
    const fetchChatHistory = async () => {
        try {
            // Fetch chat history from the JSON file
            const response = await fetch("/chat.json");
            // Parse the JSON response
            const data = await response.json();
            // Update chat history with the fetched data
            setChatHistory(data);
        } catch (error) {
            console.error("Error fetching chat history:", error);
        }
    };

    // Fetch messages from the selected chat ID
    const fetchMessages = async (chatID: string) => {
        try {
            const response = await fetch(`${chatID}.json`);
            const data = await response.json();
            setConvMessages(data);
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    // Fetch chat history from the JSON file
    useEffect(() => {
        fetchChatHistory();
    }, []);

    // If has chatID, fetch messages
    useEffect(() => {
        if (selectedChatID) {
            fetchMessages(selectedChatID);
            const interval = setInterval(() => {
                fetchMessages(selectedChatID);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [selectedChatID]);

    // Return
    return (
        // container for sidebar and chat area
        <div className="grid grid-cols-12 gap-4 p-4 w-screen h-screen bg-primary">
            {/* sidebar */}
            <div className="flex flex-col col-span-2 gap-10 p-4 rounded-lg shadow-lg bg-sidebar">
                {/* title */}
                <div className="text-5xl font-bold text-white">PoliQ Chat</div>
                {/* chat history */}
                <div className="flex flex-col gap-3 text-white">
                    {chatHistory.map((session, index) => (
                        <div key={index} className="flex flex-col gap-1 mb-4">
                            <div className="text-2xl font-semibold">
                                {formatDate(session.date)}
                            </div>
                            {session.chat.map((chat, idx) => (
                                <div
                                    key={idx}
                                    className="py-1 pl-5 ml-3 text-xl rounded-full hover:bg-zinc-500 hover:cursor-pointer"
                                    onClick={() =>
                                        setSelectedChatID(chat.chatID)
                                    }
                                >
                                    {chat.title}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* chat area */}
            <div className="flex flex-col col-span-10">
                {/* container for the query and response */}
                <div className="overflow-y-auto flex-grow p-4 text-2xl rounded-lg shadow-lg">
                    {selectedChatID
                        ? detailedMessages.map((msg, index) => (
                              <div
                                  key={index}
                                  className={`mb-4 ${
                                      msg.user === "user"
                                          ? "text-right"
                                          : "text-left"
                                  }`}
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
                {/* container for message field and send button */}
                <div className="flex mt-4 text-xl">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyUp={(e) => e.key === "Enter" && handleSend()}
                        className="flex-grow p-3 mr-2 rounded-full border border-gray-300"
                        placeholder="Type your message..."
                    />
                    <button
                        onClick={handleSend}
                        className="px-4 py-2 text-white bg-blue-500 rounded-lg"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatBot;
