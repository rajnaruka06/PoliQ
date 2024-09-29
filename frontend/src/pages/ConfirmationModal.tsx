// frontend/src/components/ConfirmationModal.tsx
import React from "react";

interface ConfirmationModalProps {
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    message,
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-5 rounded shadow-lg">
                <p>{message}</p>
                <div className="flex justify-end mt-4">
                    <button onClick={onCancel} className="mr-2">
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="bg-red-500 text-white"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
