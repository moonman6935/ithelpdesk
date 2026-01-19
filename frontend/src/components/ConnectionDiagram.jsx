import React from 'react';
import { Monitor, Cable, Plug, Usb, Headphones, Keyboard, Wifi } from 'lucide-react';

const ConnectionDiagram = () => {
  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-lg border-2 border-gray-300 shadow-lg">
      <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">Bilgisayar Bağlantı Şeması</h3>
      
      <div className="relative max-w-6xl mx-auto">
        {/* PC Kasası - Merkez */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-gray-800 rounded-lg p-6 shadow-2xl border-4 border-red-600 w-48">
            <div className="text-center">
              <div className="bg-red-600 rounded-lg p-3 mb-2">
                <svg className="w-12 h-12 text-white mx-auto" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <circle cx="12" cy="6" r="1" fill="currentColor"/>
                  <rect x="6" y="9" width="12" height="2" fill="currentColor"/>
                  <rect x="6" y="13" width="12" height="2" fill="currentColor"/>
                  <rect x="6" y="17" width="12" height="2" fill="currentColor"/>
                </svg>
              </div>
              <p className="text-white font-bold text-lg">PC KASASI</p>
              <p className="text-gray-300 text-xs mt-1">Arka Panel</p>
            </div>
          </div>
        </div>

        {/* Monitör 1 - Sol Üst */}
        <div className="absolute top-0 left-0">
          <div className="bg-white rounded-lg p-4 shadow-lg border-2 border-blue-500 w-40">
            <Monitor className="w-10 h-10 text-blue-600 mx-auto mb-2" />
            <p className="text-center font-bold text-gray-900">Monitör 1</p>
            <div className="bg-blue-100 rounded px-2 py-1 mt-2">
              <p className="text-xs text-center text-blue-800 font-semibold">VGA Bağlantı</p>
            </div>
          </div>
          {/* VGA Kablosu Ok İşareti */}
          <svg className="absolute top-20 left-32 w-64 h-32" style={{ pointerEvents: 'none' }}>
            <defs>
              <marker id="arrowhead-vga" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#3B82F6" />
              </marker>
            </defs>
            <path d="M 0 0 Q 100 40, 200 80" stroke="#3B82F6" strokeWidth="3" fill="none" markerEnd="url(#arrowhead-vga)" strokeDasharray="5,5">
              <animate attributeName="stroke-dashoffset" from="10" to="0" dur="1s" repeatCount="indefinite" />
            </path>
            <text x="80" y="30" fill="#3B82F6" fontSize="14" fontWeight="bold" className="bg-white">VGA</text>
          </svg>
        </div>

        {/* Monitör 2 - Sağ Üst */}
        <div className="absolute top-0 right-0">
          <div className="bg-white rounded-lg p-4 shadow-lg border-2 border-purple-500 w-40">
            <Monitor className="w-10 h-10 text-purple-600 mx-auto mb-2" />
            <p className="text-center font-bold text-gray-900">Monitör 2</p>
            <div className="bg-purple-100 rounded px-2 py-1 mt-2">
              <p className="text-xs text-center text-purple-800 font-semibold">HDMI Bağlantı</p>
            </div>
          </div>
          {/* HDMI Kablosu Ok İşareti */}
          <svg className="absolute top-20 right-32 w-64 h-32" style={{ pointerEvents: 'none' }}>
            <defs>
              <marker id="arrowhead-hdmi" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#9333EA" />
              </marker>
            </defs>
            <path d="M 264 0 Q 164 40, 64 80" stroke="#9333EA" strokeWidth="3" fill="none" markerEnd="url(#arrowhead-hdmi)" strokeDasharray="5,5">
              <animate attributeName="stroke-dashoffset" from="10" to="0" dur="1s" repeatCount="indefinite" />
            </path>
            <text x="170" y="30" fill="#9333EA" fontSize="14" fontWeight="bold">HDMI</text>
          </svg>
        </div>

        {/* Klavye + Mouse - Sol Alt */}
        <div className="absolute bottom-0 left-0">
          <div className="bg-white rounded-lg p-4 shadow-lg border-2 border-green-500 w-40">
            <Keyboard className="w-10 h-10 text-green-600 mx-auto mb-2" />
            <p className="text-center font-bold text-gray-900 text-sm">Klavye + Mouse</p>
            <div className="bg-green-100 rounded px-2 py-1 mt-2">
              <p className="text-xs text-center text-green-800 font-semibold">USB Bağlantı</p>
            </div>
          </div>
          {/* USB Kablosu Ok İşareti */}
          <svg className="absolute bottom-20 left-32 w-64 h-32" style={{ pointerEvents: 'none' }}>
            <defs>
              <marker id="arrowhead-usb" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#16A34A" />
              </marker>
            </defs>
            <path d="M 0 128 Q 100 90, 200 50" stroke="#16A34A" strokeWidth="3" fill="none" markerEnd="url(#arrowhead-usb)" strokeDasharray="5,5">
              <animate attributeName="stroke-dashoffset" from="10" to="0" dur="1s" repeatCount="indefinite" />
            </path>
            <text x="80" y="100" fill="#16A34A" fontSize="14" fontWeight="bold">USB</text>
          </svg>
        </div>

        {/* USB Kulaklık - Sağ Alt */}
        <div className="absolute bottom-0 right-0">
          <div className="bg-white rounded-lg p-4 shadow-lg border-2 border-orange-500 w-40">
            <Headphones className="w-10 h-10 text-orange-600 mx-auto mb-2" />
            <p className="text-center font-bold text-gray-900 text-sm">USB Kulaklık</p>
            <div className="bg-orange-100 rounded px-2 py-1 mt-2">
              <p className="text-xs text-center text-orange-800 font-semibold">ARKA USB Port</p>
            </div>
          </div>
          {/* USB Kulaklık Ok İşareti */}
          <svg className="absolute bottom-20 right-32 w-64 h-32" style={{ pointerEvents: 'none' }}>
            <defs>
              <marker id="arrowhead-headset" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#EA580C" />
              </marker>
            </defs>
            <path d="M 264 128 Q 164 90, 64 50" stroke="#EA580C" strokeWidth="3" fill="none" markerEnd="url(#arrowhead-headset)" strokeDasharray="5,5">
              <animate attributeName="stroke-dashoffset" from="10" to="0" dur="1s" repeatCount="indefinite" />
            </path>
            <text x="155" y="100" fill="#EA580C" fontSize="14" fontWeight="bold">USB</text>
          </svg>
        </div>

        {/* Ethernet - Üst Orta */}
        <div className="absolute -top-24 left-1/2 transform -translate-x-1/2">
          <div className="bg-white rounded-lg p-4 shadow-lg border-2 border-cyan-500 w-40">
            <Wifi className="w-10 h-10 text-cyan-600 mx-auto mb-2" />
            <p className="text-center font-bold text-gray-900 text-sm">İnternet (Modem)</p>
            <div className="bg-cyan-100 rounded px-2 py-1 mt-2">
              <p className="text-xs text-center text-cyan-800 font-semibold">Ethernet Kablo</p>
            </div>
          </div>
          {/* Ethernet Ok İşareti */}
          <svg className="absolute top-24 left-1/2 transform -translate-x-1/2 w-32 h-64" style={{ pointerEvents: 'none' }}>
            <defs>
              <marker id="arrowhead-eth" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#0891B2" />
              </marker>
            </defs>
            <path d="M 64 0 L 64 200" stroke="#0891B2" strokeWidth="3" fill="none" markerEnd="url(#arrowhead-eth)" strokeDasharray="5,5">
              <animate attributeName="stroke-dashoffset" from="10" to="0" dur="1s" repeatCount="indefinite" />
            </path>
            <text x="70" y="100" fill="#0891B2" fontSize="14" fontWeight="bold">RJ45</text>
          </svg>
        </div>

        {/* Güç - Alt Orta */}
        <div className="absolute -bottom-24 left-1/2 transform -translate-x-1/2">
          <div className="bg-white rounded-lg p-4 shadow-lg border-2 border-red-500 w-40">
            <Plug className="w-10 h-10 text-red-600 mx-auto mb-2" />
            <p className="text-center font-bold text-gray-900 text-sm">Elektrik Prizi</p>
            <div className="bg-red-100 rounded px-2 py-1 mt-2">
              <p className="text-xs text-center text-red-800 font-semibold">Güç Kablosu</p>
            </div>
          </div>
          {/* Güç Ok İşareti */}
          <svg className="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-32 h-64" style={{ pointerEvents: 'none' }}>
            <defs>
              <marker id="arrowhead-power" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#DC2626" />
              </marker>
            </defs>
            <path d="M 64 256 L 64 50" stroke="#DC2626" strokeWidth="3" fill="none" markerEnd="url(#arrowhead-power)" strokeDasharray="5,5">
              <animate attributeName="stroke-dashoffset" from="10" to="0" dur="1s" repeatCount="indefinite" />
            </path>
            <text x="70" y="160" fill="#DC2626" fontSize="14" fontWeight="bold">Güç</text>
          </svg>
        </div>
      </div>

      {/* Lejant */}
      <div className="mt-96 pt-20 grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm text-gray-700">VGA Bağlantı</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-purple-500 rounded"></div>
          <span className="text-sm text-gray-700">HDMI Bağlantı</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-700">USB (Klavye/Mouse)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span className="text-sm text-gray-700">USB (Kulaklık - ARKA)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-cyan-500 rounded"></div>
          <span className="text-sm text-gray-700">Ethernet (İnternet)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm text-gray-700">Güç Kablosu</span>
        </div>
      </div>
    </div>
  );
};

export default ConnectionDiagram;
