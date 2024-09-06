import React, { useState } from "react";
// oi add this
import {
    BiCopy,
    BiRefresh,
    BiConfused,
    BiData,
    BiBarChartSquare,
} from "react-icons/bi";
// importing hook for regenerate chat called useUpdateMessage
import { useUpdateMessage } from "../hooks/useUpdateMessage";

// creating interface for FeedbackButtonProps
interface FeedbackButtonProps {
    chatId: string;
    messageId: string;
    userId: string;
}

const FeedbackButton: React.FC<FeedbackButtonProps> = ({
    chatId,
    messageId,
    userId,
}) => {
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState(""); // New state for the popup message
    const { updateMessage, loading, error } = useUpdateMessage(userId);

    // Function to handle the test message click
    const handleTestMessage = () => {
        setPopupMessage("✅ This is a test message.");
        setShowPopup(true);
        setTimeout(() => {
            setShowPopup(false);
        }, 3000);
    };

    // Function to handle the confused icon click
    const handleConfusedClick = () => {
        setPopupMessage(
            "☹️ I am sorry you didn't like this response. I will do better next time boss!"
        );
        setShowPopup(true);
        setTimeout(() => {
            setShowPopup(false);
        }, 3000);
    };

    // Function to handle the refresh icon click
    const handleRefreshClick = async () => {
        const newContent = "Updated content to regenerate"; // Example content; replace with actual logic
        await updateMessage(chatId, messageId, newContent); // Use the hook to call the API
    };

    return (
        <>
            <div className="flex relative z-10 gap-1 p-1 pt-2 pl-7 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {/* Copy Icon */}
                <button
                    className="px-1 py-1 text-white bg-blue-500 rounded-full"
                    onClick={handleTestMessage}
                >
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
                <button
                    className="px-1 py-1 text-white bg-red-500 rounded-full"
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
                {showPopup && (
                    <div className="absolute p-1 mt-9 text-white rounded shadow-lg bg-darkSecondary">
                        {popupMessage}
                    </div>
                )}
            </div>
        </>
    );
};

export default FeedbackButton;
