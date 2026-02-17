import HeroSection from '../../components/ui/HeroSection';
import TrendingStories from '../../components/home/TrendingStories';
import GenreGrid from '../../components/home/GenreGrid';
import NewReleases from '../../components/home/NewReleases';
import RecommendedStories from '../../components/home/RecommendedStories';
import CTASection from '../../components/ui/CTASection';
import AppDownload from '../../components/ui/AppDownload';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-background-light transition-colors duration-300">
            <HeroSection />
            <TrendingStories />
            <GenreGrid />
            <NewReleases />
            <RecommendedStories />
            <CTASection />
            <AppDownload />
        </div>
    );
}
