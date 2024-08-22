import { useState } from "react";
import "./App.css";
import Chatbot from "./pages/chatbot";

function App() {
    return (
        <div className="flex justify-center items-center h-screen">
            <Chatbot />
        </div>
    );
}

export default App;
