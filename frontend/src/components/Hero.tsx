import React, { useState } from "react";

// Ensure to export this function if it's used outside
const Hero: React.FC<{
    handleOptionClick: (optionText: string) => void;
}> = ({ handleOptionClick }) => {
    return (
        <div className="flex flex-col flex-grow justify-center items-center mx-auto max-w-7xl h-full">
            <div className="text-5xl font-semibold text-black text-text dark:text-white">
                Welcome to PoliQ
            </div>
            <div className="flex gap-3 mt-4">
                <button
                    className="text-2xl text-black bg-lightTertiary dark:bg-darkSecondary dark:text-white"
                    onClick={() =>
                        handleOptionClick(
                            "What is the age distribution demographic of Greens voters?"
                        )
                    }
                >
                    What is the age distribution demographic of Greens voters?
                </button>
                <button
                    className="text-2xl text-black bg-lightTertiary dark:bg-darkSecondary dark:text-white"
                    onClick={() =>
                        handleOptionClick(
                            "Which electorates of AEC did the Greens have most success in the recent election?"
                        )
                    }
                >
                    Which electorates of AEC did the Greens have most success in
                    the recent election?
                </button>
                <button
                    className="text-2xl text-black bg-lightTertiary dark:bg-darkSecondary dark:text-white"
                    onClick={() =>
                        handleOptionClick(
                            "Which electorates in Victoria can the Greens improve their performance?"
                        )
                    }
                >
                    Which electorates in Victoria can the Greens improve their
                    performance?
                </button>
                <button
                    className="text-2xl text-black bg-lightTertiary dark:bg-darkSecondary dark:text-white"
                    onClick={() =>
                        handleOptionClick(
                            "Which electorates in New South Wales can the Greens improve their performance?"
                        )
                    }
                >
                    Which electorates in New South Wales can the Greens improve
                    their performance?
                </button>
            </div>
        </div>
    );
};

export default Hero;
