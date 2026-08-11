import { CalendarDays, Heart, MapPin, MessageCircle, PawPrint, Phone, Share2 } from "lucide-react";
import { useMemo } from "react";
import { useLocation } from "wouter";
import { TeamBack, TeamShell } from "../components/TeamUI";
import { petListings } from "../data/mockData";

export default function PetDetailPage() {
  const [location] = useLocation();
  const id = location.split("/").pop();
  const listing = useMemo(() => petListings.find((item) => item.id === id) ?? petListings[0], [id]);

  return (
    <TeamShell className="detail-page">
      <section className="detail-image">
        <img src={listing.image} alt={listing.title} />
        <div>
          <TeamBack href="/listings" />
          <span>
            <button className="icon-button" aria-label="Favori"><Heart size={24} /></button>
            <button className="icon-button" aria-label="Paylaş"><Share2 size={22} /></button>
          </span>
        </div>
      </section>

      <article className="detail-card">
        <div className="pill">{listing.type}</div>
        <h1>{listing.title}</h1>
        <p className="breed">{listing.species} • {listing.age}</p>

        <div className="facts">
          <span><MapPin size={18} /> {listing.location}</span>
          <span><CalendarDays size={18} /> {listing.distance}</span>
        </div>

        <section className="info">
          <p><MessageCircle /> {listing.description}</p>
          <p><PawPrint /> Sahip: {listing.owner}</p>
          <p><Phone /> İletişim: {listing.contact}</p>
          {listing.lastSeen ? <p><MapPin /> Son görüldüğü yer: {listing.lastSeen}</p> : null}
        </section>
      </article>
    </TeamShell>
  );
}
