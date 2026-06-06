import logoSrc from "../logo.png";

export default function Logo() {
  return (
    <img
      src={logoSrc}
      alt="Ultra Aluminum logo"
      className="h-full w-full object-cover"
      draggable={false}
    />
  );
}
