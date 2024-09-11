import React, { useState, useEffect } from "react";

const LevelsRegion: React.FC = () => {
    const [levels, setLevels] = useState<string[]>([]); // Initialize state for levels
    const [regions, setRegions] = useState<string[]>([]); // Initialize state for regions
    const [showRegionDropdown, setShowRegionDropdown] = useState(false); // State for Region dropdown
    const [showLevelsDropdown, setShowLevelsDropdown] = useState(false); // State for Levels dropdown
    const [searchRegion, setSearchRegion] = useState(""); // State for region search
    const [searchLevel, setSearchLevel] = useState(""); // State for level search

    const toggleRegionDropdown = () => {
        setShowRegionDropdown((prev) => !prev);
        setShowLevelsDropdown(false); // Close Levels dropdown if open
    };
    const toggleLevelsDropdown = () => {
        setShowLevelsDropdown((prev) => !prev);
        setShowRegionDropdown(false); // Close Region dropdown if open
    };

    useEffect(() => {
        const fetchLevels = async () => {
            const response = await fetch("../../public/levels.json"); // Fetch levels from JSON
            const data = await response.json();
            setLevels(data.levels); // Set levels from fetched data
        };
        fetchLevels(); // Call the fetch function
    }, []); // Empty dependency array to run once on mount

    // Regions fetch
    useEffect(() => {
        const fetchRegions = async () => {
            const response = await fetch("../../public/regions.json"); // Fetch regions from JSON
            const data = await response.json();
            setRegions(data.regions); // Set regions from fetched data
        };
        fetchRegions(); // Call the fetch function
    }, []); // Empty dependency array to run once on mount
    return (
        <div className="flex relative gap-2 mx-5 mt-auto mb-2">
            <button
                onClick={toggleLevelsDropdown}
                className="p-3 w-32 text-white rounded-full bg-lightTertiary dark:bg-darkSecondary"
            >
                Levels
            </button>
            <button
                onClick={toggleRegionDropdown}
                className="p-3 w-32 text-white rounded-full bg-lightTertiary dark:bg-darkSecondary"
            >
                Region
            </button>
            {showRegionDropdown && (
                <div className="absolute bottom-full mb-2 w-64 bg-white rounded shadow-lg dark:bg-darkPrimary">
                    <input
                        type="text"
                        placeholder="Search Region..."
                        value={searchRegion}
                        onChange={(e) => setSearchRegion(e.target.value)}
                        className="p-2 mb-2 w-full rounded border border-gray-300"
                    />
                    <ul className="overflow-y-auto p-2 max-h-48">
                        {regions
                            .filter((region) =>
                                region
                                    .toLowerCase()
                                    .includes(searchRegion.toLowerCase())
                            )
                            .map((region, index) => (
                                <li
                                    key={index}
                                    className="px-2 py-1 text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                                >
                                    {region}
                                </li>
                            ))}
                    </ul>
                </div>
            )}
            {showLevelsDropdown && (
                <div className="absolute bottom-full mb-2 w-64 bg-white rounded shadow-lg dark:bg-darkPrimary">
                    <input
                        type="text"
                        placeholder="Search Level..."
                        value={searchLevel}
                        onChange={(e) => setSearchLevel(e.target.value)}
                        className="p-2 mb-2 w-full rounded border border-gray-300"
                    />
                    <ul className="overflow-y-auto p-2 max-h-48">
                        {levels
                            .filter((level) =>
                                level
                                    .toLowerCase()
                                    .includes(searchLevel.toLowerCase())
                            )
                            .map((level, index) => (
                                <li
                                    key={index}
                                    className="px-2 py-1 text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                                >
                                    {level}
                                </li>
                            ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default LevelsRegion;
