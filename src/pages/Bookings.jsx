import { useState, useEffect } from 'react';
import api from '../api/client';

const platformColors = { airbnb: 'bg-red-100 text-red-700', booking: 'bg-blue-100 text-blue-700', vrbo: 'bg-green-100 text-green-700', expedia: 'bg-yellow-100 text-yellow-700', other: 'bg-gray-100 text-gray-700' };

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/bookings').then(r => setBookings(r.data)).finally(() => setLoading(false));
  }, []);

  const platforms = [...new Set(bookings.map(b => b.sourcePlatform))];
  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.sourcePlatform === filter);

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
        <p className="text-gray-500 mt-1">{bookings.length} total booking{bookings.length !== 1 ? 's' : ''} detected across all properties</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', ...platforms].map(p => (
          <button key={p} onClick={() => setFilter(p)} className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${filter === p ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}>
            {p === 'all' ? 'All Platforms' : p}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-5xl mb-4">📅</p>
          <h3 className="font-bold text-gray-800 mb-2">No bookings yet</h3>
          <p className="text-gray-400 text-sm">Add properties and connect your platform calendars to start tracking bookings</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Platform</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Guest</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Check-in</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Check-out</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Nights</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Detected</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => {
                const nights = Math.ceil((new Date(b.checkOut) - new Date(b.checkIn)) / (1000 * 60 * 60 * 24));
                return (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${platformColors[b.sourcePlatform]}`}>{b.sourcePlatform}</span>
                    </td>
                    <td className="py-4 px-6 text-gray-700">{b.guestName || '—'}</td>
                    <td className="py-4 px-6 text-gray-700">{new Date(b.checkIn).toLocaleDateString('en-NG')}</td>
                    <td className="py-4 px-6 text-gray-700">{new Date(b.checkOut).toLocaleDateString('en-NG')}</td>
                    <td className="py-4 px-6 text-gray-500">{nights}N</td>
                    <td className="py-4 px-6 text-gray-400 text-xs">{new Date(b.detectedAt).toLocaleDateString('en-NG')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
