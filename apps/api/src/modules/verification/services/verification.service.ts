import { Inject, Injectable, StreamableFile } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'node:crypto';
import {
  VerificationDocument,
  VerificationStatus,
  type MyVerificationResponse,
  type Paginated,
  type VerificationRequestResponse,
} from '@housingcom/contracts';
import { AppException } from '../../../core/errors/app.exception.js';
import { ErrorCode } from '../../../core/errors/error-codes.js';
import { UserAdminEvent, type UserModeratedEvent } from '../../../core/events/domain-events.js';
import { ImageProcessingService } from '../../../core/media/image-processing.service.js';
import { OBJECT_STORAGE, type ObjectStorage } from '../../../core/storage/object-storage.interface.js';
import { UsersService } from '../../users/services/users.service.js';
import {
  VERIFICATION_REPOSITORY,
  type VerificationRepository,
} from '../interfaces/verification-repository.interface.js';
import { toVerificationResponse } from '../mappers/verification.mapper.js';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

export interface DocumentUpload {
  buffer: Buffer;
  mimetype: string;
}

/** Lister verification: submit ID + property proof, admin approves or rejects. */
@Injectable()
export class VerificationService {
  constructor(
    @Inject(VERIFICATION_REPOSITORY) private readonly requests: VerificationRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    private readonly users: UsersService,
    private readonly images: ImageProcessingService,
    private readonly events: EventEmitter2,
  ) {}

  async mine(userId: string): Promise<MyVerificationResponse> {
    const [user, latest] = await Promise.all([this.users.getById(userId), this.requests.findLatestForUser(userId)]);
    return {
      isVerified: user.listerProfile?.isVerified ?? false,
      latest: latest ? toVerificationResponse(latest) : null,
    };
  }

  async submit(userId: string, idProof: DocumentUpload, propertyProof: DocumentUpload): Promise<MyVerificationResponse> {
    const user = await this.users.getById(userId);
    if (!user.listerProfile) throw AppException.forbidden(ErrorCode.NotALister, 'Switch to lister mode first');
    if (user.listerProfile.isVerified) throw AppException.conflict(ErrorCode.AlreadyVerified, 'You are already verified');
    if (await this.requests.hasPending(userId)) {
      throw AppException.conflict(ErrorCode.VerificationAlreadyPending, 'Your documents are already under review');
    }

    const [idKey, propertyKey] = await Promise.all([
      this.storeDocument(userId, idProof),
      this.storeDocument(userId, propertyProof),
    ]);
    await this.requests.create({ userId, idDocumentKey: idKey, propertyDocumentKey: propertyKey });
    return this.mine(userId);
  }

  async queue(status: VerificationStatus, page: number, limit: number): Promise<Paginated<VerificationRequestResponse>> {
    const result = await this.requests.findByStatus(status, page, limit);
    return { items: result.items.map((r) => toVerificationResponse(r, true)), meta: result.meta };
  }

  countPending(): Promise<number> {
    return this.requests.countByStatus(VerificationStatus.Pending);
  }

  async get(id: string): Promise<VerificationRequestResponse> {
    return toVerificationResponse(await this.load(id), true);
  }

  /** Streams a private document to an admin. */
  async openDocument(id: string, document: VerificationDocument): Promise<StreamableFile> {
    const request = await this.load(id);
    const key = document === VerificationDocument.Id ? request.idDocumentKey : request.propertyDocumentKey;
    const object = await this.storage.get(key);
    if (!object) throw AppException.notFound('Document');
    return new StreamableFile(object.body, { type: 'image/jpeg', length: object.size });
  }

  async approve(adminId: string, id: string): Promise<VerificationRequestResponse> {
    const request = await this.loadPending(id);
    const now = new Date();
    await this.requests.review(id, {
      status: VerificationStatus.Approved,
      reviewedBy: adminId,
      reviewedAt: now,
      rejectionReason: null,
    });
    await this.users.setListerVerified(request.userId, now);
    this.events.emit(UserAdminEvent.ListerVerified, { userId: request.userId, actorId: adminId } satisfies UserModeratedEvent);
    return this.get(id);
  }

  async reject(adminId: string, id: string, reason: string): Promise<VerificationRequestResponse> {
    const request = await this.loadPending(id);
    await this.requests.review(id, {
      status: VerificationStatus.Rejected,
      reviewedBy: adminId,
      reviewedAt: new Date(),
      rejectionReason: reason,
    });
    this.events.emit(UserAdminEvent.ListerVerificationRejected, {
      userId: request.userId,
      actorId: adminId,
      reason,
    } satisfies UserModeratedEvent);
    return this.get(id);
  }

  private async storeDocument(userId: string, file: DocumentUpload): Promise<string> {
    if (!IMAGE_TYPES.has(file.mimetype)) {
      throw AppException.badRequest(ErrorCode.InvalidMedia, 'Upload a clear photo (JPG, PNG, WebP or HEIC) of the document');
    }
    const key = `private/verification/${userId}/${randomUUID()}.jpg`;
    await this.storage.put(key, await this.images.document(file.buffer), 'image/jpeg');
    return key;
  }

  private async load(id: string) {
    const request = await this.requests.findById(id);
    if (!request) throw AppException.notFound('Verification request');
    return request;
  }

  private async loadPending(id: string) {
    const request = await this.load(id);
    if (request.status !== VerificationStatus.Pending) {
      throw AppException.conflict(ErrorCode.VerificationNotPending, 'This request was already reviewed');
    }
    return request;
  }
}
