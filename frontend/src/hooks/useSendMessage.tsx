import { useState } from 'react';
import apiClient from '../utilities/apiClient';

interface UseSendMessageHook {
    sendMessage: (params: { chatId: string | null; content: string }) => Promise<string | undefined>;
    loading: boolean;
    error: string | null;
}

export const useSendMessage = (userId: string): UseSendMessageHook => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendMessage = async ({
        chatId,
        content,
    }: {
        chatId: string | null;
        content: string;
    }) => {
        setLoading(true);
        setError(null); // Clear any previous error
        try {
            console.log('Sending message with data:', { chatId, content, userId });

            const response = await apiClient.post(
                '/messages/send',
                {
                    chatId,
                    content,
                },
                {
                    params: { userId }, // Include userId as query parameter
                }
            );

            console.log('Message sent successfully', response.data);
            // Return the chatId from the response
            return response.data.chatId;
        } catch (err) {
            // Handle error
            console.error('Error sending message:', err);
            throw err; // Rethrow the error to be caught in handleSend
        } finally {
            setLoading(false);
        }
    };

    return { sendMessage, loading, error };
};
