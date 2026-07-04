"use client";

import { useState } from "react";
import { StarRow } from "./StarRow";

type Review = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  rating: number | null;
  comment: string | null;
  image_url: string | null;
  created_at: Date | null;
};

interface ProductReviewsClientProps {
  reviews: Review[];
}

export function ProductReviewsClient({ reviews }: ProductReviewsClientProps) {
  const [visibleCount, setVisibleCount] = useState(5);

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 5);
  };

  // Helper to generate initials (e.g., PK)
  const getInitials = (first: string | null, last: string | null) => {
    const f = first ? first.charAt(0).toUpperCase() : "";
    const l = last ? last.charAt(0).toUpperCase() : "";
    return f + l || "A";
  };

  // Helper to generate a consistent color based on name
  const getAvatarColor = (first: string | null) => {
    const colors = ["#e67e22", "#3498db", "#9b59b6", "#1abc9c", "#e74c3c", "#34495e"];
    if (!first) return colors[0];
    const charCode = first.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  // Extract all images from reviews for the gallery
  const reviewImages = reviews
    .filter((r) => r.image_url)
    .map((r) => r.image_url as string);

  return (
    <div className="product-reviews-client">
      {/* 1. Customer Photo Gallery (if any) */}
      {reviewImages.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-3" style={{ fontSize: '18px', color: 'var(--color-premium-brown)' }}>
            Customer Photos
          </h4>
          <div 
            className="d-flex gap-3 overflow-auto" 
            style={{ 
              paddingBottom: '10px',
              scrollbarWidth: 'thin' 
            }}
          >
            {reviewImages.map((img, idx) => (
              <img
                key={idx}
                src={`/${img}`}
                alt="Customer photo"
                style={{
                  width: '120px',
                  height: '120px',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-sm)',
                  flexShrink: 0,
                  border: '1px solid #eaeaea'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* 2. Review List */}
      <div className="reviews-list">
        {reviews.length === 0 ? (
          <p className="text-center text-muted py-4">No reviews available yet.</p>
        ) : (
          <>
            {reviews.slice(0, visibleCount).map((r) => (
              <div key={r.id} className="premium-review-card d-flex gap-3 align-items-start mb-4">
                {/* Round Avatar */}
                <div 
                  className="review-avatar"
                  style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    backgroundColor: getAvatarColor(r.firstName),
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    flexShrink: 0
                  }}
                >
                  {getInitials(r.firstName, r.lastName)}
                </div>

                {/* Review Content */}
                <div className="review-content flex-grow-1">
                  <div className="d-flex align-items-center mb-1">
                    <strong style={{ color: 'var(--color-premium-brown)', marginRight: '10px', fontSize: '16px' }}>
                      {r.firstName ?? ""} {r.lastName ?? ""}
                    </strong>
                    <span className="text-warning" style={{ fontSize: '14px' }}>
                      <StarRow rating={r.rating ?? 0} />
                    </span>
                  </div>
                  {r.created_at && (
                    <div className="text-muted mb-2" style={{ fontSize: '12px' }}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  )}
                  <p className="mb-0 text-muted" style={{ lineHeight: '1.6' }}>{r.comment}</p>
                </div>
              </div>
            ))}

            {/* 3. Show More Button */}
            {visibleCount < reviews.length && (
              <div className="text-center mt-4">
                <button 
                  onClick={handleShowMore}
                  className="btn btn-outline-secondary"
                  style={{
                    borderRadius: '30px',
                    padding: '8px 25px',
                    fontWeight: '500'
                  }}
                >
                  Show More Reviews
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
