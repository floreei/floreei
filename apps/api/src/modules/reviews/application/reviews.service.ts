import { Injectable } from "@nestjs/common";
import type {
  Paginated,
  Review,
  ReviewQuery,
  ReviewStatus,
  StoreReview,
  StoreReviewInput,
} from "@sistema-flores/types";
import {
  ReviewRepository,
  type ReviewAggregate,
} from "../infrastructure/review.repository";
import { ReviewEntity } from "../infrastructure/review.entity";

function iso(d: Date | string): string {
  return d instanceof Date ? d.toISOString() : d;
}

function toReview(e: ReviewEntity): Review {
  return {
    id: e.id,
    companyId: e.companyId,
    arrangementId: e.arrangementId,
    arrangementName: e.arrangement?.name ?? null,
    authorName: e.authorName,
    rating: e.rating,
    comment: e.comment,
    status: e.status,
    source: e.source,
    createdAt: iso(e.createdAt),
  };
}

function toStoreReview(e: ReviewEntity): StoreReview {
  return {
    id: e.id,
    authorName: e.authorName,
    rating: e.rating,
    comment: e.comment,
    createdAt: iso(e.createdAt),
  };
}

@Injectable()
export class ReviewsService {
  constructor(private readonly reviews: ReviewRepository) {}

  // ── Moderação (backoffice, tenant do usuário logado) ──
  async list(query: ReviewQuery): Promise<Paginated<Review>> {
    const page = await this.reviews.search(query);
    return { ...page, data: page.data.map(toReview) };
  }

  async setStatus(id: string, status: ReviewStatus): Promise<Review> {
    await this.reviews.findByIdOrFail(id);
    await this.reviews.updateById(id, { status });
    return toReview(await this.reviews.findByIdOrFail(id, ["arrangement"]));
  }

  remove(id: string): Promise<void> {
    return this.reviews.deleteById(id);
  }

  // ── Público (chamado dentro de tenant.runForCompany pelo StorefrontService) ──
  async submit(
    arrangementId: string,
    input: StoreReviewInput,
  ): Promise<StoreReview> {
    const entity = this.reviews.create({
      arrangementId,
      authorName: input.authorName,
      rating: input.rating,
      comment: input.comment ?? null,
      status: "APPROVED",
      source: "CUSTOMER",
    });
    return toStoreReview(await this.reviews.save(entity));
  }

  async listApproved(arrangementId: string): Promise<StoreReview[]> {
    const rows = await this.reviews.listApprovedForArrangement(arrangementId);
    return rows.map(toStoreReview);
  }

  aggregates(): Promise<ReviewAggregate[]> {
    return this.reviews.approvedAggregates();
  }
}
