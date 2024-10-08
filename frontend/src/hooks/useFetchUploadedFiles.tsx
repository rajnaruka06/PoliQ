// useFetchUploadedFiles.tsx

import { useState, useEffect } from "react";
import apiClient from "../utilities/apiClient";

interface FileItem {
    name: string;
    // Add other properties if needed
}

interface UseFetchUploadedFilesHook {
    files: FileItem[];
    loading: boolean;
    error: string | null;
    fetchFiles: () => Promise<void>;
}

export const useFetchUploadedFiles = (
    chatId: string,
    userId: string
): UseFetchUploadedFilesHook => {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchFiles = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(`/chats/${chatId}/files`, {
                params: { userId },
            });
            if (response.status !== 200) {
                throw new Error("Failed to fetch uploaded files");
            }
            setFiles(response.data.files);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (chatId) {
            fetchFiles();
        }
    }, [chatId]);

    return { files, loading, error, fetchFiles };
};
