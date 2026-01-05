import Image from "next/image";

export default function Logo() {
    return <Image src="/logo.jpeg" alt="logo" width={25} height={0} className="transition-all group-hover:scale-110" />;
}