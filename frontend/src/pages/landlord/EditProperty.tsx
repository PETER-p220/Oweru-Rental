import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, MapPin, DollarSign, Bed, Bath, Square, 
  Check, X, Plus, Trash2, AlertCircle,
  ArrowLeft, ArrowRight, Building, Warehouse, Store, Upload
} from 'lucide-react';
import Api from '../../services/api';

interface ImageFile {
  file: File;
  preview: string;
}

const EditProperty = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  console.log('EditProperty - Auth check:', { user, isAuthenticated, id });
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [propertyId, setPropertyId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    title: '',
    description: '',
    type: 'apartment',
    location: '',
    address: '',
    
    // Step 2: Property Details
    price: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    
    // Step 3: Additional Info
    amenities: [] as string[],
    featured: false,
    
    // Images
    images: [] as ImageFile[],
    imagePreviews: [] as string[]
  });

  // Load existing property data
  useEffect(() => {
    if (id) {
      loadProperty(parseInt(id));
    }
  }, [id]);

  const loadProperty = async (propertyId: number) => {
    try {
      setIsLoading(true);
      console.log('Loading property with ID:', propertyId);
      
      // For now, just set the ID and show a simple form
      setPropertyId(propertyId);
      
      // TODO: Implement actual API call
      // const response = await Api.getProperty(propertyId);
      // if (response.data) {
      //   setFormData(prev => ({
      //     ...prev,
      //     title: response.data.title,
      //     description: response.data.description,
      //     type: response.data.type,
      //     location: response.data.location,
      //     address: response.data.address,
      //     price: response.data.price.toString(),
      //     bedrooms: response.data.bedrooms.toString(),
      //     bathrooms: response.data.bathrooms.toString(),
      //     area: response.data.area.toString(),
      //     amenities: response.data.amenities || [],
      //     featured: response.data.featured || false,
      //     imagePreviews: response.data.images || []
      //   }));
      // }
      
    } catch (error) {
      console.error('Error loading property:', error);
      setErrors(['Failed to load property']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages: ImageFile[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages],
      imagePreviews: [...prev.imagePreviews, ...newImages.map(img => img.preview)]
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors([]);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('bedrooms', formData.bedrooms);
      formDataToSend.append('bathrooms', formData.bathrooms);
      formDataToSend.append('area', formData.area);
      formDataToSend.append('featured', formData.featured.toString());
      formDataToSend.append('amenities', JSON.stringify(formData.amenities));

      formData.images.forEach((imageFile) => {
        formDataToSend.append('images[]', imageFile.file);
      });

      // You'll need to implement this API call
      // const response = await Api.updateProperty(propertyId!, formDataToSend);
      
      console.log('Updating property:', formDataToSend);
      
      // For now, just navigate back
      navigate('/dashboard/landlord/my-properties');
      
    } catch (error: any) {
      console.error('Error updating property:', error);
      if (error.response?.data?.errors) {
        const errorValues = Object.values(error.response.data.errors) as string[];
        setErrors(errorValues.flat());
      } else {
        setErrors(['Failed to update property. Please try again.']);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  if (isLoading && !propertyId) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#0e0e0e',
        color: '#e8e4dc',
        fontFamily: 'DM Sans, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #c9a84c',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          Loading property...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0e0e0e',
      color: '#e8e4dc',
      fontFamily: 'DM Sans, sans-serif',
      padding: '20px'
    }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Link
            to="/dashboard/landlord/my-properties"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#e8e4dc',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            <ArrowLeft size={20} />
            Back to Properties
          </Link>
          
          <h1 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '600',
            color: '#e8e4dc'
          }}>
            Edit Property
          </h1>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        display: 'flex',
        marginBottom: '32px',
        position: 'relative'
      }}>
        {[1, 2, 3].map((stepNumber) => (
          <div key={stepNumber} style={{
            flex: 1,
            height: '2px',
            backgroundColor: stepNumber <= step ? '#c9a84c' : '#333',
            position: 'relative'
          }}>
            {stepNumber === 1 && (
              <div style={{
                position: 'absolute',
                left: '0',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: step >= 1 ? '#c9a84c' : '#333',
                border: '2px solid #0e0e0e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold'
              }}>
                1
              </div>
            )}
            {stepNumber === 2 && (
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: step >= 2 ? '#c9a84c' : '#333',
                border: '2px solid #0e0e0e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold'
              }}>
                2
              </div>
            )}
            {stepNumber === 3 && (
              <div style={{
                position: 'absolute',
                right: '0',
                top: '50%',
                transform: 'translate(50%, -50%)',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: step >= 3 ? '#c9a84c' : '#333',
                border: '2px solid #0e0e0e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold'
              }}>
                3
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        padding: '32px',
        marginBottom: '32px'
      }}>
        {step === 1 && (
          <div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '24px',
              color: '#e8e4dc'
            }}>
              Basic Information
            </h2>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#e8e4dc'
                }}>
                  Property Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter property title"
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#0e0e0e',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#e8e4dc',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#e8e4dc'
                }}>
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your property"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#0e0e0e',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#e8e4dc',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#e8e4dc'
                  }}>
                    Property Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#0e0e0e',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      color: '#e8e4dc',
                      fontSize: '14px'
                    }}
                  >
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="villa">Villa</option>
                    <option value="studio">Studio</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#e8e4dc'
                  }}>
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="City, State"
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#0e0e0e',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      color: '#e8e4dc',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#e8e4dc'
                }}>
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Full address"
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#0e0e0e',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#e8e4dc',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '24px',
              color: '#e8e4dc'
            }}>
              Property Details
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#e8e4dc'
                }}>
                  Price ($) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#0e0e0e',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#e8e4dc',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#e8e4dc'
                }}>
                  Area (sq ft) *
                </label>
                <input
                  type="number"
                  value={formData.area}
                  onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#0e0e0e',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#e8e4dc',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#e8e4dc'
                }}>
                  Bedrooms *
                </label>
                <input
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: e.target.value }))}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#0e0e0e',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#e8e4dc',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#e8e4dc'
                }}>
                  Bathrooms *
                </label>
                <input
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: e.target.value }))}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#0e0e0e',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#e8e4dc',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '24px',
              color: '#e8e4dc'
            }}>
              Additional Information
            </h2>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#e8e4dc'
              }}>
                Property Images
              </label>
              <div style={{
                border: '2px dashed #333',
                borderRadius: '8px',
                padding: '32px',
                textAlign: 'center',
                backgroundColor: '#0e0e0e',
                marginBottom: '20px'
              }}>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    color: '#e8e4dc'
                  }}
                >
                  <Upload size={32} />
                  <span>Click to upload images</span>
                  <span style={{ fontSize: '12px', opacity: 0.7 }}>
                    PNG, JPG up to 10MB each
                  </span>
                </label>
              </div>

              {formData.imagePreviews.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '12px',
                  marginTop: '16px'
                }}>
                  {formData.imagePreviews.map((preview, index) => (
                    <div key={index} style={{
                      position: 'relative',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '120px',
                          objectFit: 'cover'
                        }}
                        loading="lazy"
                        decoding="async"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          backgroundColor: 'rgba(239, 68, 68, 0.9)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: 'white'
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {errors.length > 0 && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            {errors.map((error, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                color: '#ef4444',
                fontSize: '14px'
              }}>
                <AlertCircle size={16} />
                {error}
              </div>
            ))}
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '32px'
        }}>
          <button
            onClick={prevStep}
            disabled={step === 1}
            style={{
              padding: '12px 24px',
              backgroundColor: step === 1 ? '#333' : '#c9a84c',
              color: '#080808',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: step === 1 ? 'not-allowed' : 'pointer',
              opacity: step === 1 ? 0.5 : 1
            }}
          >
            Previous
          </button>

          {step < 3 ? (
            <button
              onClick={nextStep}
              style={{
                padding: '12px 24px',
                backgroundColor: '#c9a84c',
                color: '#080808',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              style={{
                padding: '12px 24px',
                backgroundColor: isLoading ? '#333' : '#c9a84c',
                color: '#080808',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? 'Updating...' : 'Update Property'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditProperty;
