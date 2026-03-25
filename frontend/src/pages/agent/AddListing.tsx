import React, { useState } from 'react';
import { Building, MapPin, Bed, Bath, Square, Upload, Plus, X, Save } from 'lucide-react';

const AddListing = () => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'apartment',
    price: '',
    location: '',
    address: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    description: '',
    furnished: false,
    featured: false,
  });

  const [images, setImages] = useState<File[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting listing:', formData, images);
    // Handle form submission
  };

  return (
    <div style={{ padding: '20px', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        .add-listing {
          max-width: 800px;
          margin: 0 auto;
        }
        .form-header {
          margin-bottom: 32px;
        }
        .form-title {
          font-size: 28px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 8px;
        }
        .form-subtitle {
          color: #9ca3af;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
        }
        .form-group.full-width {
          grid-column: 1 / -1;
        }
        .form-label {
          font-size: 14px;
          font-weight: 500;
          color: #fff;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .form-input, .form-select, .form-textarea {
          background: #1a1a1a;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 12px;
          color: #fff;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: #38bdf8;
        }
        .form-textarea {
          min-height: 120px;
          resize: vertical;
        }
        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .checkbox-input {
          width: 18px;
          height: 18px;
          accent-color: #38bdf8;
        }
        .image-upload {
          border: 2px dashed rgba(255,255,255,0.2);
          border-radius: 12px;
          padding: 32px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 20px;
        }
        .image-upload:hover {
          border-color: #38bdf8;
          background: rgba(56,189,248,0.05);
        }
        .image-preview {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }
        .image-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          background: #1a1a1a;
        }
        .image-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .image-remove {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0,0,0,0.7);
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #fff;
        }
        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 32px;
        }
        .btn {
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-primary {
          background: #38bdf8;
          color: #000;
        }
        .btn-primary:hover {
          background: #0ea5e9;
        }
        .btn-secondary {
          background: transparent;
          color: #9ca3af;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .btn-secondary:hover {
          color: #fff;
          border-color: rgba(255,255,255,0.2);
        }
      `}</style>

      <div className="add-listing">
        <div className="form-header">
          <h1 className="form-title">Add New Listing</h1>
          <p className="form-subtitle">Create a new property listing for your clients</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                <Building size={16} />
                Property Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., Modern 3BR Apartment"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Property Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="studio">Studio</option>
                <option value="villa">Villa</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <DollarSign size={16} />
                Monthly Rent (TZS)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., 500000"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <MapPin size={16} />
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., Masaki, Dar es Salaam"
                required
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">
                <MapPin size={16} />
                Full Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., Plot 123, Masaki Road"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Bed size={16} />
                Bedrooms
              </label>
              <input
                type="number"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., 3"
                min="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Bath size={16} />
                Bathrooms
              </label>
              <input
                type="number"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., 2"
                min="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Square size={16} />
                Area (m²)
              </label>
              <input
                type="number"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., 120"
                min="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Features</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="furnished"
                    name="furnished"
                    checked={formData.furnished}
                    onChange={handleInputChange}
                    className="checkbox-input"
                  />
                  <label htmlFor="furnished" style={{ color: '#fff', cursor: 'pointer' }}>
                    Furnished
                  </label>
                </div>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="featured"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="checkbox-input"
                  />
                  <label htmlFor="featured" style={{ color: '#fff', cursor: 'pointer' }}>
                    Featured Listing
                  </label>
                </div>
              </div>
            </div>

            <div className="form-group full-width">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="Describe the property, its features, location benefits, etc."
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">
                <Upload size={16} />
                Property Images
              </label>
              <div className="image-upload">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  id="image-upload"
                />
                <label htmlFor="image-upload" style={{ cursor: 'pointer' }}>
                  <Upload size={32} style={{ color: '#38bdf8', marginBottom: '8px' }} />
                  <div style={{ color: '#fff', marginBottom: '4px' }}>Click to upload images</div>
                  <div style={{ color: '#9ca3af', fontSize: '12px' }}>
                    PNG, JPG up to 10MB each
                  </div>
                </label>
              </div>

              {images.length > 0 && (
                <div className="image-preview">
                  {images.map((image, index) => (
                    <div key={index} className="image-item">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                      />
                      <button
                        type="button"
                        className="image-remove"
                        onClick={() => removeImage(index)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              Create Listing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddListing;
