import { PageHeader } from '@/components/page-header';
import { RecommendationForm } from './components/recommendation-form';

export default function RecommendationsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Find Your Perfect Car"
        description="Tell us what you need, and our AI will find the best options for you."
      />
      <RecommendationForm />
    </div>
  );
}
