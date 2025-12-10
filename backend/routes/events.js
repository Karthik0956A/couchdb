const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// Create Event
router.post(
  '/',
  auth,
  [
    body('title').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('date').isISO8601(),
    body('location').trim().notEmpty(),
    body('maxParticipants').optional().isInt({ min: 1 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, date, location, maxParticipants } = req.body;
      const eventsDB = getDB('events');

      const event = {
        title,
        description,
        date,
        location,
        maxParticipants: maxParticipants || null,
        creatorId: req.userId,
        creatorName: req.user.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const response = await eventsDB.insert(event);

      res.status(201).json({
        message: 'Event created successfully',
        event: {
          id: response.id,
          ...event
        }
      });
    } catch (error) {
      console.error('Create event error:', error);
      res.status(500).json({ error: 'Server error creating event' });
    }
  }
);

// Get All Events
router.get('/', auth, async (req, res) => {
  try {
    const eventsDB = getDB('events');
    const result = await eventsDB.list({ include_docs: true });
    
    const events = result.rows
      .filter(row => !row.id.startsWith('_design'))
      .map(row => ({
        id: row.doc._id,
        ...row.doc
      }));

    res.json({ events });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Server error fetching events' });
  }
});

// Get Single Event
router.get('/:id', auth, async (req, res) => {
  try {
    const eventsDB = getDB('events');
    const event = await eventsDB.get(req.params.id);

    res.json({
      id: event._id,
      ...event
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ error: 'Event not found' });
    }
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Server error fetching event' });
  }
});

// Get Events by Creator
router.get('/creator/:userId', auth, async (req, res) => {
  try {
    const eventsDB = getDB('events');
    const result = await eventsDB.view('queries', 'by_creator', {
      key: req.params.userId,
      include_docs: true
    });

    const events = result.rows.map(row => ({
      id: row.doc._id,
      ...row.doc
    }));

    res.json({ events });
  } catch (error) {
    console.error('Get events by creator error:', error);
    res.status(500).json({ error: 'Server error fetching events' });
  }
});

// Update Event
router.put(
  '/:id',
  auth,
  [
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim().notEmpty(),
    body('date').optional().isISO8601(),
    body('location').optional().trim().notEmpty(),
    body('maxParticipants').optional().isInt({ min: 1 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const eventsDB = getDB('events');
      const event = await eventsDB.get(req.params.id);

      // Check if user is the creator
      if (event.creatorId !== req.userId) {
        return res.status(403).json({ error: 'Not authorized to update this event' });
      }

      // Update fields
      const { title, description, date, location, maxParticipants } = req.body;
      if (title) event.title = title;
      if (description) event.description = description;
      if (date) event.date = date;
      if (location) event.location = location;
      if (maxParticipants !== undefined) event.maxParticipants = maxParticipants;
      event.updatedAt = new Date().toISOString();

      const response = await eventsDB.insert(event);

      res.json({
        message: 'Event updated successfully',
        event: {
          id: response.id,
          ...event
        }
      });
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({ error: 'Event not found' });
      }
      console.error('Update event error:', error);
      res.status(500).json({ error: 'Server error updating event' });
    }
  }
);

// Delete Event (and all linked participants)
router.delete('/:id', auth, async (req, res) => {
  try {
    const eventsDB = getDB('events');
    const participantsDB = getDB('participants');
    
    const event = await eventsDB.get(req.params.id);

    // Check if user is the creator
    if (event.creatorId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this event' });
    }

    // Delete all participants for this event
    try {
      const participants = await participantsDB.view('queries', 'by_event', {
        key: req.params.id,
        include_docs: true
      });

      if (participants.rows.length > 0) {
        const deletePromises = participants.rows.map(row =>
          participantsDB.destroy(row.doc._id, row.doc._rev)
        );
        await Promise.all(deletePromises);
      }
    } catch (error) {
      console.error('Error deleting participants:', error);
    }

    // Delete the event
    await eventsDB.destroy(req.params.id, event._rev);

    res.json({ message: 'Event and linked RSVPs deleted successfully' });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ error: 'Event not found' });
    }
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Server error deleting event' });
  }
});

module.exports = router;
