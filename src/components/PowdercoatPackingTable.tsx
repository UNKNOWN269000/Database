import PackingTable from "./PackingTable";

export default function PowdercoatPackingTable({ color }: { color: string }) {
  return <PackingTable category="powdercoat_pack" color={color} title="Powdercoat Packing" />;
}
