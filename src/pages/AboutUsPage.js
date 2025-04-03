import React from 'react';
import './AboutUsPage.css';

function AboutUsPage({ setCurrentPage }) {
  return (
    <div className="about-us-page">
      <div className="container">
        <section className="about-hero">
          <h1>Par mums</h1>
          <p className="subtitle">
            Professional Answers ir platforma, kas savieno cilvēkus ar profesionāļiem dažādās jomās.
          </p>
        </section>
        
        <section className="about-mission">
          <div className="mission-content">
            <h2>Mūsu misija</h2>
            <p>
              Mūsu misija ir padarīt profesionālu ekspertu zināšanas pieejamas ikvienam. Mēs ticam, ka 
              katrs cilvēks pelnī piekļuvi uzticamai informācijai un kvalitatīvām atbildēm uz saviem 
              jautājumiem, neatkarīgi no viņu atrašanās vietas vai līdzekļiem.
            </p>
            <p>
              Professional Answers nodrošina drošu un uzticamu platformu, kur lietotāji var uzdot jautājumus 
              un saņemt kvalificētu speciālistu atbildes dažādās jomās - no tiesībām un medicīnas līdz 
              tehnoloģijām un finansēm.
            </p>
          </div>
          <div className="mission-values">
            <div className="value-card">
              <div className="value-icon">🔍</div>
              <h3>Uzticamība</h3>
              <p>Mūsu platformas profesionāļi ir pārbaudīti eksperti savās jomās.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🛡️</div>
              <h3>Drošība</h3>
              <p>Lietotāju dati un sensitīva informācija tiek aizsargāta ar augstākā līmeņa drošību.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">⚖️</div>
              <h3>Pieejamība</h3>
              <p>Mēs strādājam, lai padarītu ekspertu zināšanas pieejamas visiem.</p>
            </div>
          </div>
        </section>
        
        <section className="about-how-it-works">
          <h2>Kā tas darbojas</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Uzdod jautājumu</h3>
              <p>Pierakstieties platformā un uzdodiet savu jautājumu, izvēloties atbilstošu kategoriju.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Saņem atbildi</h3>
              <p>Profesionāļi ar pieredzi izvēlētajā jomā sniegs atbildi uz jūsu jautājumu.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Novērtē kvalitāti</h3>
              <p>Pieņem risinājumu un sniedz atsauksmi, lai palīdzētu citiem lietotājiem.</p>
            </div>
          </div>
        </section>
        
        <section className="about-team">
          <h2>Mūsu komanda</h2>
          <div className="team-members">
            <div className="team-member">
              <div className="member-photo"></div>
              <h3>Deniss Ustinovičš</h3>
              <p className="member-role">Dibinātājs un CEO</p>
              <p className="member-desc">Denisam ir vairāk nekā 15 gadu pieredze IT nozarē, un viņš redzēja nepieciešamību pēc uzticamas platformas, kur cilvēki var saņemt profesionālu palīdzību.</p>
            </div>
            <div className="team-member">
              <div className="member-photo"></div>
              <h3>Artjoms Harkins</h3>
              <p className="member-role">Produktu vadītāja</p>
              <p className="member-desc">Artjoms ir atbildīga par platformas attīstību un nodrošina, ka tā atbilst gan lietotāju, gan profesionāļu vajadzībām.</p>
            </div>
            <div className="team-member">
              <div className="member-photo"></div>
              <h3>Rolands Kalniņš</h3>
              <p className="member-role">Tehnoloģiju vadītājs</p>
              <p className="member-desc">Rolands vada mūsu tehnoloģisko risinājumu izstrādi un uzturēšanu, nodrošinot drošu un ērtu platformas darbību.</p>
            </div>
          </div>
        </section>
        
        <section className="about-join-us">
          <div className="join-content">
            <h2>Pievienojies mums!</h2>
            <p>Esam pārliecināti, ka katra cilvēka zināšanas un pieredze var palīdzēt citiem. Ja esi profesionālis savā jomā un vēlies dalīties savās zināšanās, pievienojies mūsu platformai kā eksperts.</p>
            <button 
              className="btn btn-primary"
              onClick={() => setCurrentPage('register')}
            >
              Kļūt par ekspertu
            </button>
          </div>
        </section>
        
        <section className="about-contact">
          <h2>Sazinies ar mums</h2>
          <div className="contact-info">
            <div className="contact-item">
              <div className="contact-icon">📧</div>
              <h3>E-pasts</h3>
              <p>info@professionalanswers.lv</p>
            </div>
            <div className="contact-item">
              <div className="contact-icon">📞</div>
              <h3>Tālrunis</h3>
              <p>+371 12345678</p>
            </div>
            <div className="contact-item">
              <div className="contact-icon">📍</div>
              <h3>Adrese</h3>
              <p>Brīvības iela 100, Rīga, LV-1001</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AboutUsPage;