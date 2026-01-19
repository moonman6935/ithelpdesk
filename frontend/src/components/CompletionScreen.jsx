import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { ArrowRight, MessageSquare } from 'lucide-react';

const CompletionScreen = () => {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="max-w-2xl w-full text-center">
        {/* Animated Checkmark */}
        <div className="mb-8 relative">
          <div className="inline-block animate-bounce">
            <svg 
              className="w-32 h-32 mx-auto" 
              viewBox="0 0 100 100"
            >
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="#22C55E"
                className="animate-pulse"
              />
              <path 
                d="M 30 50 L 45 65 L 70 35" 
                stroke="white" 
                strokeWidth="8" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                fill="none"
                className="animate-draw"
              />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Her Şey Tamam!
        </h2>
        <h3 className="text-2xl font-semibold text-green-600 mb-8">
          Artık Hazırsınız 🎉
        </h3>

        {/* Help Message */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-6 mb-8">
          <p className="text-lg text-gray-800 leading-relaxed">
            Eğer bir sorununuz varsa <Link to="/troubleshooting" className="text-blue-600 font-semibold hover:underline">sorun giderme sayfasına</Link> göz atabilirsiniz veya <a href="https://rocket.dmc-rz.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">rocket.chat IT_Helpdesk kanalından</a> bizimle iletişime geçebilirsiniz.
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2 text-red-600">
            <MessageSquare className="w-5 h-5" />
            <span className="font-semibold">Her zaman yanınızdayız!</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/troubleshooting">
            <Button size="lg" variant="outline" className="border-2 border-red-600 text-red-600 hover:bg-red-50">
              Sorun Giderme
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link to="/">
            <Button size="lg" className="bg-red-600 hover:bg-red-700">
              Ana Sayfaya Dön
            </Button>
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes draw {
          from {
            stroke-dasharray: 100;
            stroke-dashoffset: 100;
          }
          to {
            stroke-dasharray: 100;
            stroke-dashoffset: 0;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in;
        }

        .animate-draw {
          animation: draw 0.8s ease-out forwards;
          animation-delay: 0.3s;
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
        }
      `}</style>
    </div>
  );
};

export default CompletionScreen;
