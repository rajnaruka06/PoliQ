import React, { useState, useRef, useEffect } from "react";

const LevelsRegion: React.FC = () => {
    const [levels, setLevels] = useState<string[]>([]); // Initialize state for levels
    const [regions, setRegions] = useState<string[]>([]); // Initialize state for regions
    const [showRegionDropdown, setShowRegionDropdown] = useState(false); // State for Region dropdown
    const [showLevelsDropdown, setShowLevelsDropdown] = useState(false); // State for Levels dropdown
    const [searchRegion, setSearchRegion] = useState(""); // State for region search
    const [searchLevel, setSearchLevel] = useState(""); // State for level search
    const regionRef = useRef<HTMLDivElement | null>(null); // Reference for the region dropdown
    const levelsRef = useRef<HTMLDivElement | null>(null); // Reference for the levels dropdown
    const regionButtonRef = useRef<HTMLButtonElement | null>(null); // Reference for the region button
    const levelsButtonRef = useRef<HTMLButtonElement | null>(null); // Reference for the levels button

    // Fetch levels from JSON
    useEffect(() => {
        const fetchLevels = async () => {
            const response = await fetch("../../public/levels.json"); // Fetch levels from JSON
            const data = await response.json();
            setLevels(data.levels); // Set levels from fetched data
        };
        fetchLevels(); // Call the fetch function
    }, []); // Empty dependency array to run once on mount

    // Fetch regions from JSON
    useEffect(() => {
        const fetchRegions = async () => {
            const response = await fetch("../../public/regions.json"); // Fetch Regions from JSON
            const data = await response.json();
            setRegions(data.regions); // Set regions from fetched data
        };
        fetchRegions(); // Call the fetch function
    }, []); // Empty dependency array to run once on mount

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            // Check if the dropdowns and buttons are defined before accessing them
            const isOutsideRegionDropdown =
                regionRef.current && !regionRef.current.contains(target);
            const isOutsideLevelsDropdown =
                levelsRef.current && !levelsRef.current.contains(target);
            const isOutsideRegionButton =
                regionButtonRef.current &&
                !regionButtonRef.current.contains(target);
            const isOutsideLevelsButton =
                levelsButtonRef.current &&
                !levelsButtonRef.current.contains(target);

            // Debugging logs
            // console.log("Clicked target:", target);
            // console.log("Is outside region dropdown:", isOutsideRegionDropdown);
            // console.log("Is outside levels dropdown:", isOutsideLevelsDropdown);
            // console.log("Is outside region button:", isOutsideRegionButton);
            // console.log("Is outside levels button:", isOutsideLevelsButton);

            // Close dropdowns if clicking outside of both dropdowns and their buttons
            if (
                (isOutsideRegionDropdown || isOutsideLevelsDropdown) &&
                isOutsideRegionButton &&
                isOutsideLevelsButton
            ) {
                console.log("Closing dropdowns"); // Debugging log
                setShowRegionDropdown(false);
                setShowLevelsDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="flex relative gap-2 mx-5 mt-auto">
            <button
                ref={levelsButtonRef}
                className="w-24 text-black rounded-full 3xl:p-3 3xl:w-32 bg-lightTertiary dark:text-white dark:bg-darkSecondary"
                onClick={(event) => {
                    event.stopPropagation(); // Prevent click from bubbling up to the document
                    setShowLevelsDropdown((prev) => !prev); // Toggle the popup visibility
                    setShowRegionDropdown(false); // Close Region dropdown if open
                }}
            >
                Levels
            </button>

            <button
                ref={regionButtonRef}
                className="w-24 text-black rounded-full 3xl:p-3 3xl:w-32 bg-lightTertiary dark:text-white dark:bg-darkSecondary"
                onClick={(event) => {
                    event.stopPropagation(); // Prevent click from bubbling up to the document
                    setShowRegionDropdown((prev) => !prev); // Toggle the popup visibility
                    setShowLevelsDropdown(false); // Close Levels dropdown if open
                }}
            >
                Region
            </button>

            {/* levels dropdown */}
            {showLevelsDropdown && (
                <div
                    ref={levelsRef}
                    className="absolute bottom-full mb-2 bg-white rounded shadow-lg w-50 3xl:w-64 dark:bg-darkPrimary"
                >
                    <input
                        type="text"
                        placeholder="Search Level..."
                        value={searchLevel}
                        onChange={(e) => setSearchLevel(e.target.value)}
                        className="p-2 mb-2 w-full bg-white rounded border border-gray-300 dark:bg-darkPrimary"
                    />
                    <ul className="overflow-y-auto p-2 max-h-48 3xl:max-h-72">
                        {levels
                            .filter((level) =>
                                level
                                    .toLowerCase()
                                    .includes(searchLevel.toLowerCase())
                            )
                            .map((level, index) => (
                                <li
                                    key={index}
                                    className="px-2 py-1 text-black cursor-pointer 3xl:text-lg text-md hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700"
                                >
                                    {level}
                                </li>
                            ))}
                    </ul>
                </div>
            )}

            {/* region dropdown */}
            {showRegionDropdown && (
                <div
                    ref={regionRef}
                    className="absolute bottom-full mb-2 w-52 bg-white rounded shadow-lg 3xl:w-64 dark:bg-darkPrimary"
                >
                    <input
                        type="text"
                        placeholder="Search Region..."
                        value={searchRegion}
                        onChange={(e) => setSearchRegion(e.target.value)}
                        className="p-2 mb-2 w-full bg-white rounded border border-gray-300 dark:bg-darkPrimary"
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
                                    className="px-2 py-1 text-black cursor-pointer hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700"
                                >
                                    {region}
                                </li>
                            ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default LevelsRegion;
