import Image from "next/image";

export default function PlaceholderImage() {
  return (
    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
      <span className="text-gray-400">No Image</span>
    </div>
  );
}

