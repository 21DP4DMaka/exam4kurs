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
              <h4>Saziņa</h4>
              <ul>
                <li><a href="/contact">E-pasts:
                info@professionalanswers.lv</a></li>
                <li><a href="/support">Tālrunis:
                +371 12345678</a></li>
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