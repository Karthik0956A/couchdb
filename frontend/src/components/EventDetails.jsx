import { useState, useEffect, useContext } from 'react';
import { eventsAPI, participantsAPI } from '../api';
import { AuthContext } from '../AuthContext';
import './Events.css';

const EventDetails = ({ event, onClose, onEventDeleted, onRSVPChanged, isRSVPd }) => {
  const { user } = useContext(AuthContext);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: event.title,
    description: event.description,
    date: event.date,
    location: event.location,
    maxParticipants: event.maxParticipants || ''
  });

  const isCreator = event.creatorId === user.id;

  useEffect(() => {
    loadParticipants();
  }, [event]);

  const loadParticipants = async () => {
    try {
      const response = await participantsAPI.getByEvent(event.id || event._id);
      setParticipants(response.data.participants);
    } catch (err) {
      console.error('Failed to load participants:', err);
    }
  };

  const handleRSVP = async () => {
    setLoading(true);
    setError('');
    try {
      if (isRSVPd) {
        await participantsAPI.cancelByEventAndUser(event.id || event._id, user.id);
      } else {
        await participantsAPI.rsvp(event.id || event._id);
      }
      loadParticipants();
      onRSVPChanged();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update RSVP');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event? All RSVPs will be removed.')) {
      return;
    }
    setLoading(true);
    try {
      await eventsAPI.delete(event.id || event._id);
      onEventDeleted();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete event');
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const updateData = {
        ...editData,
        maxParticipants: editData.maxParticipants ? parseInt(editData.maxParticipants) : null
      };
      await eventsAPI.update(event.id || event._id, updateData);
      setIsEditing(false);
      window.location.reload(); // Refresh to show updated data
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        {!isEditing ? (
          <>
            <h2>{event.title}</h2>
            <div className="event-details">
              <p><strong>Date:</strong> {new Date(event.date).toLocaleString()}</p>
              <p><strong>Location:</strong> {event.location}</p>
              <p><strong>Description:</strong> {event.description}</p>
              <p><strong>Created by:</strong> {event.creatorName}</p>
              {event.maxParticipants && (
                <p><strong>Max Participants:</strong> {participants.length} / {event.maxParticipants}</p>
              )}
            </div>

            <div className="participants-section">
              <h3>Participants ({participants.length})</h3>
              {participants.length === 0 ? (
                <p>No participants yet</p>
              ) : (
                <ul className="participants-list">
                  {participants.map(p => (
                    <li key={p.id || p._id}>
                      {p.userName} ({p.userEmail})
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {error && <div className="error">{error}</div>}

            <div className="modal-actions">
              {!isCreator && (
                <button
                  className={`btn ${isRSVPd ? 'btn-danger' : 'btn-primary'}`}
                  onClick={handleRSVP}
                  disabled={loading || (!isRSVPd && event.maxParticipants && participants.length >= event.maxParticipants)}
                >
                  {loading ? 'Processing...' : isRSVPd ? 'Cancel RSVP' : 'RSVP to Event'}
                </button>
              )}
              {isCreator && (
                <>
                  <button
                    className="btn btn-primary"
                    onClick={() => setIsEditing(true)}
                    disabled={loading}
                  >
                    Edit Event
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    {loading ? 'Deleting...' : 'Delete Event'}
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <h2>Edit Event</h2>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Event Title</label>
                <input
                  type="text"
                  name="title"
                  value={editData.title}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={editData.description}
                  onChange={handleEditChange}
                  rows="4"
                  required
                />
              </div>
              <div className="form-group">
                <label>Date & Time</label>
                <input
                  type="datetime-local"
                  name="date"
                  value={editData.date.slice(0, 16)}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={editData.location}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Max Participants</label>
                <input
                  type="number"
                  name="maxParticipants"
                  value={editData.maxParticipants}
                  onChange={handleEditChange}
                  min="1"
                />
              </div>
              {error && <div className="error">{error}</div>}
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default EventDetails;
