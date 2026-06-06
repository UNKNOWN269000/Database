import PackingTable from "./PackingTable";

/**
 * Anodizing Packing — uses the shared PackingTable component with the
 * anodizing_pack category. The shared component renders the full 36-column
 * structure (Production Date, Packing Date, Production Type, Surface, Profile,
 * Length, Premium Full Pack x5, Premium Pcs x4, Non-Brand Full Pack x5,
 * Non-Brand Pcs x4, Weight Bar x3, Premium/Non-Brand/Weight Bar Total Packing x3).
 */
export default function AnodizingPackingTable({ color }: { color: string }) {
  return <PackingTable category="anodizing_pack" color={color} title="Anodizing Packing" showBucket={false} />;
}
