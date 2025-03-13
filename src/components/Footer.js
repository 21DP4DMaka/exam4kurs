import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-content">
          <div className="footer-branding">
            <h3>Professional Answers</h3>
            <p>Zināšanu apmaiņas platforma</p>
          </div>
          <div className="footer-links">
            <div className="link-group">
              <h4>Platforma</h4>
              <ul>
                <li><a href="/about">Par mums</a></li>
                <li><a href="/experts">Eksperti</a></li>
                <li><a href="/faq">Biežāk uzdotie jautājumi</a></li>
              </ul>
            </div>
            <div className="link-group">
              <h4>Juridiskā info</h4>
              <ul>
                <li><a href="/terms">Lietošanas noteikumi</a></li>
                <li><a href="/privacy">Privātuma politika</a></li>
                <li><a href="/cookies">Sīkdatņu politika</a></li>
              </ul>
            </div>
            <div className="link-group">
              <h4>Saziņa</h4>
              <ul>
                <li><a href="/contact">Kontakti</a></li>
                <li><a href="/support">Atbalsts</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="copyright">
          &copy; {new Date().getFullYear()} Professional Answers. Visas tiesības aizsargātas.
        </div>
      </div>
    </footer>
  );
}

export default Footer;