interface HistoryErrorAlertProps {
    message: string;
}

const HistoryErrorAlert = ({ message }: HistoryErrorAlertProps) => {
    return (
        <div className="p-4 mb-4 bg-red-950/20 border border-red-900/50 rounded-lg text-red-400 text-sm font-mono flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <p>{message}</p>
        </div>
    );
};

export default HistoryErrorAlert;