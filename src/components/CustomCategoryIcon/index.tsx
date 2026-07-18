import {
  BookMarked,
  Dices,
  Drama,
  FolderHeart,
  Heart,
  Landmark,
  ListChecks,
  MapPin,
  ShoppingBag,
  Utensils,
} from "lucide-react";

interface CustomCategoryIconProps {
  name: string;
  size?: number;
  className?: string;
}

export function CustomCategoryIcon({ className, name, size = 16 }: CustomCategoryIconProps) {
  const props = { className, size, strokeWidth: 2.2 };

  if (name === "map-pin") return <MapPin {...props} />;
  if (name === "utensils") return <Utensils {...props} />;
  if (name === "dices") return <Dices {...props} />;
  if (name === "shopping-bag") return <ShoppingBag {...props} />;
  if (name === "exhibition") return <Landmark {...props} />;
  if (name === "theater") return <Drama {...props} />;
  if (name === "heart") return <Heart {...props} />;
  if (name === "book-marked") return <BookMarked {...props} />;
  if (name === "list") return <ListChecks {...props} />;

  return <FolderHeart {...props} />;
}
