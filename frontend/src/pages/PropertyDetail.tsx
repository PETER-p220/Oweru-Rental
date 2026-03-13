import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Home, 
  Phone, 
  Mail, 
  Calendar,
  Shield,
  CheckCircle,
  Heart,
  Share2,
  QrCode,
  Download,
  ArrowLeft
} from 'lucide-react';
import QRCode from 'qrcode';
import type { Property } from '../types';

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Mock property data - in real app this would come from API
  const property: Property = {
    id: id || '1',
    title: 'Modern 2-Bedroom Apartment in Masaki',
    description: `Beautiful apartment with ocean view, fully furnished with modern amenities. 
    This spacious apartment features large windows that allow plenty of natural light, 
    creating a bright and welcoming atmosphere. The open-plan living area is perfect for 
    entertaining guests, while the bedrooms offer privacy and comfort.`,
    price: 800000,
    address: 'Masaki, Dar es Salaam, Tanzania',
    bedrooms: 2,
    bathrooms: 2,
    area: 120,
    type: 'apartment',
    furnished: true,
    images: [
      '/api/placeholder/800/600',
      '/api/placeholder/800/600',
      '/api/placeholder/800/600',
      '/api/placeholder/800/600'
    ],
    owner: {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '+255 712 345 678',
      verified: true
    },
    dalali: {
      id: '1',
      name: 'Michael Agent',
      email: 'michael@oweru.com',
      phone: '+255 714 567 890',
      code: 'DAL001',
      verified: true,
      commission: 10
    },
    status: 'available',
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const features = [
    'Air Conditioning',
    '24/7 Security',
    'Parking Space',
    'Balcony',
    'Kitchen Appliances',
    'High-Speed Internet',
    'Backup Generator',
    'Water Storage'
  ];

  const amenities = [
    'Gym Access',
    'Swimming Pool',
    'Children Playground',
    'Community Center',
    'Shopping Nearby',
    'Public Transport Access'
  ];

  const generateQRCode = async () => {
    try {
      // Generate unique tracking URL
      const trackingUrl = `https://oweru.co/p/${property.id}?ref=${property.dalali?.code || 'DIRECT'}_OWERU`;
      const qrDataUrl = await QRCode.toDataURL(trackingUrl);
      setQrCodeUrl(qrDataUrl);
      setShowQrModal(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `property-${property.id}-qrcode.png`;
      link.click();
    }
  };

  const shareProperty = async () => {
    const shareUrl = `https://oweru.co/p/${property.id}?ref=${property.dalali?.code || 'DIRECT'}_OWERU`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: `Check out this property: ${property.title} - ${property.address}`,
          url: shareUrl
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      alert('Property link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link 
          to="/properties"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-oweru-gold mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Properties
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="relative">
                <img 
                  src={property.images[0]} 
                  alt={property.title}
                  className="w-full h-96 object-cover"
                />
                {property.featured && (
                  <div className="absolute top-4 left-4 bg-oweru-gold text-white px-3 py-1 rounded">
                    Featured
                  </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={() => setIsSaved(!isSaved)}
                    className="p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                  >
                    <Heart 
                      size={20} 
                      className={isSaved ? 'text-red-500 fill-red-500' : 'text-gray-600'} 
                    />
                  </button>
                  <button 
                    onClick={shareProperty}
                    className="p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                  >
                    <Share2 size={20} className="text-gray-600" />
                  </button>
                  <button 
                    onClick={generateQRCode}
                    className="p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                  >
                    <QrCode size={20} className="text-gray-600" />
                  </button>
                </div>
              </div>
              
              {/* Thumbnail Gallery */}
              <div className="grid grid-cols-4 gap-2 p-4">
                {property.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Property view ${index + 1}`}
                    className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-75 transition-opacity"
                  />
                ))}
              </div>
            </div>

            {/* Property Details */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {property.title}
                  </h1>
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin size={16} className="mr-2" />
                    {property.address}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-oweru-gold">
                    {property.price.toLocaleString()} TZS
                  </div>
                  <div className="text-sm text-gray-500">per month</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-2 text-gray-700">
                  <Bed size={20} className="text-oweru-gold" />
                  <span>{property.bedrooms} Bedrooms</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Bath size={20} className="text-oweru-gold" />
                  <span>{property.bathrooms} Bathrooms</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Square size={20} className="text-oweru-gold" />
                  <span>{property.area} m²</span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Description</h3>
                <p className="text-gray-600 leading-relaxed">
                  {property.description}
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Features</h3>
                <div className="grid grid-cols-2 gap-3">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Amenities</h3>
                <div className="grid grid-cols-2 gap-3">
                  {amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Property Information</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Property Type</span>
                  <span className="font-medium capitalize">{property.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium text-green-600 capitalize">{property.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Furnished</span>
                  <span className="font-medium">{property.furnished ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Listed</span>
                  <span className="font-medium">{property.createdAt.toLocaleDateString()}</span>
                </div>
              </div>

              {/* Owner Information */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield size={16} className="text-oweru-gold" />
                  Property Owner
                </h4>
                <div className="space-y-2">
                  <div className="font-medium">{property.owner.name}</div>
                  {property.owner.verified && (
                    <div className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle size={14} />
                      Verified Owner
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={14} />
                    {property.owner.phone}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={14} />
                    {property.owner.email}
                  </div>
                </div>
              </div>

              {/* Agent Information */}
              {property.dalali && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Shield size={16} className="text-oweru-gold" />
                    Listed by Agent
                  </h4>
                  <div className="space-y-2">
                    <div className="font-medium">{property.dalali.name}</div>
                    {property.dalali.verified && (
                      <div className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle size={14} />
                        Verified Agent
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone size={14} />
                      {property.dalali.phone}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail size={14} />
                      {property.dalali.email}
                    </div>
                    <div className="text-sm text-gray-500">
                      Agent Code: {property.dalali.code}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button className="w-full py-3 bg-oweru-gold text-white rounded-lg hover:bg-oweru-dark transition-colors font-medium">
                Apply Now
              </button>
              <button className="w-full py-3 border border-oweru-gold text-oweru-gold rounded-lg hover:bg-oweru-gold hover:text-white transition-colors font-medium">
                Schedule Viewing
              </button>
              <button className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                Contact Owner
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Property QR Code</h3>
            <p className="text-sm text-gray-600 mb-4">
              Scan this code to view property details and track referrals
            </p>
            {qrCodeUrl && (
              <div className="flex justify-center mb-4">
                <img src={qrCodeUrl} alt="Property QR Code" className="w-48 h-48" />
              </div>
            )}
            <div className="text-xs text-gray-500 text-center mb-4 break-all">
              https://oweru.co/p/{property.id}?ref={property.dalali?.code || 'DIRECT'}_OWERU
            </div>
            <div className="flex gap-3">
              <button
                onClick={downloadQRCode}
                className="flex-1 py-2 bg-oweru-gold text-white rounded hover:bg-oweru-dark transition-colors flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Download
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetail;
