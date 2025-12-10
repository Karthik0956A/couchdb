const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// RSVP to Event (Create Participant)
router.post(
  '/',
  auth,
  [body('eventId').trim().notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { eventId } = req.body;
      const participantsDB = getDB('participants');
      const eventsDB = getDB('events');

      // Check if event exists
      let event;
      try {
        event = await eventsDB.get(eventId);
      } catch (error) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Check if user already RSVP'd
      try {
        const existing = await participantsDB.view('queries', 'by_event', {
          key: eventId,
          include_docs: true
        });
        
        const alreadyRSVPd = existing.rows.some(row => row.doc.userId === req.userId);
        if (alreadyRSVPd) {
          return res.status(400).json({ error: 'Already RSVP\'d to this event' });
        }

        // Check max participants
        if (event.maxParticipants && existing.rows.length >= event.maxParticipants) {
          return res.status(400).json({ error: 'Event is full' });
        }
      } catch (error) {
        // View might not exist, continue
      }

      const participant = {
        eventId,
        userId: req.userId,
        userName: req.user.name,
        userEmail: req.user.email,
        eventTitle: event.title,
        eventDate: event.date,
        rsvpDate: new Date().toISOString()
      };

      const response = await participantsDB.insert(participant);

      res.status(201).json({
        message: 'RSVP successful',
        participant: {
          id: response.id,
          ...participant
        }
      });
    } catch (error) {
      console.error('RSVP error:', error);
      res.status(500).json({ error: 'Server error creating RSVP' });
    }
  }
);

// Get All Participants for an Event
router.get('/event/:eventId', auth, async (req, res) => {
  try {
    const participantsDB = getDB('participants');
    const result = await participantsDB.view('queries', 'by_event', {
      key: req.params.eventId,
      include_docs: true
    });

    const participants = result.rows.map(row => ({
      id: row.doc._id,
      ...row.doc
    }));

    res.json({ participants, count: participants.length });
  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({ error: 'Server error fetching participants' });
  }
});

// Get All Events User RSVP'd To
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const participantsDB = getDB('participants');
    const result = await participantsDB.view('queries', 'by_user', {
      key: req.params.userId,
      include_docs: true
    });

    const rsvps = result.rows.map(row => ({
      id: row.doc._id,
      ...row.doc
    }));

    res.json({ rsvps });
  } catch (error) {
    console.error('Get user RSVPs error:', error);
    res.status(500).json({ error: 'Server error fetching RSVPs' });
  }
});

// Get Current User's RSVPs
router.get('/my-rsvps', auth, async (req, res) => {
  try {
    const participantsDB = getDB('participants');
    const result = await participantsDB.view('queries', 'by_user', {
      key: req.userId,
      include_docs: true
    });

    const rsvps = result.rows.map(row => ({
      id: row.doc._id,
      ...row.doc
    }));

    res.json({ rsvps });
  } catch (error) {
    console.error('Get my RSVPs error:', error);
    res.status(500).json({ error: 'Server error fetching RSVPs' });
  }
});

// Cancel RSVP (Delete Participant)
router.delete('/:id', auth, async (req, res) => {
  try {
    const participantsDB = getDB('participants');
    const participant = await participantsDB.get(req.params.id);

    // Check if user owns this RSVP
    if (participant.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to cancel this RSVP' });
    }

    await participantsDB.destroy(req.params.id, participant._rev);

    res.json({ message: 'RSVP cancelled successfully' });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ error: 'RSVP not found' });
    }
    console.error('Cancel RSVP error:', error);
    res.status(500).json({ error: 'Server error cancelling RSVP' });
  }
});

// Delete RSVP by Event and User (alternative cancellation method)
router.delete('/event/:eventId/user/:userId', auth, async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    
    // Only allow users to cancel their own RSVPs
    if (userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to cancel this RSVP' });
    }

    const participantsDB = getDB('participants');
    const result = await participantsDB.view('queries', 'by_event', {
      key: eventId,
      include_docs: true
    });

    const participant = result.rows.find(row => row.doc.userId === userId);
    
    if (!participant) {
      return res.status(404).json({ error: 'RSVP not found' });
    }

    await participantsDB.destroy(participant.doc._id, participant.doc._rev);

    res.json({ message: 'RSVP cancelled successfully' });
  } catch (error) {
    console.error('Cancel RSVP error:', error);
    res.status(500).json({ error: 'Server error cancelling RSVP' });
  }
});

module.exports = router;
