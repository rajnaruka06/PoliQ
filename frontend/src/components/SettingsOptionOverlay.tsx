import React, { useState, useEffect } from "react";
import { AiFillDelete } from "react-icons/ai";

interface Memory {
    memoryId: string;
    memoryContent: string;
}

interface SettingsOptionOverlayProps {
    showSettingsOverlay: boolean;
    handleSettingsOverlay: (option: string | null) => void;
    selectedOption: string | null;
}

const SettingsOptionOverlay: React.FC<SettingsOptionOverlayProps> = ({
    showSettingsOverlay,
    handleSettingsOverlay,
    selectedOption,
}) => {
    const [memories, setMemories] = useState<Memory[]>([]);

    // Fetch memory data from memory.json
    useEffect(() => {
        const fetchMemories = async () => {
            try {
                const response = await fetch("../../public/memory.json");
                if (!response.ok) throw new Error("Failed to fetch memories");

                const data = await response.json();
                setMemories(data);
            } catch (error) {
                console.error("Error fetching memories:", error);
            }
        };

        fetchMemories();
    }, []);

    if (!showSettingsOverlay) return null;

    return (
        <div className="flex absolute top-1/2 left-1/2 flex-col gap-3 p-4 w-1/2 h-1/2 rounded-2xl transform -translate-x-1/2 -translate-y-1/2 bg-darkSecondary">
            <div className="relative h-full">
                <div className="sticky p-2 mb-10 text-3xl font-semibold rounded-md bg-darkPrimary">
                    {selectedOption}
                </div>
                <div className="flex overflow-y-auto flex-col gap-3 p-2 bg-darkPrimary max-h-[calc(100%-10rem)] scrollbar-hide rounded-md">
                    {selectedOption === "Memory" &&
                        memories.map((memory) => (
                            <div
                                key={memory.memoryId}
                                className="flex justify-between text-2xl"
                            >
                                <div className="truncate">
                                    {memory.memoryContent}
                                </div>
                                <div className="px-4 rounded-md cursor-pointer bg-darkSecondary hover:border">
                                    <AiFillDelete />
                                </div>
                            </div>
                        ))}
                </div>
                <button
                    onClick={() => handleSettingsOverlay(null)}
                    className="absolute right-0 bottom-0 px-2 text-xl rounded-md bg-darkPrimary"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default SettingsOptionOverlay;
