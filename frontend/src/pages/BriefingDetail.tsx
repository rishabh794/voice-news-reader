import { useParams, useNavigate } from 'react-router-dom';
import { useBriefingDetail } from '../hooks/useBriefing';
import useAudioPlayer from '../hooks/useAudioPlayer';
import BriefingDashboardLayout from '../components/briefing/BriefingDashboardLayout';
import PageHeader from '../components/ui/PageHeader';
import SectionContainer from '../components/ui/SectionContainer';
import Loader from '../components/Loader';
import Button from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

const BriefingDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: briefing, isLoading, error } = useBriefingDetail(id);
    const audioPlayer = useAudioPlayer();

    if (isLoading) {
        return (
            <SectionContainer>
                <Loader />
            </SectionContainer>
        );
    }

    if (error || !briefing) {
        return (
            <SectionContainer>
                <div className="text-center py-12 space-y-4">
                    <p className="text-danger text-lg">Failed to load briefing.</p>
                    <Button variant="outline" onClick={() => navigate('/history')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to History
                    </Button>
                </div>
            </SectionContainer>
        );
    }

    const dateObj = new Date(briefing.date + 'T00:00:00Z');
    const displayDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    return (
        <SectionContainer className="space-y-6">
            <div className="flex items-center space-x-4 mb-4">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted hover:text-text">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
            </div>
            
            <PageHeader
                title="Historical Briefing"
                subtitle={`Your daily briefing from ${displayDate}`}
            />
            
            <BriefingDashboardLayout briefing={briefing} audioPlayer={audioPlayer} />
        </SectionContainer>
    );
};

export default BriefingDetail;
