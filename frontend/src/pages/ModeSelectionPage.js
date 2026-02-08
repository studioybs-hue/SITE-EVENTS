import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Wrench, ArrowRight, Sparkles } from 'lucide-react';

const ModeSelectionPage = () => {
  const navigate = useNavigate();

  const selectMode = (mode) => {
    localStorage.setItem('siteMode', mode);
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-5xl w-full">
        {/* Logo & Title */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-10 w-10 text-yellow-400" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Je Suis
            </h1>
          </div>
          <p className="text-xl text-gray-300">
            Trouvez le professionnel qu'il vous faut
          </p>
        </div>

        {/* Choice Cards */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Events Card */}
          <button
            onClick={() => selectMode('events')}
            className="group relative bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-8 text-left transition-all duration-300 hover:scale-105 hover:border-yellow-400/60 hover:shadow-2xl hover:shadow-yellow-500/20"
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="h-6 w-6 text-yellow-400" />
            </div>
            
            <div className="w-16 h-16 bg-yellow-500/20 rounded-xl flex items-center justify-center mb-6">
              <Calendar className="h-8 w-8 text-yellow-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">
              Événements
            </h2>
            
            <p className="text-gray-300 mb-6">
              Mariages, anniversaires, soirées d'entreprise... Trouvez les meilleurs prestataires pour vos événements.
            </p>
            
            <div className="flex flex-wrap gap-2">
              {['Photographe', 'DJ', 'Traiteur', 'Décorateur', 'Fleuriste'].map((cat) => (
                <span key={cat} className="px-3 py-1 bg-yellow-500/20 text-yellow-300 text-sm rounded-full">
                  {cat}
                </span>
              ))}
            </div>
          </button>

          {/* Pro Card */}
          <button
            onClick={() => selectMode('pro')}
            className="group relative bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-8 text-left transition-all duration-300 hover:scale-105 hover:border-blue-400/60 hover:shadow-2xl hover:shadow-blue-500/20"
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="h-6 w-6 text-blue-400" />
            </div>
            
            <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
              <Wrench className="h-8 w-8 text-blue-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">
              Professionnels
            </h2>
            
            <p className="text-gray-300 mb-6">
              Électriciens, plombiers, serruriers... Des artisans qualifiés pour tous vos travaux.
            </p>
            
            <div className="flex flex-wrap gap-2">
              {['Électricien', 'Plombier', 'Serrurier', 'Peintre', 'Menuisier'].map((cat) => (
                <span key={cat} className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full">
                  {cat}
                </span>
              ))}
            </div>
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 mt-12 text-sm">
          Vous pourrez changer de mode à tout moment
        </p>
      </div>
    </div>
  );
};

export default ModeSelectionPage;
