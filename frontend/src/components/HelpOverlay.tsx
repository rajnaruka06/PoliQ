import React from "react";
import {
    AiFillSun,
    AiFillMoon,
    AiOutlineMore,
    AiOutlineUpload,
    AiOutlinePaperClip,
    AiOutlineSearch,
    AiOutlineBook,
    AiOutlineForm,
    AiOutlineEdit,
} from "react-icons/ai";
import {
    BiChevronLeftCircle,
    BiChevronRightCircle,
    BiPin,
    BiSolidPin,
    BiTrash,
    BiArchive,
} from "react-icons/bi";

interface HelpOverlayProps {
    showHelp: boolean;
    closeHelp: () => void;
}

const HelpOverlay: React.FC<HelpOverlayProps> = ({ showHelp, closeHelp }) => {
    if (!showHelp) return null;

    return (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
            <div
                className="p-8 w-full max-w-lg text-black bg-white rounded-lg shadow-lg dark:text-white dark:bg-darkSecondary"
                style={{
                    maxHeight: "80vh",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Anchoring title at the top */}
                <h2 className="mb-4 text-2xl font-bold">
                    Help Guide for PoliQ Chat
                </h2>

                {/* Scrollable area for content */}
                <div style={{ overflowY: "auto", flex: 1 }}>
                    {/* Explanation of icons/symbols */}
                    <ul className="ml-5 list-disc">
                        <li className="mb-2">
                            <span className="font-semibold">
                                Create a New Chat
                            </span>
                            (<AiOutlineForm className="inline-block" />
                            ): Click this icon located within the chat bar of
                            the PoliQ Chat to upload a dataset file
                        </li>
                        <li className="mb-2">
                            <span className="font-semibold">
                                Upload Dataset to a Chat
                            </span>
                            (<AiOutlinePaperClip className="inline-block" />
                            ): Click this icon located within the text box of
                            the PoliQ Chat sidebar, and then click{" "}
                            <AiOutlineUpload className="inline-block align-middle" />{" "}
                            Upload Dataset.
                        </li>
                        <li className="mb-2">
                            <span className="font-semibold">
                                Searching for Chat
                            </span>
                            (<AiOutlineSearch className="inline-block" />
                            ): The search functionality is located beside this
                            icon in the PoliQ Chat sidebar. Type words
                            corresponding to the chat name to search for the
                            chat of interest.
                        </li>
                        <li className="mb-2">
                            <span className="font-semibold">
                                Viewing All/Archived Chats
                            </span>
                            (<AiOutlineBook className="inline-block" />
                            ): Click this icon located at the bottom of PoliQ
                            Chat sidebar to expand options to "View All Chats"
                            and "Archived Chats".
                        </li>
                        <li className="mb-2">
                            <span className="font-semibold">
                                Dark/Light Mode
                            </span>
                            (<AiFillMoon className="inline-block" /> for dark
                            mode, <AiFillSun className="inline-block" /> for
                            light mode): Click the corresponding icon located on
                            the top-right corner of the page to swap between
                            dark and light themes.
                        </li>
                        <li className="mb-2">
                            <span className="font-semibold">
                                Minimise Chat Sidebar
                            </span>
                            (<BiChevronLeftCircle className="inline-block" />
                            ): Click this icon located in the top-right corner
                            of the PoliQ Chat sidebar to minimise the sidebar
                            temporarily.
                        </li>
                        <li className="mb-2">
                            <span className="font-semibold">
                                Re-expand Chat Sidebar
                            </span>
                            (<BiChevronRightCircle className="inline-block" />
                            ): Click this icon located on the minimised sidebar
                            to re-expand the PoliQ Chat sidebar to full view.
                        </li>
                        <li className="mb-4">
                            <span className="font-semibold">
                                Chat-specific Operations
                            </span>
                            : Hover over the corresponding chat and click the{" "}
                            <AiOutlineMore className="inline-block align-middle" />{" "}
                            button to reveal chat-specific operations.
                            <ul className="ml-6">
                                <li>
                                    Click the{" "}
                                    <BiPin className="inline-block align-middle" />{" "}
                                    button to pin a chat (for a pinned chat,
                                    click{" "}
                                    <BiSolidPin className="inline-block align-middle" />{" "}
                                    to un-pin the chat).
                                </li>
                                <li>
                                    Click the{" "}
                                    <BiTrash className="inline-block align-middle" />{" "}
                                    button to delete the chat.
                                </li>
                                <li>
                                    Click the{" "}
                                    <BiArchive className="inline-block align-middle" />{" "}
                                    button to archive the chat.
                                </li>
                                <li>
                                    Click the{" "}
                                    <AiOutlineEdit className="inline-block align-middle" />{" "}
                                    button to rename the chat.
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>

                {/* Anchoring Close Button */}
                <button
                    onClick={closeHelp}
                    className="px-4 py-2 mt-4 text-white bg-blue-500 rounded-lg"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default HelpOverlay;
