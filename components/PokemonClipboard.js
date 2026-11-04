import React, { useEffect, useRef, useState } from 'react';
import { FaFilePdf, FaLinkedin } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';

export default function PokemonClipboard({ onClose }) {
  const [rippingContact, setRippingContact] = useState(null);
  const pendingHref = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const closeFromBackdrop = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  const openContact = (event, contact) => {
    // Preserve the browser's usual modified-click behavior.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    if (rippingContact) return;

    const href = event.currentTarget.href;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.location.href = href;
      return;
    }

    pendingHref.current = href;
    setRippingContact(contact);
  };

  const finishContactRip = (event) => {
    if (!event.animationName.startsWith('fr-contact-rip-')) return;

    const href = pendingHref.current;
    pendingHref.current = null;
    setRippingContact(null);
    if (href) window.location.href = href;
  };

  return (
    <div className="fr-profile-backdrop" onMouseDown={closeFromBackdrop}>
      <section
        className="fr-profile"
        role="dialog"
        aria-modal="true"
        aria-label="Contact board"
      >
        <div className="fr-profile__board-content">
          <article className="fr-profile__message fr-note">
            <span className="fr-pin" aria-hidden="true"><i /><b /></span>
            <p className="fr-profile__intro">
              Got a question, or just want to say hi? Feel free to reach out.
            </p>
          </article>

          <figure className="fr-profile__photo-stamp fr-note">
            <span className="fr-pin fr-pin--reverse" aria-hidden="true"><i /><b /></span>
            <div>
              <img src="/carlos.jpg" alt="Carlos Liang" />
            </div>
            <figcaption>CARLOS</figcaption>
          </figure>

          <nav className="fr-profile__contact-links" aria-label="Contact links">
            <a
              className={`fr-contact-card fr-contact-card--email ${
                rippingContact === 'email' ? 'fr-contact-card--ripping' : ''
              }`}
              href="mailto:carlos.liang97@gmail.com"
              onClick={(event) => openContact(event, 'email')}
              onAnimationEnd={finishContactRip}
            >
              <span
                className="fr-contact-card__link-mark fr-contact-card__link-mark--email"
                aria-hidden="true"
              >
                <MdEmail focusable="false" />
              </span>
              <span>
                <small>DROP ME A LINE</small>
                <strong>EMAIL</strong>
              </span>
              <span className="fr-contact-card__go" aria-hidden="true">&gt;</span>
            </a>
            <a
              className={`fr-contact-card fr-contact-card--linkedin ${
                rippingContact === 'linkedin' ? 'fr-contact-card--ripping' : ''
              }`}
              href="https://www.linkedin.com/in/carlosl97/"
              onClick={(event) => openContact(event, 'linkedin')}
              onAnimationEnd={finishContactRip}
            >
              <span
                className="fr-contact-card__link-mark fr-contact-card__link-mark--linkedin"
                aria-hidden="true"
              >
                <FaLinkedin focusable="false" />
              </span>
              <span>
                <small>LET&apos;S CONNECT</small>
                <strong>LINKEDIN</strong>
              </span>
              <span className="fr-contact-card__go" aria-hidden="true">&gt;</span>
            </a>
            <a
              className="fr-contact-card fr-contact-card--cv"
              href="/Carlos Liang CV.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span
                className="fr-contact-card__link-mark fr-contact-card__link-mark--cv"
                aria-hidden="true"
              >
                <FaFilePdf focusable="false" />
              </span>
              <span>
                <small>VIEW MY RESUME</small>
                <strong>CV</strong>
              </span>
              <span className="fr-contact-card__go" aria-hidden="true">&gt;</span>
            </a>
          </nav>
        </div>
      </section>
    </div>
  );
}
