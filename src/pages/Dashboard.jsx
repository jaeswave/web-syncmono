import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../hooks/useAuth';

const platformColors = {
  airbnb: 'bg-red-100 text-red-700',
  booking: 'bg-blue-100 text-blue-700',
  vrbo: 'bg-green-100 text-green-700',
  expedia: 'bg-yellow-100 text-yellow-700',
  other: 'bg-gray-100 text-gray-700',
};

const platformIcons = {
  airbnb: '🏠',
  booking: '🌐',
  vrbo: '🏡',
  expedia: '✈️',
  other: '📅',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/properties'),
      api.get('/bookings'),
    ]).then(([propsRes, bookRes]) => {
      setProperties(propsRes.data);
      setBookings(bookRes.data.slice(0, 10));
    }).finally(() => setLoading(false));
  }, []);

  const totalBookings = bookings.length;
  const activeProperties = properties.filter(p => p.isActive).length;
  const totalCalendars = properties.reduce((sum, p) => sum + (p.calendars?.length || 0), 0);

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Good day, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your properties</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Active Properties', value: activeProperties, icon: '🏠', color: 'bg-blue-50 border-blue-100' },
          { label: 'Connected Calendars', value: totalCalendars, icon: '📅', color: 'bg-green-50 border-green-100' },
          { label: 'Bookings Tracked', value: totalBookings, icon: '🎉', color: 'bg-purple-50 border-purple-100' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className={`${color} border rounded-2xl p-6`}>
            <div className="text-3xl mb-2">{icon}</div>
            <div className="text-3xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Properties */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900">Your Properties</h2>
            <Link to="/properties" className="text-sm text-blue-600 hover:underline">View all →</Link>
          </div>

          {properties.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No properties yet</p>
              <Link to="/properties" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700">
                Add Your First Property
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {properties.slice(0, 5).map(p => (
                <Link key={p.id} to={`/properties/${p.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl">🏠</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.calendars?.length || 0} platform{p.calendars?.length !== 1 ? 's' : ''} connected</p>
                  </div>
                  <div className="flex gap-1">
                    {p.calendars?.map(c => (
                      <span key={c.id} className={`text-xs px-2 py-0.5 rounded-full font-medium ${platformColors[c.platform]}`}>
                        {platformIcons[c.platform]}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900">Recent Bookings</h2>
            <Link to="/bookings" className="text-sm text-blue-600 hover:underline">View all →</Link>
          </div>

          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-3">😴</p>
              <p className="text-gray-400 text-sm">No bookings detected yet.</p>
              <p className="text-gray-400 text-xs mt-1">Sync runs every 15 minutes automatically.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map(b => (
                <div key={b.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                  <span className="text-xl">{platformIcons[b.sourcePlatform]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${platformColors[b.sourcePlatform]}`}>
                        {b.sourcePlatform}
                      </span>
                      {b.guestName && <p className="text-sm font-semibold text-gray-800 truncate">{b.guestName}</p>}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(b.checkIn).toLocaleDateString('en-NG')} → {new Date(b.checkOut).toLocaleDateString('en-NG')}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(b.detectedAt).toLocaleDateString('en-NG')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* How sync works */}
      {properties.length === 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-6">
          <h3 className="font-bold text-blue-900 mb-3">🚀 How SyncStay Works</h3>
          <div className="grid sm:grid-cols-4 gap-4 text-center">
            {[
              { step: '1', text: 'Add your property' },
              { step: '2', text: 'Paste your iCal URLs from each platform' },
              { step: '3', text: 'SyncStay checks every 15 minutes' },
              { step: '4', text: 'Get email alerts when a booking is detected' },
            ].map(({ step, text }) => (
              <div key={step} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-2">{step}</div>
                <p className="text-sm text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
