import type { ImageAsset } from "@/types";

/**
 * next/image quality for foreground photos and the logo (must be listed in images.qualities in next.config.ts).
 * The supplied photos are small (423–1083px wide) and already JPEG-compressed, so they are usually served at full size;
 * at the default of 75 the WebP re-encode halves their file size again and softens them. Faded hero backgrounds
 * and the video poster keep the default, where the difference is not visible.
 */
export const imageQuality = 90;

/** All photography is client-supplied (Website Content document and Brand Style Guide). */
export const images = {
  hero: { src: "/images/hero-port-trucks.jpg", alt: "Two lorries with containers in front of a container ship at a port", width: 1083, height: 577 },
  inspector: { src: "/images/customs-inspector-containers.jpg", alt: "Customs officer in a hard hat checking shipping containers at a port", width: 541, height: 361 },
  shipAerial: { src: "/images/container-ship-aerial.jpg", alt: "Container ship loaded with containers at sea", width: 544, height: 247 },
  exportStamp: { src: "/images/customs-invoice-export-stamp.jpg", alt: "Customs invoice stamped export", width: 423, height: 254 },
  portWorker: { src: "/images/port-worker-lorry.jpg", alt: "Port worker with a tablet beside containers and a lorry", width: 247, height: 244 },
  lorryContainers: { src: "/images/lorry-containers.jpg", alt: "Lorry carrying a container past stacked shipping containers", width: 247, height: 247 },
  shipPlane: { src: "/images/ship-and-plane-port.jpg", alt: "Cargo ship and aircraft at a container port", width: 544, height: 247 },
  fishCrates: { src: "/images/fish-market-crates.jpg", alt: "Crates of fresh fish on ice in a fish market", width: 490, height: 327 },
  food: { src: "/images/9b447d3f904ce2f7ebf280611a62596d.webp", alt: "Fresh salmon, beef, eggs, vegetables and pulses laid out on a table", width: 976, height: 651 },
  cattle: { src: "/images/cattle-barn.jpg", alt: "Tagged calves in a barn", width: 541, height: 360 },
  produce: { src: "/images/cold-store-apples.jpg", alt: "Crates of apples in a refrigerated cold store", width: 1015, height: 555 },
  gas: { src: "/images/gas-cylinder-trailer.jpg", alt: "Gas cylinder trailer parked at a depot", width: 819, height: 542 },
  pallets: { src: "/images/warehouse-pallets.jpg", alt: "Wrapped pallets of boxes at a warehouse loading dock", width: 920, height: 613 },
  cars: { src: "/images/car-transporter.jpg", alt: "Car transporter lorry loaded with new cars", width: 1001, height: 563 },
  steel: { src: "/images/steel-pipes-trailer.jpg", alt: "Flatbed trailer loaded with steel pipes", width: 947, height: 595 },
  forest: { src: "/images/deforestation-aerial.jpg", alt: "Aerial view of cleared forest land beside rainforest", width: 920, height: 613 },
} satisfies Record<string, ImageAsset>;

export const logos = {
  /** Full-colour logo with slogan, transparent, for dark backgrounds */
  mainDark: { src: "/logos/customs-wise-main-dark.png", width: 720, height: 379 },
  /** Logo without slogan, transparent, for dark backgrounds (brand guide: use for websites/small sizes) */
  alternativeDark: { src: "/logos/customs-wise-alternative-dark.png", width: 626, height: 272 },
} as const;
