export const IMAGE_LIBRARY = {
  avatars: [
    { id: "avatar-k1", label: "Avatar K1", src: "/assets/avatars/K1.png" },
    { id: "avatar-k2", label: "Avatar K2", src: "/assets/avatars/K2.png" },
    { id: "avatar-m1", label: "Avatar M1", src: "/assets/avatars/M1.png" },
    { id: "avatar-m2", label: "Avatar M2", src: "/assets/avatars/M2.png" },
  ],
  characterAvatars: [
    { id: "character-pd1", label: "D&D PD1", src: "/assets/character-avatars/PD1.png" },
    { id: "character-pd2", label: "D&D PD2", src: "/assets/character-avatars/PD2.png" },
    { id: "character-pd3", label: "D&D PD3", src: "/assets/character-avatars/PD3.png" },
    { id: "character-pd4", label: "D&D PD4", src: "/assets/character-avatars/PD4.png" },
    { id: "character-pz1", label: "Zew PZ1", src: "/assets/character-avatars/PZ1.png" },
    { id: "character-pz2", label: "Zew PZ2", src: "/assets/character-avatars/PZ2.png" },
  ],
  campaignIcons: [
    { id: "campaign-icon-d1", label: "Ikona D1", src: "/assets/campaign-icons/D1.png" },
    { id: "campaign-icon-d2", label: "Ikona D2", src: "/assets/campaign-icons/D2.png" },
    { id: "campaign-icon-d3", label: "Ikona D3", src: "/assets/campaign-icons/D3.png" },
    { id: "campaign-icon-z1", label: "Ikona Z1", src: "/assets/campaign-icons/Z1.png" },
    { id: "campaign-icon-z2", label: "Ikona Z2", src: "/assets/campaign-icons/Z2.png" },
    { id: "campaign-icon-z3", label: "Ikona Z3", src: "/assets/campaign-icons/Z3.png" },
  ],
  campaignBanners: [
    { id: "campaign-banner-dn1", label: "Baner Dn1", src: "/assets/campaign-banners/Dn1.png" },
    { id: "campaign-banner-dn2", label: "Baner Dn2", src: "/assets/campaign-banners/Dn2.png" },
    { id: "campaign-banner-dn3", label: "Baner Dn3", src: "/assets/campaign-banners/Dn3.png" },
    { id: "campaign-banner-ze1", label: "Baner Ze1", src: "/assets/campaign-banners/Ze1.png" },
    { id: "campaign-banner-ze2", label: "Baner Ze2", src: "/assets/campaign-banners/Ze2.png" },
    { id: "campaign-banner-ze3", label: "Baner Ze3", src: "/assets/campaign-banners/Ze3.png" },
  ],
};

export const IMAGE_PLACEHOLDERS = {
  avatars: "/assets/placeholder/Avatar.png",
  characterAvatars: "/assets/placeholder/Postac.png",
  campaignIcons: "/assets/placeholder/Logo.png",
  campaignBanners: "/assets/placeholder/Baner.png",
};

export function imageLibraryItems(type) {
  return IMAGE_LIBRARY[type] || [];
}

export function imagePlaceholder(type) {
  return IMAGE_PLACEHOLDERS[type] || "";
}

export function imageOrPlaceholder(value, type) {
  return value || imagePlaceholder(type);
}
