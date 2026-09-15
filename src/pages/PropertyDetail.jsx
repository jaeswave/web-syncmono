import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';

const PLATFORMS = ['airbnb', 'booking', 'vrbo', 'expedia', 'other'];

const platformGuides = {
  airbnb: {
    icon: '🏠',
    color: 'bg-red-50 border-red-200',
    steps: [
      'Go to airbnb.com and log into your account',
      'Click on your listing → Manage listing',
      'Click "Availability" in the top menu',
      'Scroll down and click "Export Calendar"',
      'Copy the .ics URL that appears',
      'Paste it in the iCal URL field below',
    ],
  },
  booking: {
    icon: '🌐',
    color: 'bg-blue-50 border-blue-200',
    steps: [
      'Log in to Booking.com Extranet',
      'Go to your property → Calendar',
      'Click "Sync calendars" or "Export"',
      'Copy the iCal/ICS export link',
      'Paste it in the iCal URL field below',
    ],
  },
  vrbo: {
    icon: '🏡',
    color: 'bg-green-50 border-green-200',
    steps: [
      'Log in to vrbo.com owner dashboard',
      'Select your property',
      'Go to Calendars → Import/Export',
      'Click "Export your calendar"',
      'Copy the .ics URL',
      'Paste it in the iCal URL field below',
    ],
  },
  expedia: {
    icon: '✈️',
    color: 'bg-yellow-50 border-yellow-200',
    steps: [
      'Log in to Expedia Partner Central',
      'Go to your property → Calendar',
      'Find the iCal export option',
      'Copy the calendar URL',
      'Paste it in the iCal URL field below',
    ],
  },
};

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showAddCalendar, setShowAddCalendar] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('airbnb');
  const [calForm, setCalForm] = useState({ icalUrl: '', listingUrl: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    Promise.all([
      api.get(`/properties/${id}`),
      api.get(`/bookings/property/${id}`),
    ]).then(([propRes, bookRes]) => {
      setProperty(propRes.data);
      setBookings(bookRes.data);
    }).catch(() => navigate('/properties'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.post(`/sync/property/${id}`);
      const newCount = res.data.reduce((s, r) => s + (r.newBookings || 0), 0);
      toast.success(newCount > 0 ? `${newCount} new booking(s) found!` : 'Sync complete — no new bookings');
      load();
    } catch {
      toast.error('Sync failed. Check your iCal URLs.');
    } finally {
      setSyncing(false);
    }
  };

  const handleAddCalendar = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/properties/${id}/calendars`, {
        platform: selectedPlatform,
        icalUrl: calForm.icalUrl,
        listingUrl: calForm.listingUrl,
      });
      toast.success(`${selectedPlatform} calendar connected!`);
      setShowAddCalendar(false);
      setCalForm({ icalUrl: '', listingUrl: '' });
      load();
    } catch {
      toast.error('Failed to add calendar');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCalendar = async (calId) => {
    if (!confirm('Remove this calendar?')) return;
    try {
      await api.delete(`/properties/${id}/calendars/${calId}`);
      toast.success('Calendar removed');
      load();
    } catch {
      toast.error('Failed to remove calendar');
    }
  };

  const guide = platformGuides[selectedPlatform];

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;
  if (!property) return null;

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <button onClick={() => navigate('/properties')} className="text-sm text-gray-400 hover:text-gray-600 mb-2 block">← Back to Properties</button>
          <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
          {property.address && <p className="text-gray-400 mt-1">{property.address}</p>}
        </div>
        <button
          onClick={handleSync}
          disabled={syncing || property.calendars?.length === 0}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {syncing ? (
            <><span className="animate-spin">⏳</span> Syncing...</>
          ) : (
            <><span>🔄</span> Sync Now</>
          )}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Connected Platforms */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900">Connected Platforms</h2>
            <button onClick={() => setShowAddCalendar(true)} className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-100">
              + Add Platform
            </button>
          </div>

          {property.calendars?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm mb-3">No platforms connected yet</p>
              <button onClick={() => setShowAddCalendar(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">
                Connect Your First Platform
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {property.calendars.map(cal => (
                <div key={cal.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <span className="text-xl">{platformGuides[cal.platform]?.icon || '📅'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 capitalize">{cal.platform}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{cal.icalUrl}</p>
                    {cal.lastSyncedAt && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${cal.lastSyncStatus === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <p className="text-xs text-gray-400">
                          Last synced: {new Date(cal.lastSyncedAt).toLocaleString('en-NG')}
                        </p>
                      </div>
                    )}
                    {cal.lastSyncError && (
                      <p className="text-xs text-red-500 mt-1">⚠️ {cal.lastSyncError}</p>
                    )}
                  </div>
                  <button onClick={() => handleDeleteCalendar(cal.id)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Booking Stats */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-5">Booking Overview</h2>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-blue-700">{bookings.length}</div>
              <div className="text-xs text-blue-500 mt-1">Total Bookings</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-700">{property.calendars?.length || 0}</div>
              <div className="text-xs text-green-500 mt-1">Platforms Synced</div>
            </div>
          </div>

          {/* Platform breakdown */}
          {bookings.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">By Platform</p>
              {PLATFORMS.map(p => {
                const count = bookings.filter(b => b.sourcePlatform === p).length;
                if (count === 0) return null;
                return (
                  <div key={p} className="flex items-center gap-3 mb-2">
                    <span className="text-sm w-20 capitalize text-gray-600">{p}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(count / bookings.length) * 100}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bookings list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-5">All Bookings for This Property</h2>
        {bookings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No bookings detected yet. Click "Sync Now" to check.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 text-gray-400 font-medium">Platform</th>
                  <th className="text-left py-3 text-gray-400 font-medium">Guest</th>
                  <th className="text-left py-3 text-gray-400 font-medium">Check-in</th>
                  <th className="text-left py-3 text-gray-400 font-medium">Check-out</th>
                  <th className="text-left py-3 text-gray-400 font-medium">Nights</th>
                  <th className="text-left py-3 text-gray-400 font-medium">Detected</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => {
                  const nights = Math.ceil((new Date(b.checkOut) - new Date(b.checkIn)) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 capitalize font-semibold text-blue-700">{b.sourcePlatform}</td>
                      <td className="py-3 text-gray-700">{b.guestName || '—'}</td>
                      <td className="py-3 text-gray-700">{new Date(b.checkIn).toLocaleDateString('en-NG')}</td>
                      <td className="py-3 text-gray-700">{new Date(b.checkOut).toLocaleDateString('en-NG')}</td>
                      <td className="py-3 text-gray-500">{nights}N</td>
                      <td className="py-3 text-gray-400 text-xs">{new Date(b.detectedAt).toLocaleDateString('en-NG')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Calendar Modal */}
      {showAddCalendar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Connect a Platform</h2>

            {/* Platform selector */}
            <div className="flex flex-wrap gap-2 mb-5">
              {PLATFORMS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPlatform(p)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all capitalize ${
                    selectedPlatform === p
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {platformGuides[p]?.icon || '📅'} {p}
                </button>
              ))}
            </div>

            {/* Guide */}
            {guide && (
              <div className={`rounded-xl border p-4 mb-5 ${guide.color}`}>
                <p className="text-sm font-bold text-gray-700 mb-2">📖 How to get your {selectedPlatform} iCal URL:</p>
                <ol className="space-y-1">
                  {guide.steps.map((step, i) => (
                    <li key={i} className="text-sm text-gray-600 flex gap-2">
                      <span className="font-bold text-gray-400 flex-shrink-0">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <form onSubmit={handleAddCalendar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">iCal URL (required) *</label>
                <input
                  required
                  placeholder="https://www.airbnb.com/calendar/ical/..."
                  value={calForm.icalUrl}
                  onChange={e => setCalForm({ ...calForm, icalUrl: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">The .ics export URL from your platform settings</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Listing URL (optional)</label>
                <input
                  placeholder="https://www.airbnb.com/rooms/..."
                  value={calForm.listingUrl}
                  onChange={e => setCalForm({ ...calForm, listingUrl: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddCalendar(false)} className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Connecting...' : 'Connect Calendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
