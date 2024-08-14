import React, { useState, useEffect } from "react";
import { AiOutlineArrowRight } from 'react-icons/ai';
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official"; 

interface ChatHistory {
    date: string;
    chat: { title: string }[];
}

const ChatBot: React.FC = () => {
    const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
    const [input, setInput] = useState("");
    const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const [chartOptions, setChartOptions] = useState({
        title: {
            text: 'Dummy Data Chart'
        },
        series: [
            {
                name: 'Dummy Series',
                data: [1, 2, 3, 4, 5]
            }
        ]
    });

    const handleSend = () => {
        if (input.trim()) {
            setMessages([...messages, { sender: "user", text: input }]);
            setInput("");

            if (input.toLowerCase() === "show chart") {
                setChartOptions({
                    title: {
                        text: 'Updated Chart Data'
                    },
                    series: [
                        {
                            name: 'Updated Series',
                            data: [10, 20, 30, 40, 50]
                        }
                    ]
                });
            }

            setTimeout(() => {
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { sender: "bot", text: "This is a response from the bot." },
                ]);
            }, 500);
        }
    };

    const formatDate = (dateString: string): string => {
        const [day, month, year] = dateString.split("/");
        const date = new Date(`${year}-${month}-${day}`);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    useEffect(() => {
        const fetchChatHistory = async () => {
            try {
                const response = await fetch("/chat.json");
                const data = await response.json();
                setChatHistory(data);
            } catch (error) {
                console.error("Error fetching chat history:", error);
            }
        };
        fetchChatHistory();
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen(prevState => !prevState);
    };

    const handleClearChat = () => {
        setMessages([]);
    };

    return (
        <div className="relative w-screen h-screen bg-grey">
            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-full transition-transform duration-300 ${
                    isSidebarOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full"
                }`}
                style={{ zIndex: 1000, overflowX: 'hidden' }}
            >
                <div className="flex flex-col h-full gap-10 p-4 rounded-lg shadow-lg bg-sidebar">
                    {/* Title */}
                    <div className="flex items-center text-5xl text-white">
                        <span className={`mr-2 ${isSidebarOpen ? "block" : "hidden"}`}>PoliQ Chat</span>
                    </div>
                    {/* Chat history */}
                    <div className="flex flex-col gap-3 text-white">
                        {chatHistory.map((session, index) => (
                            <div key={index} className="flex flex-col gap-1 mb-4">
                                <div className="text-2xl font-semibold">
                                    {formatDate(session.date)}
                                </div>
                                {session.chat.map((chat, idx) => (
                                    <div key={idx} className="ml-5 text-xl">
                                        {chat.title}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Chat area */}
            <div className={`flex flex-col h-full transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0"}`}>
                <div className="relative flex-grow p-4 overflow-y-auto text-2xl rounded-lg shadow-lg">
                    {messages.map((msg, index) => (
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

                    {/* Display Chart */}
                    {messages.some(msg => msg.text.toLowerCase() === "show chart") && (
                        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
                    )}
                </div>

                {/* Input area */}
                <div className="relative flex mt-4 mx-auto w-full max-w-md">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyUp={(e) => e.key === "Enter" && handleSend()}
                        className="flex-grow p-3 pr-24 border border-white border-gray-300 bg-grey text-white rounded-full text-sm"
                        placeholder="Type your message..."
                    />
                     <button
                    onClick={handleSend}
                    className="absolute right-0 top-0 bottom-0 flex items-center justify-center px-4 py-2 text-white bg-grey-400 rounded-full"
                    style={{ width: '6rem' }}
                >
                    <AiOutlineArrowRight className="text-2xl text-grey" />
                </button>
                </div>

                {/* Clear Chat Button */}
                <button
                    onClick={handleClearChat}
                    className="fixed bottom-4 right-4 p-3 bg-red-500 text-white rounded-full shadow-lg z-50"
                >
                    Clear Chat
                </button>

                {/* Toggle Sidebar Button */}
                <button
                    onClick={toggleSidebar}
                    className="fixed top-4 right-4 p-3 bg-white text-black rounded-full shadow-lg z-50"
                >
                    {isSidebarOpen ? <HiChevronLeft /> : <HiChevronRight />}
                </button>
            </div>
        </div>
    );
};

export default ChatBot;
