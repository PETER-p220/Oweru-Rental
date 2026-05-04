import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Filter, Search, Building2, DollarSign, Users, Eye, TrendingUp, TrendingDown } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

interface Report {
  id: number;
  title: string;
  type: string;
  period: string;
  generated_at: string;
  file_url?: string;
  data?: any;
}

interface Property {
  id: number;
  title: string;
  type: string;
  location: string;
  status: string;
}

const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');

  useEffect(() => {
    fetchReports();
    fetchProperties();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/commercial/reports`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/commercial/properties?per_page=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProperties(data.data);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const generateReport = async (type: string, period: string, propertyId?: number) => {
    setGenerating(true);
    
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        type,
        period,
        ...(propertyId && { property_id: propertyId.toString() })
      });

      const response = await fetch(`${API_BASE}/api/commercial/reports/generate?${params}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const newReport = await response.json();
        setReports(prev => [newReport, ...prev]);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = async (reportId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/commercial/reports/${reportId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${reportId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-TZ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'revenue': return <DollarSign className="w-5 h-5" />;
      case 'bookings': return <Users className="w-5 h-5" />;
      case 'performance': return <TrendingUp className="w-5 h-5" />;
      case 'analytics': return <Eye className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getReportColor = (type: string) => {
    switch (type) {
      case 'revenue': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'bookings': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'performance': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'analytics': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    const matchesPeriod = periodFilter === 'all' || report.period === periodFilter;
    return matchesSearch && matchesType && matchesPeriod;
  });

  const reportTypes = [
    { value: 'revenue', label: 'Revenue Report' },
    { value: 'bookings', label: 'Booking Report' },
    { value: 'performance', label: 'Performance Report' },
    { value: 'analytics', label: 'Analytics Report' }
  ];

  const periods = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="text-white">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Reports</h1>
          <p className="text-gray-400">Generate and download business reports</p>
        </div>
      </div>

      {/* Quick Report Generation */}
      <div className="bg-navy-800 border border-navy-700 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-6">Generate New Report</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <select
            id="report-type"
            className="px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white focus:outline-none focus:border-gold"
          >
            <option value="">Select Report Type</option>
            {reportTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

          <select
            id="report-period"
            className="px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white focus:outline-none focus:border-gold"
          >
            <option value="">Select Period</option>
            {periods.map(period => (
              <option key={period.value} value={period.value}>{period.label}</option>
            ))}
          </select>

          <select
            id="property-filter"
            className="px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white focus:outline-none focus:border-gold"
          >
            <option value="">All Properties</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>{property.title}</option>
            ))}
          </select>

          <button
            onClick={() => {
              const type = (document.getElementById('report-type') as HTMLSelectElement)?.value;
              const period = (document.getElementById('report-period') as HTMLSelectElement)?.value;
              const propertyId = (document.getElementById('property-filter') as HTMLSelectElement)?.value;
              
              if (type && period) {
                generateReport(type, period, propertyId ? parseInt(propertyId) : undefined);
              }
            }}
            disabled={generating}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gold text-navy-900 rounded-lg font-semibold hover:bg-gold-lt transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>Generating...</>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Generate Report
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {reportTypes.slice(0, 4).map((type, index) => (
            <button
              key={type.value}
              onClick={() => generateReport(type.value, 'monthly')}
              disabled={generating}
              className="p-4 bg-navy-700/50 border border-navy-600 rounded-lg hover:border-gold/30 transition-colors disabled:opacity-50"
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`p-2 rounded-lg ${getReportColor(type.value)}`}>
                  {getReportIcon(type.value)}
                </div>
                <span className="text-white font-medium">{type.label}</span>
                <span className="text-xs text-gray-400">Monthly</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-navy-800 border border-navy-700 rounded-xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold"
            />
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white focus:outline-none focus:border-gold"
          >
            <option value="all">All Types</option>
            {reportTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white focus:outline-none focus:border-gold"
          >
            <option value="all">All Periods</option>
            {periods.map(period => (
              <option key={period.value} value={period.value}>{period.label}</option>
            ))}
          </select>

          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>{filteredReports.length} reports</span>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No reports found</h3>
            <p className="text-gray-400 mb-6">Generate your first report to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-navy-700 border-b border-navy-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Report
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Generated
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-navy-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getReportColor(report.type)}`}>
                          {getReportIcon(report.type)}
                        </div>
                        <div>
                          <div className="text-white font-medium">{report.title}</div>
                          <div className="text-gray-400 text-sm">Report #{report.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getReportColor(report.type)}`}>
                        {reportTypes.find(t => t.value === report.type)?.label || report.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {periods.find(p => p.value === report.period)?.label || report.period}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {formatDate(report.generated_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => downloadReport(report.id)}
                        className="flex items-center gap-2 px-3 py-1 bg-gold/10 text-gold border border-gold/20 rounded-lg hover:bg-gold/20 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
