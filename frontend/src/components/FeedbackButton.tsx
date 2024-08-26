import React from "react";

import {
    BiCopy,
    BiRefresh,
    BiConfused,
    BiData,
    BiBarChartSquare,
} from "react-icons/bi";

const FeedbackButton: React.FC = () => {
    // Function to render feedback button

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
            </div>
        </div>
    );
};

export default FeedbackButton;
