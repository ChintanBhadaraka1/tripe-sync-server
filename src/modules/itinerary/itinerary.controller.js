import { z } from 'zod';
import prisma from '../../utils/prisma.js';

// ─── GET: Fetch full itinerary ────────────────────────────────────────────────
export async function httpGetItinerary(req, res, next) {
  try {
    const { tripId } = req.params;

    const days = await prisma.itineraryDay.findMany({
      where: { tripId },
      orderBy: { dayNumber: 'asc' },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    res.json(days);
  } catch (err) {
    next(err);
  }
}

// ─── POST: Add a new Day ──────────────────────────────────────────────────────
const addDaySchema = z.object({
  date: z.string().datetime(),
  dayNumber: z.number().int().min(1),
});

export async function httpAddDay(req, res, next) {
  try {
    const { tripId } = req.params;
    const { date, dayNumber } = addDaySchema.parse(req.body);

    const day = await prisma.itineraryDay.create({
      data: {
        tripId,
        date: new Date(date),
        dayNumber,
      },
      include: {
        items: true,
      },
    });

    res.status(201).json(day);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'This day number or date already exists for this trip' });
    }
    next(err);
  }
}

// ─── POST: Add an Item to a Day ───────────────────────────────────────────────
const addItemSchema = z.object({
  dayId: z.string(),
  title: z.string().min(1),
  time: z.string().datetime().nullable().optional(),
  type: z.string(),
  notes: z.string().nullable().optional(),
  photoUrl: z.string().url().nullable().optional(),
  sortOrder: z.number().int().default(0),
  placeName: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  mapLink: z.string().url().nullable().optional(),
  fromLat: z.number().nullable().optional(),
  fromLng: z.number().nullable().optional(),
  toLat: z.number().nullable().optional(),
  toLng: z.number().nullable().optional(),
});

export async function httpAddItem(req, res, next) {
  try {
    const { tripId } = req.params;
    const data = addItemSchema.parse(req.body);

    // Verify day belongs to trip
    const day = await prisma.itineraryDay.findUnique({ where: { id: data.dayId } });
    if (!day || day.tripId !== tripId) {
      return res.status(404).json({ error: 'Day not found or does not belong to this trip' });
    }

    const item = await prisma.itineraryItem.create({
      data: {
        dayId: data.dayId,
        title: data.title,
        time: data.time ? new Date(data.time) : null,
        type: data.type,
        notes: data.notes,
        photoUrl: data.photoUrl,
        sortOrder: data.sortOrder,
        placeName: data.placeName,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        mapLink: data.mapLink,
        fromLat: data.fromLat,
        fromLng: data.fromLng,
        toLat: data.toLat,
        toLng: data.toLng,
      },
    });

    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

// ─── PATCH: Update an Item ────────────────────────────────────────────────────
export async function httpUpdateItem(req, res, next) {
  try {
    const { itemId } = req.params;
    const data = addItemSchema.partial().parse(req.body);

    let updateData = { ...data };
    if (data.time !== undefined) {
      updateData.time = data.time ? new Date(data.time) : null;
    }

    const item = await prisma.itineraryItem.update({
      where: { id: itemId },
      data: updateData,
    });

    res.json(item);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Item not found' });
    }
    next(err);
  }
}

// ─── DELETE: Remove an Item ───────────────────────────────────────────────────
export async function httpDeleteItem(req, res, next) {
  try {
    const { itemId } = req.params;

    await prisma.itineraryItem.delete({
      where: { id: itemId },
    });

    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Item not found' });
    }
    next(err);
  }
}

// ─── DELETE: Remove a Day ─────────────────────────────────────────────────────
export async function httpDeleteDay(req, res, next) {
  try {
    const { dayId } = req.params;

    await prisma.itineraryDay.delete({
      where: { id: dayId },
    });

    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Day not found' });
    }
    next(err);
  }
}
