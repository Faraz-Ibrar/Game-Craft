import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <h2 className="footer-logo">Game <span className="footer-highlight">Craft</span></h2>
          <p>Crafting epic gaming experiences, one click at a time.</p>
        </div>
        <div className="footer-contact">
          <h4>Contact</h4>
          <p>Email: support@gamecraft.com</p>
          <p>Phone: 051-1234567</p>
          <p>© 2025 Game Craft. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
