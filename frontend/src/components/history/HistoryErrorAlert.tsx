interface HistoryErrorAlertProps {
    message: string;
}

const HistoryErrorAlert = ({ message }: HistoryErrorAlertProps) => {
    return (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/10 p-4 text-[15px] text-danger">
            <span className="mt-1 h-2 w-2 rounded-full bg-danger"></span>
            <p>{message}</p>
        </div>
    );
};

export default HistoryErrorAlert;