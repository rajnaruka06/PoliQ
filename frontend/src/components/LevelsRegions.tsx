// LevelsRegions.tsx

import React, { useState, useRef, useEffect } from "react";
import { useFetchUploadedFiles } from "../hooks/useFetchUploadedFiles";

interface FileItem {
    name: string;
    // Add other properties if needed
}

interface LevelsRegionProps {
    chatId: string | null;
    userId: string;
}

const LevelsRegion: React.FC<LevelsRegionProps> = ({ chatId, userId }) => {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [showFilesDropdown, setShowFilesDropdown] = useState(false);
    const [searchFile, setSearchFile] = useState("");
    const filesRef = useRef<HTMLDivElement | null>(null);
    const filesButtonRef = useRef<HTMLButtonElement | null>(null);

    const {
        files: fetchedFiles,
        loading,
        error,
    } = useFetchUploadedFiles(chatId || "", userId);

    useEffect(() => {
        if (fetchedFiles) {
            setFiles(fetchedFiles);
        }
    }, [fetchedFiles]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            const isOutsideFilesDropdown =
                filesRef.current && !filesRef.current.contains(target);
            const isOutsideFilesButton =
                filesButtonRef.current && !filesButtonRef.current.contains(target);

            if (isOutsideFilesDropdown && isOutsideFilesButton) {
                setShowFilesDropdown(false);
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
                ref={filesButtonRef}
                className="w-24 text-black rounded-full 3xl:p-3 3xl:w-32 bg-lightTertiary dark:text-white dark:bg-darkSecondary"
                onClick={(event) => {
                    event.stopPropagation();
                    setShowFilesDropdown((prev) => !prev);
                }}
            >
                Files
            </button>

            {/* Files dropdown */}
            {showFilesDropdown && (
                <div
                    ref={filesRef}
                    className="absolute bottom-full mb-2 bg-white rounded shadow-lg w-50 3xl:w-64 dark:bg-darkPrimary"
                >
                    <input
                        type="text"
                        placeholder="Search Files..."
                        value={searchFile}
                        onChange={(e) => setSearchFile(e.target.value)}
                        className="p-2 mb-2 w-full bg-white rounded border border-gray-300 dark:bg-darkPrimary"
                    />
                    {loading && <div>Loading files...</div>}
                    {error && <div>Error loading files: {error}</div>}
                    {!loading && !error && (
                        <ul className="overflow-y-auto p-2 max-h-48 3xl:max-h-72">
                            {files
                                .filter((file) =>
                                    file.name
                                        .toLowerCase()
                                        .includes(searchFile.toLowerCase())
                                )
                                .map((file, index) => (
                                    <li
                                        key={index}
                                        className="px-2 py-1 text-black cursor-pointer 3xl:text-lg text-md hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700"
                                    >
                                        {file.name}
                                    </li>
                                ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default LevelsRegion;
