import React, { useState } from "react";
// adding this 
import {
    BiCopy,
    BiRefresh,
    BiConfused,
    BiData,
    BiBarChartSquare,
} from "react-icons/bi";
import axios from "axios";
// importing hook for regenerate chat called useUpdateMessage
import { useUpdateMessage } from "../hooks/useUpdateMessage";

// creating interface for FeedbackButtonProps
interface FeedbackButtonProps {
    chatId: string;
    messageId: string;
    userId: string;
}


const FeedbackButton: React.FC<FeedbackButtonProps> = ({ chatId, messageId, userId }) => {
    const [showPopup, setShowPopup] = useState(false);
// Use the custom hook
const { updateMessage, loading, error } = useUpdateMessage(userId);


    // Function to handle the confused icon click
    const handleConfusedClick = () => {
        setShowPopup(true); // Show the popup when the button is clicked
        setTimeout(() => {
            setShowPopup(false); // Hide the popup after 3 seconds
        }, 3000);
    };

    // Function to handle the refresh icon click
    const handleRefreshClick = async () => {
        const newContent = "Updated content to regenerate"; // Example content; replace with actual logic
        await updateMessage(chatId, messageId, newContent); // Use the hook to call the API
    };


    return (
        <div className="relative">
            <div className="absolute left-0 top-full mt-2">
                <div className="flex gap-1 p-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {/* Copy Icon */}
                    <button className="px-1 py-1 text-white bg-blue-500 rounded-full">
                        {/* CHANGE TODO: Allow user to copy response to clipboard */}
                        <BiCopy className="text-xl" />
                    </button>
                    {/* Refresh Icon */}
                    <button
                        className="px-1 py-1 text-white bg-green-500 rounded-full"
                        onClick={handleRefreshClick} // Call the refresh handler
                        disabled={loading} // Disable button when loading
                    >
                        <BiRefresh className="text-xl" />
                    </button>
                    {/* Confused Icon */}
                    <button className="px-1 py-1 text-white bg-red-500 rounded-full"
                    onClick={handleConfusedClick}
                    >
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
            </div>
            {/* Confused icon click popup message  */}
            {showPopup && (
                <div className="absolute top-0 left-0 mt-8 ml-10 p-4 bg-red-500 text-white rounded shadow-lg">
                    ☹️ I am sorry you didn't like this response. I will do better next time boss!
                </div>
            )}
        </div>
    );
};

export default FeedbackButton;
