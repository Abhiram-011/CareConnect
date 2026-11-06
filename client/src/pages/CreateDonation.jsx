import React from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import CreateDonationModal from '../components/CreateDonationModal.jsx';
import { ArrowLeft, HeartHandshake } from 'lucide-react';

export const CreateDonation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedHomeId = searchParams.get('homeId') || '';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          to="/donor/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Donor Dashboard
        </Link>
      </div>

      <CreateDonationModal
        isOpen={true}
        onClose={() => navigate('/donor/dashboard')}
        preselectedHomeId={preselectedHomeId}
        onSuccess={() => {
          // Keep modal in confirmation view until user clicks done
        }}
      />
    </div>
  );
};

export default CreateDonation;
