// frontend/hooks/useUploadFile.tsx

import { useState } from 'react';
import axios from 'axios';

interface UploadFileParams {
  file: File;
  chatId: string;
  userId: string;
}

interface UseUploadFileReturn {
  uploadFile: (params: UploadFileParams) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

export const useUploadFile = (): UseUploadFileReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const uploadFile = async ({ file, chatId, userId }: UploadFileParams) => {
    setLoading(true);
    setError(null);

    try {
      if (!chatId) {
        throw new Error('No chat selected. Please select or start a chat before uploading a file.');
      }

      const formData = new FormData();
      formData.append('file', file);

      // Use absolute URL for the backend
      const backendUrl = 'http://localhost:8000'; 

      const response = await axios.post(
        `${backendUrl}/api/${chatId}/upload`,
        formData,
        {
          params: { userId },
          // Axios automatically sets the correct Content-Type for FormData
        }
      );

      console.log('File uploaded successfully:', response.data);
      // Handle additional logic if needed
    } catch (err: any) {
      setError(err);
      console.error('Error uploading file:', err);
    } finally {
      setLoading(false);
    }
  };

  return { uploadFile, loading, error };
};

export default useUploadFile;
