import React from 'react';
import type { CampusOffer } from '../types';
import { Icon } from './Icon';

interface FeaturedOffersCarouselProps {
  offers: CampusOffer[];
  currentStars: number;
  onSelectOffer: (offer: CampusOffer) => void;
}

export const FeaturedOffersCarousel: React.FC<FeaturedOffersCarouselProps> = ({
  offers,
  currentStars,
  onSelectOffer
}) => {
  return (
    <section className="doa-featured-section" aria-label="Öne çıkan fırsatlar">
      <div className="doa-section-header">
        <strong className="doa-section-title">ÖNE ÇIKAN FIRSATLAR</strong>
      </div>

      <div className="doa-offers-track" role="list">
        {offers.map((offer) => {
          const canRedeem = currentStars >= offer.stars;
          return (
            <article
              key={offer.id}
              role="listitem"
              className="doa-offer-card"
              style={{
                background: `linear-gradient(135deg, ${offer.gradientFrom} 0%, ${offer.gradientTo} 100%)`
              }}
            >
              <div className="doa-offer-glow" aria-hidden="true" />

              <div className="doa-offer-body">
                <span className="doa-offer-badge">{offer.badge}</span>
                <span className="doa-offer-partner">{offer.partner}</span>
                <h3 className="doa-offer-title">{offer.title}</h3>
                <p className="doa-offer-desc">{offer.desc}</p>

                <button
                  type="button"
                  className={`doa-offer-btn ${canRedeem ? 'ready' : ''}`}
                  onClick={() => onSelectOffer(offer)}
                  disabled={!canRedeem}
                >
                  {canRedeem ? 'Kupon Aç' : `${offer.stars} Yıldız Gerekli`}
                </button>
              </div>

              <div className="doa-offer-icon" aria-hidden="true">
                <Icon name={offer.icon} size={30} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default FeaturedOffersCarousel;
