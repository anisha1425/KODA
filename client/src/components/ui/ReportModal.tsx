import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { reportsApi } from '@/lib/api';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetId: string;
    targetType: 'book' | 'comment' | 'review' | 'user';
    targetName?: string;
}

const REPORT_REASONS = [
    'Inappropriate Content',
    'Spam or Misleading',
    'Harassment or Hate Speech',
    'Copyright Violation',
    'Other',
];

export default function ReportModal({ isOpen, onClose, targetId, targetType, targetName }: ReportModalProps) {
    const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await reportsApi.create({
                targetType,
                targetId,
                reason,
                description,
            });
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setDescription('');
                setReason(REPORT_REASONS[0]);
                onClose();
            }, 2000);
        } catch (err: unknown) {
            console.error('Report failed:', err);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const errorMessage = (err as any).response?.data?.error || (err as any).response?.data?.message || 'Failed to submit report. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-card rounded-xl shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                <span className="material-icons-outlined">check</span>
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">Report Submitted</h3>
                            <p className="text-muted-foreground">Thank you for helping keep our community safe.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">Report {targetType}</h3>
                                    {targetName && <p className="text-sm text-muted-foreground">Re: {targetName}</p>}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Reason</label>
                                    <select
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    >
                                        {REPORT_REASONS.map(r => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Description (Optional)</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Please provide more details..."
                                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[100px] resize-none"
                                        maxLength={500}
                                    />
                                    <div className="text-right text-xs text-muted-foreground mt-1">
                                        {description.length}/500
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                                        {error}
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {loading ? 'Submitting...' : 'Submit Report'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
