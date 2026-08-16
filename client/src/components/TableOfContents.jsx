import React, { useEffect, useState } from 'react';
import { ListFilter } from 'lucide-react';

export default function TableOfContents({ headings = [] }) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    if (!headings || headings.length === 0) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const headingElements = headings
        .map(h => document.getElementById(h.id))
        .filter(Boolean);

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const el = headingElements[i];
        if (el.offsetTop - 120 <= scrollY) {
          setActiveId(el.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  if (!headings || headings.length === 0) {
    return null;
  }

  const scrollToHeading = (id, e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top, behavior: 'smooth' });
      setActiveId(id);
    }
  };

  return (
    <div className="sidebar-card">
      <h4 className="sidebar-card-title">
        <ListFilter size={18} color="var(--accent-primary)" />
        <span>Table of Contents</span>
      </h4>
      <ul className="toc-list">
        {headings.map((h, idx) => (
          <li key={idx}>
            <a
              href={`#${h.id}`}
              className={`toc-link ${h.level === 3 ? 'level-3' : ''} ${activeId === h.id ? 'active' : ''}`}
              onClick={(e) => scrollToHeading(h.id, e)}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
