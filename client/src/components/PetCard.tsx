import type { FC } from "react";
import { Heart, MapPin } from "lucide-react";
import { Link } from "wouter";

type Pet = {
  id: number | string;
  name?: string;
  animal?: string;
  breed?: string;
  location?: string;
  date?: string;
  image?: string;
};

const PetCard: FC<{ pet: Pet }> = ({ pet }) => {
  return (
    <article className="pet-card">
      <Link href={`/pet/${pet.id}`}>
        <img
          src={pet.image || "/public/icons.svg"}
          alt={pet.name || "pet"}
          className="pet-card__image"
        />
      </Link>

      <div className="pet-card__body">
        <h3 className="pet-card__title">{pet.name || "İsim yok"}</h3>
        <p className="pet-card__subtitle">
          {pet.breed || pet.animal || "Tür bilinmiyor"} • {pet.location}
        </p>

        <div className="pet-card__meta">
          <small className="pet-card__date">{pet.date}</small>
          <button aria-label="Favori" className="icon-button">
            <Heart size={16} />
          </button>
        </div>
      </div>
    </article>
  );
};

export default PetCard;
