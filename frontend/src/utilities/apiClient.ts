// apiClient.ts
// this allows us to avoid declaring base URL and headers over and over again in the hook
import axios from "axios";

const apiClient = axios.create({
    baseURL: "http://localhost:8000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

export default apiClient;
