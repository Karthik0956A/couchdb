import { useState, useEffect, useContext } from 'react';
import { eventsAPI, participantsAPI } from '../api';
import { AuthContext } from '../AuthContext';
import CreateEvent from './CreateEvent';
import EventDetails from './EventDetails';
import './Events.css';

const EventsList = () => {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [myRSVPs, setMyRSVPs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filter, setFilter] = useState('all'); // all, my-events, my-rsvps

  useEffect(() => {
    loadEvents();
    loadMyRSVPs();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await eventsAPI.getAll();
      setEvents(response.data.events);
    } catch (err) {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const loadMyRSVPs = async () => {
    try {
      const response = await participantsAPI.getMyRSVPs();
      setMyRSVPs(response.data.rsvps);
    } catch (err) {
      console.error('Failed to load RSVPs:', err);
    }
  };

  const handleEventCreated = () => {
    setShowCreateForm(false);
    loadEvents();
  };

  const handleEventDeleted = () => {
    setSelectedEvent(null);
    loadEvents();
    loadMyRSVPs();
  };

  const handleRSVPChanged = () => {
    loadMyRSVPs();
  };

  const isRSVPd = (eventId) => {
    return myRSVPs.some(rsvp => rsvp.eventId === eventId);
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'my-events') {
      return event.creatorId === user.id;
    }
    if (filter === 'my-rsvps') {
      return isRSVPd(event.id || event._id);
    }
    return true;
  });

  if (loading) return <div className="loading">Loading events...</div>;

  return (
    <div className="events-container">
      <div className="events-header">
        <h2>Events</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create Event'}
        </button>
      </div>

      <div className="events-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Events
        </button>
        <button
          className={`filter-btn ${filter === 'my-events' ? 'active' : ''}`}
          onClick={() => setFilter('my-events')}
        >
          My Events
        </button>
        <button
          className={`filter-btn ${filter === 'my-rsvps' ? 'active' : ''}`}
          onClick={() => setFilter('my-rsvps')}
        >
          My RSVPs
        </button>
      </div>

      {showCreateForm && (
        <CreateEvent onEventCreated={handleEventCreated} />
      )}

      {error && <div className="error">{error}</div>}

      <div className="events-grid">
        {filteredEvents.length === 0 ? (
          <p className="no-events">No events found</p>
        ) : (
          filteredEvents.map(event => (
            <div
              key={event.id || event._id}
              className="event-card"
              onClick={() => setSelectedEvent(event)}
            >
              <h3>{event.title}</h3>
              <p className="event-date">
                {new Date(event.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="event-location">📍 {event.location}</p>
              <p className="event-description">{event.description}</p>
              <div className="event-footer">
                <span className="event-creator">By: {event.creatorName}</span>
                {isRSVPd(event.id || event._id) && (
                  <span className="rsvp-badge">✓ RSVP'd</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedEvent && (
        <EventDetails
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEventDeleted={handleEventDeleted}
          onRSVPChanged={handleRSVPChanged}
          isRSVPd={isRSVPd(selectedEvent.id || selectedEvent._id)}
        />
      )}
    </div>
  );
};

export default EventsList;
