import React from 'react';
import { Heart, ShieldCheck, Sparkles } from 'lucide-react';

export const About = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Title */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          Our Mission & Community
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          About CareConnect
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Bridging the gap between compassionate donors and verified old-age homes to provide dignified living, medical support, and genuine companionship to elderly residents.
        </p>
      </div>

      {/* Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Heart className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Compassion & Transparency</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            We ensure every donation directly aligns with verified needs published by elder homes. Donors experience 100% transparency with clear records and real-time updates.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Rigorous Verification</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            All participating elder care facilities undergo thorough administrative checks to maintain the highest standards of safety, integrity, and resident welfare.
          </p>
        </div>
      </div>

      {/* Role ecosystem explanation */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">The CareConnect Ecosystem</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="border border-slate-200 rounded-2xl p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
              Donors
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-2">Empowering Givers</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Pledge funding, medical equipment, food rations, and winter essentials to elderly homes in need.
            </p>
          </div>

          <div className="border border-slate-200 rounded-2xl p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Elderly Homes
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-2">Dignified Sanctuaries</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Care facilities update their occupancy and catalog urgent requirements for donor matching.
            </p>
          </div>

          <div className="border border-slate-200 rounded-2xl p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
              Volunteers
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-2">Hands & Hearts</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Offer companionship, host recreational workshops, and assist in logistics and home care visits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
