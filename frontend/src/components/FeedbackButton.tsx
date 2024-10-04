import React, { useState } from "react";
import {
    BiCopy,
    BiRefresh,
    BiConfused,
    BiData,
    BiBarChartSquare,
    BiMessageSquareCheck,
} from "react-icons/bi"; // Include BiCopy icon
import axios from "axios";
// Importing hook for regenerate chat called useUpdateMessage
import { useUpdateMessage } from "../hooks/useUpdateMessage";

// Creating interface for FeedbackButtonProps
interface FeedbackButtonProps {
    chatId: string;
    messageId: string;
    userId: string;
    content: string; // Add content prop for copying text
}

const FeedbackButton: React.FC<FeedbackButtonProps> = ({
    chatId,
    messageId,
    userId,
    content, // Add content prop for copying text
}) => {
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState(""); // For confused popup
    const [showConfirmation, setShowConfirmation] = useState(false); // For copy confirmation
    const { updateMessage, loading, error } = useUpdateMessage(userId); // Use the custom hook
    const [showVisualization, setShowVisualization] = useState(false); // For visualization confirmation

    // Function to handle the visualization icon click
    const handleVisualizationClick = () => {
        setShowVisualization(true); // Show visualization confirmation
        setTimeout(() => {
            setShowVisualization(false); // Hide confirmation after 2 seconds
        }, 2000);
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

    // Function to handle the copy icon click
    const handleCopyClick = () => {
        navigator.clipboard.writeText(content); // Copy the message content to clipboard
        setShowConfirmation(true); // Show confirmation popup
        setTimeout(() => {
            setShowConfirmation(false); // Hide confirmation after 2 seconds
        }, 2000);
    };

    return (
        <div className="relative w-full">
            <div className="absolute left-0 top-full mt-2">
                <div className="flex relative z-10 gap-1 p-1 pt-2 pl-7 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {/* Copy Icon */}
                    <button
                        className="px-1 py-1 text-white bg-blue-500 rounded-full"
                        onClick={handleCopyClick} // Call the copy handler
                    >
                        <BiCopy className="text-xl lg:text-3xl" />
                    </button>
                    {/* Refresh Icon */}
                    <button
                        className="px-1 py-1 text-white bg-green-500 rounded-full"
                        onClick={handleRefreshClick} // Call the refresh handler
                        disabled={loading} // Disable button when loading
                    >
                        <BiRefresh className="text-xl lg:text-3xl" />
                    </button>
                    {/* Confused Icon */}
                    <button
                        className="px-1 py-1 text-white bg-red-500 rounded-full"
                        onClick={handleConfusedClick}
                    >
                        <BiConfused className="text-xl lg:text-3xl" />
                    </button>
                    {/* Data Icon */}
                    <button className="px-1 py-1 text-white bg-yellow-500 rounded-full">
                        <BiData className="text-xl lg:text-3xl" />
                    </button>
                    {/* Bar Chart Icon */}
                    <button
                        className="px-1 py-1 text-white bg-purple-500 rounded-full"
                        onClick={handleVisualizationClick} // Call the visualization handler
                    >
                        <BiBarChartSquare className="text-xl lg:text-3xl" />
                    </button>
                </div>
            </div>
            {/* Confirmation Icon (show on copy success) */}
            {showConfirmation && (
                <div className="absolute left-0 top-6 p-1 mt-8 ml-7 text-white bg-green-500 rounded shadow-lg">
                    ✅ Copied to clipboard!
                </div>
            )}
            {/* Confused icon click popup message */}
            {showPopup && (
                <div className="absolute left-0 top-6 p-2 mt-8 ml-7 text-white bg-red-500 rounded shadow-lg">
                    ☹️ I am sorry you didn't like this response. I will do
                    better next time, boss!
                </div>
            )}
            {/* Visualization confirmation message */}
            {showVisualization && (
                <div className="absolute left-0 top-6 p-1 mt-8 ml-7 text-white bg-purple-500 rounded shadow-lg">
                    Visualization generated!
                </div>
            )}
        </div>
    );
};

export default FeedbackButton;
