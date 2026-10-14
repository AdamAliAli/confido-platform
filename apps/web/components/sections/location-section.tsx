const MAP_URL = 'https://maps.app.goo.gl/n93NvczV7hcR458AA';

export function LocationSection() {
  return (
    <section id="about-us" className="location-section" aria-labelledby="location-heading">
      <div className="location-more">
        <i aria-hidden="true" />
        <span>MORE ABOUT US</span>
      </div>

      <div className="location-content">
        <p className="location-kicker">OUR PLACE</p>

        <div className="location-grid">
          <h2 id="location-heading">Confido</h2>

          <div className="location-details">
            <span>Based in MY</span>
            <p>Kuala Lumpur, Malaysia</p>
            <a href={MAP_URL} target="_blank" rel="noreferrer">
              View our location <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
