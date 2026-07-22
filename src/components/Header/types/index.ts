export interface HeaderProps {
  addLabel?: string;
  searchPlaceholder?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
  onMobileMenuClick?: () => void;
  userEmail?: string;
}
