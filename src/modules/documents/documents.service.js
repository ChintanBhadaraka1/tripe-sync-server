import prisma from '../../utils/prisma.js';
import { createError } from '../../middleware/errorHandler.js';

export async function createTripDocument(tripId, userId, data) {
  if (!data.title || !data.fileUrl) throw createError(400, 'Title and fileUrl are required.');
  return prisma.tripDocument.create({
    data: { tripId, uploadedBy: userId, title: data.title, fileUrl: data.fileUrl },
    include: { user: { select: { name: true } } }
  });
}

export async function getTripDocuments(tripId) {
  const directDocs = await prisma.tripDocument.findMany({
    where: { tripId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }
  });
  
  const sharedDocs = await prisma.sharedUserDocument.findMany({
    where: { tripId },
    include: { 
      userDocument: {
        include: { user: { select: { name: true } } }
      }
    },
    orderBy: { sharedAt: 'desc' }
  });

  return { directDocs, sharedDocs };
}

export async function deleteTripDocument(tripId, docId, userId) {
  const doc = await prisma.tripDocument.findUnique({ where: { id: docId } });
  if (!doc || doc.tripId !== tripId) throw createError(404, 'Document not found.');
  
  const membership = await prisma.tripMember.findFirst({
    where: { tripId, userId, status: { not: 'REMOVED' } }
  });
  if (!membership) throw createError(403, 'Not a member.');
  
  if (doc.uploadedBy !== userId && membership.role !== 'OWNER') {
    throw createError(403, 'Only the uploader or trip owner can delete this document.');
  }
  await prisma.tripDocument.delete({ where: { id: docId } });
}

// ─── Personal Documents ───

export async function createPersonalDocument(userId, data) {
  if (!data.title || !data.fileUrl) throw createError(400, 'Title and fileUrl are required.');
  return prisma.userDocument.create({
    data: { userId, title: data.title, fileUrl: data.fileUrl }
  });
}

export async function getPersonalDocuments(userId) {
  return prisma.userDocument.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
}

export async function deletePersonalDocument(userId, docId) {
  const doc = await prisma.userDocument.findUnique({ where: { id: docId } });
  if (!doc || doc.userId !== userId) throw createError(404, 'Document not found.');
  await prisma.userDocument.delete({ where: { id: docId } });
}

export async function shareDocumentToTrip(userId, tripId, documentId) {
  const doc = await prisma.userDocument.findUnique({ where: { id: documentId } });
  if (!doc || doc.userId !== userId) throw createError(404, 'Document not found.');

  const membership = await prisma.tripMember.findFirst({
    where: { tripId, userId, status: { not: 'REMOVED' } }
  });
  if (!membership) throw createError(403, 'Not a member of this trip.');

  const existing = await prisma.sharedUserDocument.findUnique({
    where: { tripId_userDocumentId: { tripId, userDocumentId: documentId } }
  });
  if (existing) throw createError(400, 'Document already shared to this trip.');

  return prisma.sharedUserDocument.create({
    data: { tripId, userDocumentId: documentId }
  });
}

export async function unshareDocumentFromTrip(userId, tripId, documentId) {
  const membership = await prisma.tripMember.findFirst({
    where: { tripId, userId, status: { not: 'REMOVED' } }
  });
  if (!membership) throw createError(403, 'Not a member.');

  const doc = await prisma.userDocument.findUnique({ where: { id: documentId } });
  
  if (doc?.userId !== userId && membership.role !== 'OWNER') {
    throw createError(403, 'Only the document owner or trip owner can unshare this document.');
  }

  await prisma.sharedUserDocument.delete({
    where: { tripId_userDocumentId: { tripId, userDocumentId: documentId } }
  });
}
